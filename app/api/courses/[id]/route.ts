import { NextRequest, NextResponse } from 'next/server'
import { getServiceContainer } from '@/lib/services/container'
import { BusinessException } from '@/lib/exceptions'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const container = getServiceContainer()
    const courseService = container.getCourseService()

    const course = await courseService.getCourseDetails(id)
    return NextResponse.json(course)
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

export async function GET_AVAILABILITY(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const container = getServiceContainer()
    const courseService = container.getCourseService()

    const availability = await courseService.getCourseAvailability(id)
    return NextResponse.json(availability)
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
