import { describe, it, expect, vi } from 'vitest'
import { MockPaymentGateway, PaymentService, PaymentGateway } from '@/lib/services/payment.service'
import { InMemoryPaymentRepository } from '@/lib/repositories/implementation'
import { PaymentRefusedException, InvalidCardException } from '@/lib/exceptions'
import { validCard } from './_helpers'

// Règle du projet : « si la carte passe la validation (Luhn…), elle est acceptée ».
describe('MockPaymentGateway — toute carte valide est acceptée (tueurs)', () => {
  const gateway = new MockPaymentGateway()

  it('accepte une carte valide et renvoie un identifiant de transaction TXN-xxxxxxxx', async () => {
    await expect(gateway.processPayment(1000, validCard())).resolves.toMatch(/^TXN-[0-9a-f]{8}$/)
  })

  it('accepte la carte de test 4111 1111 1111 1111 (Luhn valide), avec ou sans séparateurs', async () => {
    await expect(gateway.processPayment(100, validCard({ cardNumber: '4111111111111111' }))).resolves.toMatch(/^TXN-/)
    await expect(gateway.processPayment(100, validCard({ cardNumber: '4111 1111 1111 1111' }))).resolves.toMatch(/^TXN-/)
    await expect(gateway.processPayment(100, validCard({ cardNumber: '4111-1111-1111-1111' }))).resolves.toMatch(/^TXN-/)
  })

  it('accepte une carte valide quel que soit le montant (aucun solde simulé)', async () => {
    for (const amount of [1, 16000, 16001, 49999, 50000, 1_000_000]) {
      await expect(gateway.processPayment(amount, validCard())).resolves.toMatch(/^TXN-/)
    }
  })

  it('accepte une carte valide quels que soient ses 4 derniers chiffres (ex. 0000)', async () => {
    await expect(gateway.processPayment(5000, validCard({ cardNumber: '4000000000000002' }))).resolves.toMatch(/^TXN-/)
    await expect(gateway.processPayment(5000, validCard({ cardNumber: '5500000000000004' }))).resolves.toMatch(/^TXN-/)
  })

  it('n\'a aucun refus aléatoire : 300 paiements valides, 300 acceptés', async () => {
    const results = await Promise.all(Array.from({ length: 300 }, () => gateway.processPayment(100, validCard())))
    expect(results.every((r) => /^TXN-/.test(r))).toBe(true)
  })

  it('valide la carte avant tout paiement (carte invalide => InvalidCardException)', async () => {
    await expect(gateway.processPayment(10, validCard({ cvv: '1' }))).rejects.toThrow(InvalidCardException)
    await expect(gateway.processPayment(10, validCard({ cardNumber: '4532015112830367' }))).rejects.toThrow(InvalidCardException)
  })
})

describe('PaymentService.processPayment — enregistrement des paiements (tueurs)', () => {
  const setup = (impl: PaymentGateway['processPayment']) => {
    const repo = new InMemoryPaymentRepository()
    const gateway: PaymentGateway = { processPayment: vi.fn().mockImplementation(impl) }
    return { repo, gateway, service: new PaymentService(gateway, repo) }
  }

  it('paiement réussi : statut completed, montant, carte masquée et transaction du fournisseur', async () => {
    const { repo, service } = setup(async () => 'TXN-ABC123')
    const p = await service.processPayment('e1', 's1', 'c1', 1490, validCard())
    expect(p.status).toBe('completed')
    expect(p.amount).toBe(1490)
    expect(p.transactionId).toBe('TXN-ABC123')
    expect(p.cardLast4).toBe('****-****-****-0366')
    expect(p.failureReason).toBeUndefined()
    expect(await repo.findById(p.id)).toEqual(p)
  })

  it('refus bancaire : la MÊME exception est relancée, sans surcouche de message', async () => {
    const original = new PaymentRefusedException('Carte perdue')
    const { service } = setup(async () => {
      throw original
    })
    let caught: unknown
    try {
      await service.processPayment('e1', 's1', 'c1', 100, validCard())
    } catch (e) {
      caught = e
    }
    expect(caught).toBe(original)
    expect((caught as Error).message).toBe('Paiement refusé : Carte perdue')
  })

  it('refus bancaire : un paiement « failed » est conservé avec son motif', async () => {
    const { repo, service } = setup(async () => {
      throw new PaymentRefusedException('Carte perdue')
    })
    await expect(service.processPayment('e1', 's1', 'c1', 100, validCard())).rejects.toThrow(PaymentRefusedException)
    const saved = await repo.findByStudent('s1')
    expect(saved).toHaveLength(1)
    expect(saved[0].status).toBe('failed')
    expect(saved[0].amount).toBe(100)
    expect(saved[0].enrollmentId).toBe('e1')
    expect(saved[0].transactionId).toMatch(/^FAILED-[0-9a-f]{8}$/)
    expect(saved[0].failureReason).toBe('Paiement refusé : Carte perdue')
    expect(saved[0].cardLast4).toBe('****-****-****-0366')
  })

  it('erreur technique quelconque : convertie en PaymentRefusedException contenant le message', async () => {
    const { repo, service } = setup(async () => {
      throw new Error('Timeout réseau')
    })
    const attempt = service.processPayment('e1', 's1', 'c1', 100, validCard())
    await expect(attempt).rejects.toThrow(PaymentRefusedException)
    await expect(service.processPayment('e2', 's1', 'c1', 100, validCard())).rejects.toThrow('Timeout réseau')
    const saved = await repo.findByStudent('s1')
    expect(saved.every((p) => p.status === 'failed' && p.failureReason === 'Timeout réseau')).toBe(true)
  })

  it('rejet qui n\'est pas une Error : motif « Erreur inconnue »', async () => {
    const { repo, service } = setup(async () => {
      throw 'panne' // eslint-disable-line no-throw-literal
    })
    await expect(service.processPayment('e1', 's1', 'c1', 100, validCard())).rejects.toThrow('Erreur inconnue')
    expect((await repo.findByStudent('s1'))[0].failureReason).toBe('Erreur inconnue')
  })

  it('carte invalide : exception levée AVANT d\'appeler la passerelle, rien n\'est enregistré', async () => {
    const { repo, gateway, service } = setup(async () => 'TXN-X')
    await expect(service.processPayment('e1', 's1', 'c1', 100, validCard({ cvv: 'x' }))).rejects.toThrow(
      InvalidCardException
    )
    expect(gateway.processPayment).not.toHaveBeenCalled()
    expect(await repo.findByStudent('s1')).toEqual([])
  })

  it('getPaymentDetails et getStudentPayments relisent les paiements enregistrés', async () => {
    const { service } = setup(async () => 'TXN-1')
    const p = await service.processPayment('e1', 's1', 'c1', 100, validCard())
    expect(await service.getPaymentDetails(p.id)).toEqual(p)
    expect(await service.getPaymentDetails('inconnu')).toBeNull()
    expect(await service.getStudentPayments('s1')).toEqual([p])
    expect(await service.getStudentPayments('autre')).toEqual([])
  })
})
