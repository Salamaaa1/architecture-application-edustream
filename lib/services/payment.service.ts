import { v4 as uuid } from 'uuid'
import { CardData, Payment } from '@/lib/types'
import { PaymentRefusedException } from '@/lib/exceptions'
import { CardValidator } from './validators'
import { PaymentRepository } from '@/lib/repositories/interface'

export interface PaymentGateway {
  processPayment(amount: number, cardData: CardData): Promise<string>
}

export class MockPaymentGateway implements PaymentGateway {
  async processPayment(_amount: number, cardData: CardData): Promise<string> {
    // Projet de test : toute carte qui passe la validation (Luhn, expiration, CVV,
    // titulaire) est acceptée. Aucun refus aléatoire, aucune carte « bloquée »,
    // aucun solde simulé.
    CardValidator.validateCardData(cardData)

    return `TXN-${uuid().substring(0, 8)}`
  }
}

export class PaymentService {
  constructor(
    private paymentGateway: PaymentGateway,
    private paymentRepository: PaymentRepository
  ) {}

  async processPayment(
    enrollmentId: string,
    studentId: string,
    courseId: string,
    amount: number,
    cardData: CardData
  ): Promise<Payment> {
    CardValidator.validateCardData(cardData)

    let transactionId: string
    let failureReason: string | undefined

    try {
      transactionId = await this.paymentGateway.processPayment(
        amount,
        cardData
      )
    } catch (error) {
      failureReason =
        error instanceof Error ? error.message : 'Erreur inconnue'
      transactionId = `FAILED-${uuid().substring(0, 8)}`

      const payment: Payment = {
        id: uuid(),
        enrollmentId,
        studentId,
        courseId,
        amount,
        status: 'failed',
        cardLast4: CardValidator.maskCardNumber(cardData.cardNumber),
        transactionId,
        createdAt: new Date(),
        updatedAt: new Date(),
        failureReason,
      }

      await this.paymentRepository.create(payment)

      if (error instanceof PaymentRefusedException) {
        throw error
      }
      throw new PaymentRefusedException(failureReason)
    }

    const payment: Payment = {
      id: uuid(),
      enrollmentId,
      studentId,
      courseId,
      amount,
      status: 'completed',
      cardLast4: CardValidator.maskCardNumber(cardData.cardNumber),
      transactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.paymentRepository.create(payment)
    return payment
  }

  async getPaymentDetails(paymentId: string): Promise<Payment | null> {
    return this.paymentRepository.findById(paymentId)
  }

  async getStudentPayments(studentId: string): Promise<Payment[]> {
    return this.paymentRepository.findByStudent(studentId)
  }
}
