import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enrollmentId, studentId, studentEmail, courseId, amount, cardData } = body

    if (!courseId || !amount || !cardData) {
      return NextResponse.json({ error: 'Données de paiement incomplètes' }, { status: 400 })
    }

    const payload = {
      enrollmentId: enrollmentId || 'ENR-AUTO',
      studentId: studentId || studentEmail,
      studentEmail: studentEmail || studentId,
      courseId,
      amount: Number(amount),
      cardData: {
        cardNumber: cardData.number || cardData.cardNumber,
        expiryMonth: Number(cardData.expiry ? cardData.expiry.split('/')[0] : cardData.expiryMonth),
        expiryYear: Number(cardData.expiry ? `20${cardData.expiry.split('/')[1]}` : cardData.expiryYear),
        cvv: cardData.cvv,
        cardholderName: cardData.name || cardData.cardholderName || 'Titulaire',
      },
    }

    try {
      const springRes = await fetch(`${BACKEND_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await springRes.json()

      if (!springRes.ok) {
        return NextResponse.json({ error: data.error || 'Erreur lors du traitement du paiement' }, { status: springRes.status })
      }

      return NextResponse.json(data)
    } catch {
      // Local fallback container
      const container = getServiceContainer()
      const payment = await container.getPaymentService().processPayment(
        payload.enrollmentId,
        payload.studentId,
        payload.courseId,
        payload.amount,
        {
          cardNumber: payload.cardData.cardNumber,
          expiryMonth: payload.cardData.expiryMonth,
          expiryYear: payload.cardData.expiryYear,
          cvv: payload.cardData.cvv,
          cardholderName: payload.cardData.cardholderName,
        }
      )

      return NextResponse.json({
        success: true,
        enrollmentId: payload.enrollmentId,
        paymentId: payment.id,
        message: 'Paiement traité avec succès',
      })
    }
  } catch (error) {
    console.error('[Payment API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
