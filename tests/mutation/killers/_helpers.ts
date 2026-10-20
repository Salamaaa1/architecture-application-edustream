// Utilitaires communs aux tests « tueurs » (ce fichier n'est pas un test).
import { vi } from 'vitest'
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
import type { CardData } from '@/lib/types'

/** Carte valide dont la date d'expiration ne dépend jamais de l'année d'exécution. */
export const validCard = (over: Partial<CardData> = {}): CardData => ({
  cardNumber: '4532015112830366',
  expiryMonth: 12,
  expiryYear: new Date().getFullYear() + 2,
  cvv: '123',
  cardholderName: 'Karim Alami',
  ...over,
})

/** Construit tout le graphe de services avec une passerelle de paiement simulée. */
export function makeWorld(gatewayImpl?: PaymentGateway['processPayment']) {
  const studentRepo = new InMemoryStudentRepository()
  const courseRepo = new InMemoryCourseRepository()
  const enrollmentRepo = new InMemoryEnrollmentRepository()
  const paymentRepo = new InMemoryPaymentRepository()
  const processPayment = vi.fn().mockResolvedValue('TXN-OK-1')
  if (gatewayImpl) processPayment.mockImplementation(gatewayImpl)
  const gateway: PaymentGateway = { processPayment }
  const studentService = new StudentService(studentRepo, enrollmentRepo, paymentRepo)
  const courseService = new CourseService(courseRepo)
  const paymentService = new PaymentService(gateway, paymentRepo)
  const enrollmentService = new EnrollmentService(studentRepo, courseRepo, enrollmentRepo, paymentRepo, paymentService)
  return {
    studentRepo, courseRepo, enrollmentRepo, paymentRepo,
    studentService, courseService, paymentService, enrollmentService,
    gateway, processPayment,
  }
}

let counter = 0
export const newStudent = (w: ReturnType<typeof makeWorld>, email = `s${++counter}@edustream.ma`) =>
  w.studentService.createStudent(email, 'Prénom', 'Nom', 'pass')
export const newCourse = (w: ReturnType<typeof makeWorld>, price = 1000, seats = 5) =>
  w.courseService.createCourse(`Cours ${++counter}`, 'Description', price, seats, 'Prof', 'Dev', 10)
