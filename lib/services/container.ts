import {
  StudentRepository,
  CourseRepository,
  EnrollmentRepository,
  PaymentRepository,
} from '@/lib/repositories/interface'
import {
  InMemoryStudentRepository,
  InMemoryCourseRepository,
  InMemoryEnrollmentRepository,
  InMemoryPaymentRepository,
} from '@/lib/repositories/implementation'
import { StudentService } from './student.service'
import { CourseService } from './course.service'
import { EnrollmentService } from './enrollment.service'
import { PaymentService, PaymentGateway, MockPaymentGateway } from './payment.service'

export class ServiceContainer {
  private studentRepository: StudentRepository
  private courseRepository: CourseRepository
  private enrollmentRepository: EnrollmentRepository
  private paymentRepository: PaymentRepository
  private paymentGateway: PaymentGateway

  private studentService!: StudentService
  private courseService!: CourseService
  private paymentService!: PaymentService
  private enrollmentService!: EnrollmentService

  constructor(
    studentRepo?: StudentRepository,
    courseRepo?: CourseRepository,
    enrollmentRepo?: EnrollmentRepository,
    paymentRepo?: PaymentRepository,
    paymentGw?: PaymentGateway
  ) {
    this.studentRepository =
      studentRepo || new InMemoryStudentRepository()
    this.courseRepository = courseRepo || new InMemoryCourseRepository()
    this.enrollmentRepository =
      enrollmentRepo || new InMemoryEnrollmentRepository()
    this.paymentRepository =
      paymentRepo || new InMemoryPaymentRepository()
    this.paymentGateway = paymentGw || new MockPaymentGateway()

    this.initializeServices()
  }

  private initializeServices(): void {
    this.paymentService = new PaymentService(
      this.paymentGateway,
      this.paymentRepository
    )

    this.studentService = new StudentService(
      this.studentRepository,
      this.enrollmentRepository,
      this.paymentRepository
    )

    this.courseService = new CourseService(this.courseRepository)

    this.enrollmentService = new EnrollmentService(
      this.studentRepository,
      this.courseRepository,
      this.enrollmentRepository,
      this.paymentRepository,
      this.paymentService
    )
  }

  getStudentService(): StudentService {
    return this.studentService
  }

  getCourseService(): CourseService {
    return this.courseService
  }

  getPaymentService(): PaymentService {
    return this.paymentService
  }

  getEnrollmentService(): EnrollmentService {
    return this.enrollmentService
  }

  getStudentRepository(): StudentRepository {
    return this.studentRepository
  }

  getCourseRepository(): CourseRepository {
    return this.courseRepository
  }

  getEnrollmentRepository(): EnrollmentRepository {
    return this.enrollmentRepository
  }

  getPaymentRepository(): PaymentRepository {
    return this.paymentRepository
  }
}

let globalContainer: ServiceContainer | null = null

export function getServiceContainer(): ServiceContainer {
  if (!globalContainer) {
    globalContainer = new ServiceContainer()
  }
  return globalContainer
}

export function createTestContainer(
  studentRepo?: StudentRepository,
  courseRepo?: CourseRepository,
  enrollmentRepo?: EnrollmentRepository,
  paymentRepo?: PaymentRepository,
  paymentGw?: PaymentGateway
): ServiceContainer {
  return new ServiceContainer(
    studentRepo,
    courseRepo,
    enrollmentRepo,
    paymentRepo,
    paymentGw
  )
}
