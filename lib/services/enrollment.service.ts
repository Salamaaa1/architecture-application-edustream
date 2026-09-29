import { v4 as uuid } from 'uuid'
import { Enrollment, CardData } from '@/lib/types'
import {
  CourseCompletedException,
  EnrollmentAlreadyExistsException,
  StudentNotFoundException,
  CourseNotFoundException,
} from '@/lib/exceptions'
import {
  StudentRepository,
  CourseRepository,
  EnrollmentRepository,
  PaymentRepository,
} from '@/lib/repositories/interface'
import { PaymentService } from './payment.service'

export class EnrollmentService {
  constructor(
    private studentRepository: StudentRepository,
    private courseRepository: CourseRepository,
    private enrollmentRepository: EnrollmentRepository,
    private paymentRepository: PaymentRepository,
    private paymentService: PaymentService
  ) {}

  async enrollStudent(
    studentId: string,
    courseId: string,
    cardData: CardData
  ): Promise<{ enrollment: Enrollment; paymentId: string }> {
    const student = await this.studentRepository.findById(studentId)
    if (!student) throw new StudentNotFoundException(studentId)

    const course = await this.courseRepository.findById(courseId)
    if (!course) throw new CourseNotFoundException(courseId)

    if (course.availableSeats <= 0) {
      throw new CourseCompletedException(courseId)
    }

    const existingEnrollment =
      await this.enrollmentRepository.findByStudentAndCourse(
        studentId,
        courseId
      )
    if (existingEnrollment) {
      throw new EnrollmentAlreadyExistsException(studentId, courseId)
    }

    const enrollment: Enrollment = {
      id: uuid(),
      studentId,
      courseId,
      status: 'pending',
      enrolledAt: new Date(),
    }

    const createdEnrollment = await this.enrollmentRepository.create(
      enrollment
    )

    try {
      const payment = await this.paymentService.processPayment(
        createdEnrollment.id,
        studentId,
        courseId,
        course.price,
        cardData
      )

      const completedEnrollment = await this.enrollmentRepository.update(
        createdEnrollment.id,
        {
          status: 'completed',
          paymentId: payment.id,
        }
      )

      await this.courseRepository.updateAvailableSeats(courseId, 1)

      return {
        enrollment: completedEnrollment,
        paymentId: payment.id,
      }
    } catch (error) {
      await this.enrollmentRepository.update(createdEnrollment.id, {
        status: 'failed',
      })
      throw error
    }
  }

  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.findByStudent(studentId)
  }

  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.findByCourse(courseId)
  }

  async getEnrollmentDetails(enrollmentId: string): Promise<Enrollment | null> {
    return this.enrollmentRepository.findById(enrollmentId)
  }
}
