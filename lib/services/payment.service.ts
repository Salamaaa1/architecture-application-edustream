import { v4 as uuid } from 'uuid'
import { CardData, Payment } from '@/lib/types'
import {
  PaymentRefusedException,
  InsufficientFundsException,
} from '@/lib/exceptions'
import { CardValidator } from './validators'
import { PaymentRepository } from '@/lib/repositories/interface'

export interface PaymentGateway {
  processPayment(amount: number, cardData: CardData): Promise<string>
}

export class MockPaymentGateway implements PaymentGateway {
  private minBalance = 100
  private rejectionRate = 0.1

  async processPayment(amount: number, cardData: CardData): Promise<string> {
    const cardNumber = cardData.cardNumber.replace(/\D/g, '')
    const lastDigits = parseInt(cardNumber.slice(-4), 10)

    CardValidator.validateCardData(cardData)

    const simulatedBalance = (lastDigits * 1000) % 50000

    if (simulatedBalance < amount) {
      throw new InsufficientFundsException()
    }

    const random = Math.random()
    if (random < this.rejectionRate) {
      throw new PaymentRefusedException('Transaction refusée par la banque')
    }

    if (cardData.cardNumber.includes('4111111111111111')) {
      throw new PaymentRefusedException('Carte bloquée')
    }

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
