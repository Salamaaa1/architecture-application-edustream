import { Student, Course, Enrollment, Payment } from '@/lib/types'

export interface StudentRepository {
  create(student: Student): Promise<Student>
  findById(id: string): Promise<Student | null>
  findByEmail(email: string): Promise<Student | null>
  update(id: string, student: Partial<Student>): Promise<Student>
  delete(id: string): Promise<void>
  findAll(): Promise<Student[]>
}

export interface CourseRepository {
  create(course: Course): Promise<Course>
  findById(id: string): Promise<Course | null>
  findAll(): Promise<Course[]>
  update(id: string, course: Partial<Course>): Promise<Course>
  delete(id: string): Promise<void>
  updateAvailableSeats(
    courseId: string,
    seatsToReduce: number
  ): Promise<Course>
}

export interface EnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment>
  findById(id: string): Promise<Enrollment | null>
  findByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<Enrollment | null>
  findByStudent(studentId: string): Promise<Enrollment[]>
  findByCourse(courseId: string): Promise<Enrollment[]>
  update(id: string, enrollment: Partial<Enrollment>): Promise<Enrollment>
}

export interface PaymentRepository {
  create(payment: Payment): Promise<Payment>
  findById(id: string): Promise<Payment | null>
  findByEnrollment(enrollmentId: string): Promise<Payment | null>
  update(id: string, payment: Partial<Payment>): Promise<Payment>
  findByStudent(studentId: string): Promise<Payment[]>
}
