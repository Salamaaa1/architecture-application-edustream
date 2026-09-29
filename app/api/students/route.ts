import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function GET() {
  try {
    const springRes = await fetch(`${BACKEND_URL}/api/students`)
    if (springRes.ok) {
      const data = await springRes.json()
      return NextResponse.json(data)
    }
    return NextResponse.json([], { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, firstName, lastName, password } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Données requises manquantes (email, nom, prénom)' },
        { status: 400 }
      )
    }

    try {
      const springRes = await fetch(`${BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await springRes.json()
      if (!springRes.ok) {
        return NextResponse.json({ error: data.error || 'Erreur création étudiant' }, { status: springRes.status })
      }
      return NextResponse.json(data, { status: 201 })
    } catch {
      // Fallback to local container if backend is not reachable
      const container = getServiceContainer()
      const studentService = container.getStudentService()
      const student = await studentService.createStudent(
        email,
        firstName,
        lastName,
        password || 'default123'
      )
      return NextResponse.json(
        { id: student.id, email: student.email, firstName, lastName, role: student.role || 'USER' },
        { status: 201 }
      )
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
