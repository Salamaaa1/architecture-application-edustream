import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function GET(req: NextRequest) {
  try {
    try {
      const springRes = await fetch(`${BACKEND_URL}/api/courses`)
      if (springRes.ok) {
        const data = await springRes.json()
        return NextResponse.json(data)
      }
    } catch {}

    const container = getServiceContainer()
    const courseService = container.getCourseService()
    const courses = await courseService.getAvailableCourses()
    return NextResponse.json(courses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    try {
      const springRes = await fetch(`${BACKEND_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (springRes.ok) {
        const data = await springRes.json()
        return NextResponse.json(data, { status: 201 })
      }
    } catch {}

    const {
      title,
      description,
      price,
      totalSeats,
      instructorName,
      category,
      duration,
    } = body

    const container = getServiceContainer()
    const courseService = container.getCourseService()

    const course = await courseService.createCourse(
      title,
      description,
      price,
      totalSeats,
      instructorName,
      category,
      duration
    )

    return NextResponse.json(course, { status: 201 })
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
