import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    try {
      const springRes = await fetch(`${BACKEND_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await springRes.json()
      if (!springRes.ok) {
        return NextResponse.json({ error: data.error || 'Erreur inscription' }, { status: springRes.status })
      }
      return NextResponse.json(data, { status: 201 })
    } catch {
      // If student is registering prior to payment step
      const { studentId, courseId, cardData, studentEmail, firstName, lastName } = body

      if (cardData && (studentId || studentEmail) && courseId) {
        const container = getServiceContainer()
        const enrollmentService = container.getEnrollmentService()
        const { enrollment, paymentId } = await enrollmentService.enrollStudent(
          studentId || studentEmail,
          courseId,
          cardData
        )
        return NextResponse.json({ enrollment, paymentId }, { status: 201 })
      }

      // If pre-registration step
      return NextResponse.json({
        success: true,
        message: 'Pré-inscription validée',
        studentEmail: studentEmail || studentId,
        courseId,
      }, { status: 200 })
    }
  } catch (error) {
    if (error instanceof BusinessException) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
