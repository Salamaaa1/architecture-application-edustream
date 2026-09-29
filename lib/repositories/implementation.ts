import {
  StudentRepository,
  CourseRepository,
  EnrollmentRepository,
  PaymentRepository,
} from './interface'
import { Student, Course, Enrollment, Payment } from '@/lib/types'
import { StudentNotFoundException, CourseNotFoundException } from '@/lib/exceptions'

export class InMemoryStudentRepository implements StudentRepository {
  private students: Map<string, Student> = new Map()

  async create(student: Student): Promise<Student> {
    this.students.set(student.id, student)
    return student
  }

  async findById(id: string): Promise<Student | null> {
    return this.students.get(id) || null
  }

  async findByEmail(email: string): Promise<Student | null> {
    for (const student of this.students.values()) {
      if (student.email === email) return student
    }
    return null
  }

  async update(id: string, student: Partial<Student>): Promise<Student> {
    const existing = this.students.get(id)
    if (!existing) throw new StudentNotFoundException(id)
    const updated = { ...existing, ...student, updatedAt: new Date() }
    this.students.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.students.delete(id)
  }

  async findAll(): Promise<Student[]> {
    return Array.from(this.students.values())
  }
}

export class InMemoryCourseRepository implements CourseRepository {
  private courses: Map<string, Course> = new Map()

  async create(course: Course): Promise<Course> {
    this.courses.set(course.id, course)
    return course
  }

  async findById(id: string): Promise<Course | null> {
    return this.courses.get(id) || null
  }

  async findAll(): Promise<Course[]> {
    return Array.from(this.courses.values())
  }

  async update(id: string, course: Partial<Course>): Promise<Course> {
    const existing = this.courses.get(id)
    if (!existing) throw new CourseNotFoundException(id)
    const updated = { ...existing, ...course, updatedAt: new Date() }
    this.courses.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.courses.delete(id)
  }

  async updateAvailableSeats(
    courseId: string,
    seatsToReduce: number
  ): Promise<Course> {
    const course = await this.findById(courseId)
    if (!course) throw new CourseNotFoundException(courseId)
    const updated = await this.update(courseId, {
      availableSeats: Math.max(0, course.availableSeats - seatsToReduce),
    })
    return updated
  }
}

export class InMemoryEnrollmentRepository implements EnrollmentRepository {
  private enrollments: Map<string, Enrollment> = new Map()

  async create(enrollment: Enrollment): Promise<Enrollment> {
    this.enrollments.set(enrollment.id, enrollment)
    return enrollment
  }

  async findById(id: string): Promise<Enrollment | null> {
    return this.enrollments.get(id) || null
  }

  async findByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<Enrollment | null> {
    for (const enrollment of this.enrollments.values()) {
      if (
        enrollment.studentId === studentId &&
        enrollment.courseId === courseId
      ) {
        return enrollment
      }
    }
    return null
  }

  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (e) => e.studentId === studentId
    )
  }

  async findByCourse(courseId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (e) => e.courseId === courseId
    )
  }

  async update(
    id: string,
    enrollment: Partial<Enrollment>
  ): Promise<Enrollment> {
    const existing = this.enrollments.get(id)
    if (!existing) throw new Error('Enrollment not found')
    const updated = { ...existing, ...enrollment }
    this.enrollments.set(id, updated)
    return updated
  }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private payments: Map<string, Payment> = new Map()

  async create(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment)
    return payment
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null
  }

  async findByEnrollment(enrollmentId: string): Promise<Payment | null> {
    for (const payment of this.payments.values()) {
      if (payment.enrollmentId === enrollmentId) return payment
    }
    return null
  }

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    const existing = this.payments.get(id)
    if (!existing) throw new Error('Payment not found')
    const updated = { ...existing, ...payment, updatedAt: new Date() }
    this.payments.set(id, updated)
    return updated
  }

  async findByStudent(studentId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.studentId === studentId
    )
  }
}
