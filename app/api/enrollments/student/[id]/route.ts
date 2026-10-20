import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    try {
      const springRes = await fetch(`${BACKEND_URL}/api/enrollments/student/${id}`)
      if (springRes.ok) {
        const data = await springRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    const container = getServiceContainer()
    const enrollmentService = container.getEnrollmentService()

    const enrollments = await enrollmentService.getStudentEnrollments(id)
    return NextResponse.json(enrollments)
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
