import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  InMemoryStudentRepository,
  InMemoryCourseRepository,
  InMemoryEnrollmentRepository,
  InMemoryPaymentRepository,
} from '@/lib/repositories/implementation'
import { StudentService } from '@/lib/services/student.service'
import { CourseService } from '@/lib/services/course.service'
import { EnrollmentService } from '@/lib/services/enrollment.service'
import { PaymentService, PaymentGateway } from '@/lib/services/payment.service'
import { getServiceContainer } from '@/lib/services/container'
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  CourseNotFoundException,
  StudentNotFoundException,
  CourseCompletedException,
  EnrollmentAlreadyExistsException,
  PaymentRefusedException,
  InsufficientFundsException,
} from '@/lib/exceptions'
import { CardData } from '@/lib/types'

describe('EduStream Core Business Services - Critical Feature Suite', () => {
  let studentRepo: InMemoryStudentRepository
  let courseRepo: InMemoryCourseRepository
  let enrollmentRepo: InMemoryEnrollmentRepository
  let paymentRepo: InMemoryPaymentRepository
  let studentService: StudentService
  let courseService: CourseService
  let paymentService: PaymentService
  let enrollmentService: EnrollmentService
  let mockGateway: PaymentGateway

  const validCard: CardData = {
    cardNumber: '4532015112830366',
    expiryMonth: 12,
    expiryYear: 2030,
    cvv: '123',
    cardholderName: 'Karim Alami',
  }

  beforeEach(() => {
    studentRepo = new InMemoryStudentRepository()
    courseRepo = new InMemoryCourseRepository()
    enrollmentRepo = new InMemoryEnrollmentRepository()
    paymentRepo = new InMemoryPaymentRepository()

    studentService = new StudentService(studentRepo, enrollmentRepo, paymentRepo)
    courseService = new CourseService(courseRepo)

    mockGateway = {
      processPayment: vi.fn().mockResolvedValue('TXN-SUCCESS-123'),
    }

    paymentService = new PaymentService(mockGateway, paymentRepo)
    enrollmentService = new EnrollmentService(
      studentRepo,
      courseRepo,
      enrollmentRepo,
      paymentRepo,
      paymentService
    )
  })

  describe('Parcours d Inscription en 2 Étapes (Pré-inscription & Confirmation)', () => {
    it('Étape 1: Pré-inscription et création d un compte étudiant sans coordonnées bancaires', async () => {
      const student = await studentService.createStudent(
        'salma.bennani@edustream.ma',
        'Salma',
        'Bennani',
        'securePass2026'
      )

      expect(student.id).toBeDefined()
      expect(student.email).toBe('salma.bennani@edustream.ma')
      expect(student.firstName).toBe('Salma')

      // Vérifie que l'étudiant est pré-inscrit sans aucun cours payé à l'étape 1
      const profile = await studentService.getStudentProfile(student.id)
      expect(profile.enrolledCourses).toEqual([])
      expect(profile.totalSpent).toBe(0)
    })

    it('Étape 2: Traitement atomique du paiement bancaire et confirmation de l inscription', async () => {
      const student = await studentService.createStudent('mehdi@edustream.ma', 'Mehdi', 'Tazi', 'pass123')
      const course = await courseService.createCourse(
        'React avancé & architecture',
        'Architecture moderne',
        1490, // 1 490 DH
        500,
        'Alexandre Dufour',
        'Développement',
        12
      )

      const result = await enrollmentService.enrollStudent(student.id, course.id, validCard)

      expect(result.enrollment.status).toBe('completed')
      expect(result.paymentId).toBeDefined()

      // Vérification du profil mis à jour
      const profile = await studentService.getStudentProfile(student.id)
      expect(profile.enrolledCourses).toContain(course.id)
      expect(profile.totalSpent).toBe(1490) // Total calculé en Dirhams (DH)
    })
  })

  describe('Tarification en Devise Locale (Dirham Marocain - DH / MAD)', () => {
    it('doit traiter et accumuler les montants exacts en Dirhams (1490 DH, 990 DH, 1190 DH)', async () => {
      const student = await studentService.createStudent('devise@edustream.ma', 'Youssef', 'Bari', 'pass')
      const c1 = await courseService.createCourse('React', 'Desc', 1490, 50, 'Prof A', 'Dev', 12)
      const c2 = await courseService.createCourse('Python Data', 'Desc', 990, 50, 'Prof B', 'Data', 8)

      await enrollmentService.enrollStudent(student.id, c1.id, validCard)
      await enrollmentService.enrollStudent(student.id, c2.id, validCard)

      const profile = await studentService.getStudentProfile(student.id)
      expect(profile.totalSpent).toBe(2480) // 1490 DH + 990 DH
    })
  })

  describe('Gestion des Rôles & Espace Administrateur', () => {
    it('doit permettre la mise à jour et promotion du rôle d un utilisateur (USER -> ADMIN)', async () => {
      const student = await studentService.createStudent('user@edustream.ma', 'User', 'Test', 'pass')
      
      const updated = await studentService.updateStudent(student.id, { role: 'ADMIN' } as any)
      expect(updated.role).toBe('ADMIN')
    })
  })

  describe('Gestion de la Capacité & Épuisement des Places (500 seats -> 0 seats)', () => {
    it('doit rejeter l inscription lorsqu un cours est complet (availableSeats = 0)', async () => {
      const student = await studentService.createStudent('student@edustream.ma', 'A', 'B', 'pass')
      const course = await courseService.createCourse('Cours Complet', 'Desc', 1190, 0, 'Inst', 'Design', 10)

      await expect(
        enrollmentService.enrollStudent(student.id, course.id, validCard)
      ).rejects.toThrow(CourseCompletedException)
    })

    it('doit bloquer les doublons d inscription pour un même étudiant sur un même cours', async () => {
      const student = await studentService.createStudent('dup@edustream.ma', 'C', 'D', 'pass')
      const course = await courseService.createCourse('Cours Unique', 'Desc', 990, 10, 'Inst', 'Dev', 5)

      await enrollmentService.enrollStudent(student.id, course.id, validCard)

      await expect(
        enrollmentService.enrollStudent(student.id, course.id, validCard)
      ).rejects.toThrow(EnrollmentAlreadyExistsException)
    })

    it('doit effectuer un rollback complet si le paiement est refusé à l étape 2', async () => {
      const student = await studentService.createStudent('rollback@edustream.ma', 'E', 'F', 'pass')
      const course = await courseService.createCourse('Cours Rollback', 'Desc', 1490, 5, 'Inst', 'Dev', 10)

      mockGateway.processPayment = vi
        .fn()
        .mockRejectedValue(new PaymentRefusedException('Transaction refusée par la banque'))

      await expect(
        enrollmentService.enrollStudent(student.id, course.id, validCard)
      ).rejects.toThrow(PaymentRefusedException)

      // Vérifie que les places du cours n ont pas été décrémentées (5 places toujours dispo)
      const updatedCourse = await courseService.getCourseDetails(course.id)
      expect(updatedCourse.availableSeats).toBe(5)

      // Vérifie que l inscription est marquée au statut 'failed'
      const enrollments = await enrollmentService.getStudentEnrollments(student.id)
      expect(enrollments[0].status).toBe('failed')
    })
  })
})
