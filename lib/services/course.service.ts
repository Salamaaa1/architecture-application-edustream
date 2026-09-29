import { v4 as uuid } from 'uuid'
import { Course } from '@/lib/types'
import { CourseNotFoundException } from '@/lib/exceptions'
import { CourseRepository } from '@/lib/repositories/interface'

export class CourseService {
  constructor(private courseRepository: CourseRepository) {}

  async createCourse(
    title: string,
    description: string,
    price: number,
    totalSeats: number,
    instructorName: string,
    category: string,
    duration: number
  ): Promise<Course> {
    const course: Course = {
      id: uuid(),
      title,
      description,
      price,
      availableSeats: totalSeats,
      totalSeats,
      instructorName,
      category,
      duration,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return this.courseRepository.create(course)
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll()
  }

  async getCourseDetails(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId)
    if (!course) throw new CourseNotFoundException(courseId)
    return course
  }

  async updateCourse(
    courseId: string,
    updates: Partial<Omit<Course, 'id' | 'createdAt'>>
  ): Promise<Course> {
    const course = await this.courseRepository.findById(courseId)
    if (!course) throw new CourseNotFoundException(courseId)

    return this.courseRepository.update(courseId, updates)
  }

  async getAvailableCourses(): Promise<Course[]> {
    const courses = await this.courseRepository.findAll()
    return courses.filter((c) => c.availableSeats > 0)
  }

  async getCourseAvailability(courseId: string): Promise<{
    courseId: string
    totalSeats: number
    availableSeats: number
    enrolledCount: number
  }> {
    const course = await this.courseRepository.findById(courseId)
    if (!course) throw new CourseNotFoundException(courseId)

    return {
      courseId: course.id,
      totalSeats: course.totalSeats,
      availableSeats: course.availableSeats,
      enrolledCount: course.totalSeats - course.availableSeats,
    }
  }
}
