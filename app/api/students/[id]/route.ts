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
      const springRes = await fetch(`${BACKEND_URL}/api/students/${id}/profile`)
      if (springRes.ok) {
        const data = await springRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    const container = getServiceContainer()
    const studentService = container.getStudentService()
    const profile = await studentService.getStudentProfile(id)
    return NextResponse.json(profile)
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await req.json()

    try {
      const springRes = await fetch(`${BACKEND_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (springRes.ok) {
        const data = await springRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    const container = getServiceContainer()
    const studentService = container.getStudentService()

    await studentService.updateStudent(id, updates)
    const profile = await studentService.getStudentProfile(id)

    return NextResponse.json(profile)
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
