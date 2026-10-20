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
        const isAlreadyEnrolled = data.code === 'ENROLLMENT_EXISTS' || (data.error && data.error.toLowerCase().includes('déjà inscrit'))
        return NextResponse.json({
          error: data.error || 'Erreur lors du traitement du paiement',
          code: data.code,
          alreadyEnrolled: isAlreadyEnrolled,
          courseId: payload.courseId,
        }, { status: springRes.status })
      }

      return NextResponse.json({
        ...data,
        courseId: payload.courseId,
      })
    } catch {
      // Local fallback container
      const container = getServiceContainer()
      const studentRepo = container.getStudentRepository()
      const courseRepo = container.getCourseRepository()
      const enrollmentRepo = container.getEnrollmentRepository()

      let student = await studentRepo.findById(payload.studentId)
      if (!student && payload.studentEmail) {
        student = await studentRepo.findByEmail(payload.studentEmail)
      }
      if (!student) {
        student = await studentRepo.create({
          id: (payload.studentId && !payload.studentId.includes('@')) ? payload.studentId : `std-${Date.now().toString(36)}`,
          email: payload.studentEmail || `${payload.studentId}@edustream.ma`,
          firstName: body.firstName || 'Étudiant',
          lastName: body.lastName || 'EduStream',
          password: 'pass',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      // Check existing enrollment
      const existingEnrollment = await enrollmentRepo.findByStudentAndCourse(student.id, payload.courseId)
      if (existingEnrollment && existingEnrollment.status === 'completed') {
        return NextResponse.json({
          error: `L'étudiant est déjà inscrit au cours ${payload.courseId}`,
          code: 'ENROLLMENT_EXISTS',
          alreadyEnrolled: true,
          courseId: payload.courseId,
        }, { status: 409 })
      }

      const payment = await container.getPaymentService().processPayment(
        payload.enrollmentId,
        student.id,
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

      const finalEnrollmentId = existingEnrollment ? existingEnrollment.id : payload.enrollmentId !== 'ENR-AUTO' ? payload.enrollmentId : `enr-${Date.now().toString(36)}`
      if (existingEnrollment) {
        await enrollmentRepo.update(existingEnrollment.id, {
          status: 'completed',
          paymentId: payment.id,
        })
      } else {
        await enrollmentRepo.create({
          id: finalEnrollmentId,
          studentId: student.id,
          courseId: payload.courseId,
          status: 'completed',
          paymentId: payment.id,
          enrolledAt: new Date(),
        })
      }

      return NextResponse.json({
        success: true,
        enrollmentId: finalEnrollmentId,
        paymentId: payment.id,
        courseId: payload.courseId,
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
