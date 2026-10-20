import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CardValidator } from '@/lib/services/validators'
import { InvalidCardException } from '@/lib/exceptions'
import type { CardData } from '@/lib/types'

// Date figée : les tests ne dépendent plus du jour d'exécution (juin 2026).
const NOW = new Date('2026-06-15T12:00:00Z')
const YEAR = 2026
const MONTH = 6

const VALID_VISA = '4532015112830366' // Luhn OK, 16 chiffres
const VALID_VISA_13 = '4222222222222' // Luhn OK, 13 chiffres
const VALID_19 = '6011000000000000001' // Luhn OK, 19 chiffres
const VALID_AMEX = '378282246310005' // Luhn OK, 15 chiffres
const VALID_MC = '5555555555554444' // Luhn OK

const validCard = (over: Partial<CardData> = {}): CardData => ({
  cardNumber: VALID_VISA,
  expiryMonth: 12,
  expiryYear: YEAR + 2,
  cvv: '123',
  cardholderName: 'Karim Alami',
  ...over,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('CardValidator.validateCardNumber', () => {
  it.each([
    ['visa 16 chiffres', VALID_VISA],
    ['borne basse : 13 chiffres', VALID_VISA_13],
    ['borne haute : 19 chiffres', VALID_19],
    ['amex 15 chiffres', VALID_AMEX],
    ['mastercard', VALID_MC],
    ['séparateur espace', '4532 0151 1283 0366'],
    ['séparateur tiret', '4532-0151-1283-0366'],
    ['séparateur point', '4532.0151.1283.0366'],
  ])('accepte %s', (_label, number) => {
    expect(CardValidator.validateCardNumber(number)).toBe(true)
  })

  it.each([
    ['Luhn invalide (dernier chiffre modifié)', '4532015112830367'],
    ['Luhn invalide (chiffre central modifié)', '4532015112930366'],
    ['12 chiffres (juste sous la borne)', '123456789018'],
    ['20 chiffres (juste au-dessus de la borne)', '45320151128303660000'],
    ['chaîne vide', ''],
    ['espaces seulement', '    '],
    ['lettres', 'abcdefghijklmnop'],
    ['lettres mélangées à un numéro valide', '4532a015112830366'],
    ['suite de zéros trop courte', '0000'],
  ])('rejette %s', (_label, number) => {
    expect(CardValidator.validateCardNumber(number)).toBe(false)
  })

  it('rejette une valeur non-string sans planter', () => {
    expect(CardValidator.validateCardNumber(undefined as unknown as string)).toBe(false)
    expect(CardValidator.validateCardNumber(4532015112830366 as unknown as string)).toBe(false)
  })

  it('détecte une transposition de chiffres adjacents (cas classique de Luhn)', () => {
    expect(CardValidator.validateCardNumber('4532015112830366')).toBe(true)
    expect(CardValidator.validateCardNumber('4532015112830636')).toBe(false)
  })
})

describe('CardValidator.validateExpiry (date figée : juin 2026)', () => {
  it('accepte le mois courant (dernier mois de validité)', () => {
    expect(CardValidator.validateExpiry(MONTH, YEAR)).toBe(true)
  })

  it('rejette le mois précédent de l\'année courante', () => {
    expect(CardValidator.validateExpiry(MONTH - 1, YEAR)).toBe(false)
  })

  it('accepte le mois suivant de l\'année courante', () => {
    expect(CardValidator.validateExpiry(MONTH + 1, YEAR)).toBe(true)
  })

  it('accepte janvier et décembre de l\'année suivante (bornes du mois)', () => {
    expect(CardValidator.validateExpiry(1, YEAR + 1)).toBe(true)
    expect(CardValidator.validateExpiry(12, YEAR + 1)).toBe(true)
  })

  it('rejette décembre de l\'année précédente', () => {
    expect(CardValidator.validateExpiry(12, YEAR - 1)).toBe(false)
  })

  it('accepte exactement +20 ans et rejette +21 ans', () => {
    expect(CardValidator.validateExpiry(1, YEAR + 20)).toBe(true)
    expect(CardValidator.validateExpiry(12, YEAR + 20)).toBe(true)
    expect(CardValidator.validateExpiry(1, YEAR + 21)).toBe(false)
  })

  it.each([0, 13, -5, 1.5, NaN])('rejette le mois invalide %s', (month) => {
    expect(CardValidator.validateExpiry(month, YEAR + 1)).toBe(false)
  })

  it('rejette une année non entière ou NaN', () => {
    expect(CardValidator.validateExpiry(6, NaN)).toBe(false)
    expect(CardValidator.validateExpiry(6, YEAR + 0.5)).toBe(false)
  })

  it('suit le changement d\'année sans redémarrage (année non figée au chargement)', () => {
    expect(CardValidator.validateExpiry(12, 2026)).toBe(true)
    vi.setSystemTime(new Date('2027-01-02T12:00:00Z'))
    expect(CardValidator.validateExpiry(12, 2026)).toBe(false)
    expect(CardValidator.validateExpiry(1, 2027)).toBe(true)
  })
})

describe('CardValidator.validateCVV', () => {
  it.each(['123', '1234', '000', ' 123 '])('accepte %j', (cvv) => {
    expect(CardValidator.validateCVV(cvv)).toBe(true)
  })

  it.each([
    ['2 chiffres', '12'],
    ['5 chiffres', '12345'],
    ['vide', ''],
    ['lettres', 'abc'],
    ['chiffres + lettre', '12a'],
    ['chiffres séparés', '1 2 3'],
    ['signe', '-123'],
  ])('rejette %s', (_label, cvv) => {
    expect(CardValidator.validateCVV(cvv)).toBe(false)
  })

  it('rejette une valeur non-string', () => {
    expect(CardValidator.validateCVV(123 as unknown as string)).toBe(false)
    expect(CardValidator.validateCVV(null as unknown as string)).toBe(false)
  })
})

describe('CardValidator.validateCardholderName', () => {
  it('accepte exactement 3 et exactement 50 caractères', () => {
    expect(CardValidator.validateCardholderName('Ali')).toBe(true)
    expect(CardValidator.validateCardholderName('A'.repeat(50))).toBe(true)
  })

  it('rejette 2 et 51 caractères', () => {
    expect(CardValidator.validateCardholderName('Al')).toBe(false)
    expect(CardValidator.validateCardholderName('A'.repeat(51))).toBe(false)
  })

  it('ignore les espaces autour (trim) pour le calcul de la longueur', () => {
    expect(CardValidator.validateCardholderName('  Ab ')).toBe(false)
    expect(CardValidator.validateCardholderName('  Abc  ')).toBe(true)
  })

  it('rejette vide, espaces seulement et valeurs non-string', () => {
    expect(CardValidator.validateCardholderName('')).toBe(false)
    expect(CardValidator.validateCardholderName('     ')).toBe(false)
    expect(CardValidator.validateCardholderName(undefined as unknown as string)).toBe(false)
  })
})

describe('CardValidator.getCardType', () => {
  it.each([
    ['4532015112830366', 'VISA'],
    ['4222222222222', 'VISA'],
    ['5100 1234 5678 9010', 'MASTERCARD'],
    ['5500 1234 5678 9010', 'MASTERCARD'],
    ['2221 0000 0000 0009', 'MASTERCARD'], // nouvelle plage 2221-2720
    ['2720 9900 0000 0000', 'MASTERCARD'],
    ['3400 123456 78901', 'AMEX'],
    ['3700 123456 78901', 'AMEX'],
  ])('%s -> %s', (number, type) => {
    expect(CardValidator.getCardType(number)).toBe(type)
  })

  it.each([
    ['5000 0000 0000 0000'], // 50 : hors plage 51-55
    ['5600 0000 0000 0000'], // 56 : hors plage
    ['2220 0000 0000 0000'], // juste sous 2221
    ['2721 0000 0000 0000'], // juste au-dessus de 2720
    ['3000 0000 0000 0000'], // 30 : ni 34 ni 37
    ['6011 0000 0000 0000'],
    [''],
  ])('%j -> UNKNOWN', (number) => {
    expect(CardValidator.getCardType(number)).toBe('UNKNOWN')
  })
})

describe('CardValidator.maskCardNumber', () => {
  it('masque tout sauf les 4 derniers chiffres', () => {
    expect(CardValidator.maskCardNumber('4532 0151 1283 0366')).toBe('****-****-****-0366')
  })

  it('ne révèle jamais les chiffres masqués', () => {
    const masked = CardValidator.maskCardNumber(VALID_VISA)
    expect(masked).not.toContain('4532')
    expect(masked).not.toContain('0151')
    expect(masked).not.toContain('1283')
  })

  it('fonctionne avec des séparateurs différents', () => {
    expect(CardValidator.maskCardNumber('4532-0151-1283-0366')).toBe('****-****-****-0366')
  })
})

describe('CardValidator.validateCardData', () => {
  it('ne lève aucune exception pour une carte entièrement valide', () => {
    expect(() => CardValidator.validateCardData(validCard())).not.toThrow()
  })

  it('accepte une carte AMEX avec CVV à 4 chiffres', () => {
    expect(() =>
      CardValidator.validateCardData(validCard({ cardNumber: VALID_AMEX, cvv: '1234' }))
    ).not.toThrow()
  })

  it.each([
    ['numéro de carte', { cardNumber: '1234' }, 'Numéro de carte invalide'],
    ['date d\'expiration', { expiryYear: YEAR - 1 }, "Date d'expiration invalide"],
    ['CVV', { cvv: '12' }, 'CVV invalide'],
    ['nom du titulaire', { cardholderName: 'Al' }, 'Nom du titulaire invalide'],
  ])('lève InvalidCardException avec le bon message : %s', (_label, override, message) => {
    const act = () => CardValidator.validateCardData(validCard(override))
    expect(act).toThrow(InvalidCardException)
    expect(act).toThrow(message)
  })

  it('rapporte le premier champ invalide quand plusieurs le sont (ordre : numéro, date, CVV, nom)', () => {
    const allWrong = validCard({
      cardNumber: '1234',
      expiryYear: YEAR - 1,
      cvv: '1',
      cardholderName: '',
    })
    expect(() => CardValidator.validateCardData(allWrong)).toThrow('Numéro de carte invalide')

    expect(() =>
      CardValidator.validateCardData({ ...allWrong, cardNumber: VALID_VISA })
    ).toThrow("Date d'expiration invalide")

    expect(() =>
      CardValidator.validateCardData({ ...allWrong, cardNumber: VALID_VISA, expiryYear: YEAR + 1 })
    ).toThrow('CVV invalide')
  })

  it('lève une exception métier dont le message contient la raison du rejet', () => {
    let error: unknown
    try {
      CardValidator.validateCardData(validCard({ cvv: 'x' }))
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(InvalidCardException)
    expect((error as Error).message).toContain('CVV invalide')
  })
})
