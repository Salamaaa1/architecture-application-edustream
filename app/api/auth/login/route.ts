import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    try {
      const springRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await springRes.json()
      if (!springRes.ok) {
        return NextResponse.json({ error: data.error || 'Identifiants invalides' }, { status: springRes.status })
      }

      // Fetch student profile from Spring Boot
      const profileRes = await fetch(`${BACKEND_URL}/api/students/${data.id}/profile`)
      if (profileRes.ok) {
        const profile = await profileRes.json()
        return NextResponse.json(profile, { status: 200 })
      }

      return NextResponse.json(data, { status: 200 })
    } catch {
      // Fallback to local container
      const container = getServiceContainer()
      const studentService = container.getStudentService()
      const student = await studentService.authenticateStudent(email, password)
      const profile = await studentService.getStudentProfile(student.id)
      return NextResponse.json(profile, { status: 200 })
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
