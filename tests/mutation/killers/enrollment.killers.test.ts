import { describe, it, expect } from 'vitest'
import {
  StudentNotFoundException,
  CourseNotFoundException,
  CourseCompletedException,
  EnrollmentAlreadyExistsException,
  PaymentRefusedException,
} from '@/lib/exceptions'
import { makeWorld, newStudent, newCourse, validCard } from './_helpers'

describe('EnrollmentService.enrollStudent — validations préalables (tueurs)', () => {
  it('étudiant inconnu => StudentNotFoundException, sans paiement', async () => {
    const w = makeWorld()
    const course = await newCourse(w)
    await expect(w.enrollmentService.enrollStudent('inconnu', course.id, validCard())).rejects.toThrow(
      StudentNotFoundException
    )
    expect(w.processPayment).not.toHaveBeenCalled()
  })

  it('cours inconnu => CourseNotFoundException, sans paiement', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    await expect(w.enrollmentService.enrollStudent(student.id, 'inconnu', validCard())).rejects.toThrow(
      CourseNotFoundException
    )
    expect(w.processPayment).not.toHaveBeenCalled()
  })

  it('cours complet => CourseCompletedException, sans paiement ni inscription', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 0)
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      CourseCompletedException
    )
    expect(w.processPayment).not.toHaveBeenCalled()
    expect(await w.enrollmentService.getStudentEnrollments(student.id)).toEqual([])
  })
})

describe('EnrollmentService.enrollStudent — gestion des places (tueurs)', () => {
  it('la dernière place (1 place restante) peut être achetée', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 1)
    const res = await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    expect(res.enrollment.status).toBe('completed')
    expect((await w.courseService.getCourseDetails(course.id)).availableSeats).toBe(0)
  })

  it('une inscription réussie retire EXACTEMENT une place (500 -> 499)', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 500)
    await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    const after = await w.courseService.getCourseDetails(course.id)
    expect(after.availableSeats).toBe(499)
    expect(after.totalSeats).toBe(500)
  })

  it('épuisement : 2 places, 2 inscrits, le 3e est refusé', async () => {
    const w = makeWorld()
    const course = await newCourse(w, 1000, 2)
    for (let i = 0; i < 2; i++) {
      const s = await newStudent(w)
      await w.enrollmentService.enrollStudent(s.id, course.id, validCard())
    }
    expect((await w.courseService.getCourseDetails(course.id)).availableSeats).toBe(0)
    const third = await newStudent(w)
    await expect(w.enrollmentService.enrollStudent(third.id, course.id, validCard())).rejects.toThrow(
      CourseCompletedException
    )
  })

  it('un paiement refusé ne consomme aucune place', async () => {
    const w = makeWorld(async () => {
      throw new PaymentRefusedException('Refus')
    })
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 3)
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      PaymentRefusedException
    )
    expect((await w.courseService.getCourseDetails(course.id)).availableSeats).toBe(3)
  })
})

describe('EnrollmentService.enrollStudent — cycle de vie du statut (tueurs)', () => {
  it('l\'inscription est « pending » pendant le paiement puis « completed »', async () => {
    let studentId = ''
    let statusDuringPayment: string | undefined
    const w = makeWorld(async () => {
      const [e] = await w.enrollmentRepo.findByStudent(studentId)
      statusDuringPayment = e.status
      return 'TXN-1'
    })
    const student = await newStudent(w)
    studentId = student.id
    const course = await newCourse(w)
    const res = await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    expect(statusDuringPayment).toBe('pending')
    expect(res.enrollment.status).toBe('completed')
  })

  it('inscription réussie : paymentId relié au paiement enregistré, avec le prix du cours', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    const course = await newCourse(w, 1490, 5)
    const res = await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    expect(res.paymentId).toBe(res.enrollment.paymentId)
    const payment = await w.paymentService.getPaymentDetails(res.paymentId)
    expect(payment?.amount).toBe(1490)
    expect(payment?.enrollmentId).toBe(res.enrollment.id)
    expect(w.processPayment).toHaveBeenCalledTimes(1)
  })

  it('paiement refusé : statut « failed » et exception d\'origine relancée', async () => {
    const original = new PaymentRefusedException('Refus')
    const w = makeWorld(async () => {
      throw original
    })
    const student = await newStudent(w)
    const course = await newCourse(w)
    let caught: unknown
    try {
      await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    } catch (e) {
      caught = e
    }
    expect(caught).toBe(original)
    const [enrollment] = await w.enrollmentService.getStudentEnrollments(student.id)
    expect(enrollment.status).toBe('failed')
    expect(enrollment.paymentId).toBeUndefined()
  })

  it('doublon : la 2e demande est refusée sans nouveau paiement', async () => {
    const w = makeWorld()
    const student = await newStudent(w)
    const course = await newCourse(w)
    await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      EnrollmentAlreadyExistsException
    )
    expect(w.processPayment).toHaveBeenCalledTimes(1)
  })

  it('un autre étudiant peut s\'inscrire au même cours ; le même étudiant à un autre cours', async () => {
    const w = makeWorld()
    const s1 = await newStudent(w)
    const s2 = await newStudent(w)
    const c1 = await newCourse(w)
    const c2 = await newCourse(w)
    await w.enrollmentService.enrollStudent(s1.id, c1.id, validCard())
    await expect(w.enrollmentService.enrollStudent(s2.id, c1.id, validCard())).resolves.toBeDefined()
    await expect(w.enrollmentService.enrollStudent(s1.id, c2.id, validCard())).resolves.toBeDefined()
  })
})

describe('EnrollmentService.enrollStudent — nouvelle tentative après un refus (tueurs)', () => {
  it('après un paiement refusé, l\'étudiant peut réessayer (autre carte) et s\'inscrire', async () => {
    let attempt = 0
    const w = makeWorld(async () => {
      if (++attempt === 1) throw new PaymentRefusedException('Fonds insuffisants')
      return 'TXN-2'
    })
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 5)
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      PaymentRefusedException
    )
    const retry = await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    expect(retry.enrollment.status).toBe('completed')
    expect((await w.courseService.getCourseDetails(course.id)).availableSeats).toBe(4)
    const profile = await w.studentService.getStudentProfile(student.id)
    expect(profile.enrolledCourses).toEqual([course.id])
    expect(profile.totalSpent).toBe(1000)
  })

  it('après une tentative refusée puis réussie, un 3e achat reste interdit (pas de doublon)', async () => {
    let attempt = 0
    const w = makeWorld(async () => {
      if (++attempt === 1) throw new PaymentRefusedException('Refus')
      return `TXN-${attempt}`
    })
    const student = await newStudent(w)
    const course = await newCourse(w, 1000, 5)
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      PaymentRefusedException
    )
    await w.enrollmentService.enrollStudent(student.id, course.id, validCard())
    await expect(w.enrollmentService.enrollStudent(student.id, course.id, validCard())).rejects.toThrow(
      EnrollmentAlreadyExistsException
    )
  })
})

describe('EnrollmentService — consultation (tueurs)', () => {
  it('getStudentEnrollments / getCourseEnrollments / getEnrollmentDetails', async () => {
    const w = makeWorld()
    const s1 = await newStudent(w)
    const s2 = await newStudent(w)
    const c1 = await newCourse(w)
    const c2 = await newCourse(w)
    const a = await w.enrollmentService.enrollStudent(s1.id, c1.id, validCard())
    await w.enrollmentService.enrollStudent(s2.id, c1.id, validCard())
    await w.enrollmentService.enrollStudent(s1.id, c2.id, validCard())

    expect(await w.enrollmentService.getStudentEnrollments(s1.id)).toHaveLength(2)
    expect(await w.enrollmentService.getStudentEnrollments(s2.id)).toHaveLength(1)
    expect(await w.enrollmentService.getCourseEnrollments(c1.id)).toHaveLength(2)
    expect(await w.enrollmentService.getCourseEnrollments(c2.id)).toHaveLength(1)
    expect(await w.enrollmentService.getEnrollmentDetails(a.enrollment.id)).toEqual(a.enrollment)
    expect(await w.enrollmentService.getEnrollmentDetails('inconnu')).toBeNull()
  })
})
