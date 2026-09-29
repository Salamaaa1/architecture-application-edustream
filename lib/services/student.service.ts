import { v4 as uuid } from 'uuid'
import { Student, StudentProfile } from '@/lib/types'
import {
  EmailAlreadyExistsException,
  StudentNotFoundException,
  InvalidCredentialsException,
} from '@/lib/exceptions'
import { StudentRepository, EnrollmentRepository, PaymentRepository } from '@/lib/repositories/interface'

export class StudentService {
  constructor(
    private studentRepository: StudentRepository,
    private enrollmentRepository: EnrollmentRepository,
    private paymentRepository: PaymentRepository
  ) {}

  async createStudent(
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<Student> {
    const existingStudent = await this.studentRepository.findByEmail(email)
    if (existingStudent) {
      throw new EmailAlreadyExistsException(email)
    }

    const student: Student = {
      id: uuid(),
      email,
      firstName,
      lastName,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return this.studentRepository.create(student)
  }

  async authenticateStudent(
    email: string,
    password: string
  ): Promise<Student> {
    const student = await this.studentRepository.findByEmail(email)
    if (!student || student.password !== password) {
      throw new InvalidCredentialsException()
    }
    return student
  }

  async getStudentProfile(studentId: string): Promise<StudentProfile> {
    const student = await this.studentRepository.findById(studentId)
    if (!student) throw new StudentNotFoundException(studentId)

    const enrollments =
      await this.enrollmentRepository.findByStudent(studentId)
    const enrolledCourses = enrollments
      .filter((e) => e.status === 'completed')
      .map((e) => e.courseId)

    const payments = await this.paymentRepository.findByStudent(studentId)
    const totalSpent = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    const profile: StudentProfile = {
      id: student.id,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      enrolledCourses,
      totalSpent,
    }

    return profile
  }

  async updateStudent(
    studentId: string,
    updates: Partial<Omit<Student, 'id' | 'createdAt'>>
  ): Promise<Student> {
    const student = await this.studentRepository.findById(studentId)
    if (!student) throw new StudentNotFoundException(studentId)

    if (updates.email && updates.email !== student.email) {
      const existingStudent =
        await this.studentRepository.findByEmail(updates.email)
      if (existingStudent) {
        throw new EmailAlreadyExistsException(updates.email)
      }
    }

    return this.studentRepository.update(studentId, updates)
  }
}
