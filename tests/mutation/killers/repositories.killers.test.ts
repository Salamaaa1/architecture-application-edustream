import { describe, it, expect } from 'vitest'
import {
  InMemoryStudentRepository,
  InMemoryCourseRepository,
  InMemoryEnrollmentRepository,
  InMemoryPaymentRepository,
} from '@/lib/repositories/implementation'
import { StudentNotFoundException, CourseNotFoundException } from '@/lib/exceptions'
import type { Student, Course, Enrollment, Payment } from '@/lib/types'

const student = (id: string, email = `${id}@x.ma`): Student => ({
  id, email, firstName: 'F', lastName: 'L', password: 'p', createdAt: new Date(), updatedAt: new Date(),
})
const course = (id: string, seats = 5): Course => ({
  id, title: 'T', description: 'D', price: 100, availableSeats: seats, totalSeats: seats,
  instructorName: 'I', category: 'C', duration: 1, createdAt: new Date(), updatedAt: new Date(),
})
const enrollment = (id: string, studentId: string, courseId: string): Enrollment => ({
  id, studentId, courseId, status: 'pending', enrolledAt: new Date(),
})
const payment = (id: string, studentId: string, enrollmentId: string): Payment => ({
  id, enrollmentId, studentId, courseId: 'c', amount: 10, status: 'completed', cardLast4: '****-****-****-0366',
  transactionId: 'T', createdAt: new Date(), updatedAt: new Date(),
})

describe('InMemoryStudentRepository (tueurs)', () => {
  it('findById / findByEmail : trouvent le bon étudiant, null sinon', async () => {
    const r = new InMemoryStudentRepository()
    await r.create(student('1', 'a@x.ma'))
    await r.create(student('2', 'b@x.ma'))
    expect((await r.findById('2'))?.email).toBe('b@x.ma')
    expect(await r.findById('9')).toBeNull()
    expect((await r.findByEmail('b@x.ma'))?.id).toBe('2')
    expect(await r.findByEmail('zzz@x.ma')).toBeNull()
  })

  it('update : fusionne, persiste et rafraîchit updatedAt ; inconnu => StudentNotFoundException', async () => {
    const r = new InMemoryStudentRepository()
    const s = student('1')
    s.updatedAt = new Date(2000, 0, 1)
    await r.create(s)
    const u = await r.update('1', { firstName: 'Neo' })
    expect(u.firstName).toBe('Neo')
    expect(u.lastName).toBe('L')
    expect(u.updatedAt.getTime()).toBeGreaterThan(new Date(2000, 0, 1).getTime())
    expect((await r.findById('1'))?.firstName).toBe('Neo')
    await expect(r.update('9', { firstName: 'X' })).rejects.toThrow(StudentNotFoundException)
  })

  it('delete supprime ; findAll liste', async () => {
    const r = new InMemoryStudentRepository()
    await r.create(student('1'))
    await r.create(student('2'))
    expect(await r.findAll()).toHaveLength(2)
    await r.delete('1')
    expect(await r.findById('1')).toBeNull()
    expect(await r.findAll()).toHaveLength(1)
  })
})

describe('InMemoryCourseRepository (tueurs)', () => {
  it('findById, findAll, update persiste, delete supprime', async () => {
    const r = new InMemoryCourseRepository()
    await r.create(course('1'))
    await r.create(course('2'))
    expect(await r.findById('9')).toBeNull()
    expect(await r.findAll()).toHaveLength(2)
    const u = await r.update('1', { price: 999 })
    expect(u.price).toBe(999)
    expect((await r.findById('1'))?.price).toBe(999)
    await expect(r.update('9', { price: 1 })).rejects.toThrow(CourseNotFoundException)
    await r.delete('2')
    expect(await r.findById('2')).toBeNull()
  })

  it('updateAvailableSeats : retire n places, persiste, jamais en dessous de 0', async () => {
    const r = new InMemoryCourseRepository()
    await r.create(course('1', 5))
    expect((await r.updateAvailableSeats('1', 2)).availableSeats).toBe(3)
    expect((await r.findById('1'))?.availableSeats).toBe(3)
    expect((await r.updateAvailableSeats('1', 10)).availableSeats).toBe(0)
    expect((await r.updateAvailableSeats('1', 1)).availableSeats).toBe(0)
    await expect(r.updateAvailableSeats('9', 1)).rejects.toThrow(CourseNotFoundException)
  })
})

describe('InMemoryEnrollmentRepository (tueurs)', () => {
  it('findById, findByStudentAndCourse, findByStudent, findByCourse filtrent correctement', async () => {
    const r = new InMemoryEnrollmentRepository()
    await r.create(enrollment('e1', 's1', 'c1'))
    await r.create(enrollment('e2', 's1', 'c2'))
    await r.create(enrollment('e3', 's2', 'c1'))
    expect(await r.findById('zzz')).toBeNull()
    expect((await r.findById('e2'))?.courseId).toBe('c2')
    expect((await r.findByStudentAndCourse('s1', 'c2'))?.id).toBe('e2')
    expect(await r.findByStudentAndCourse('s2', 'c2')).toBeNull()
    expect(await r.findByStudentAndCourse('s9', 'c1')).toBeNull()
    expect((await r.findByStudent('s1')).map((e) => e.id)).toEqual(['e1', 'e2'])
    expect((await r.findByCourse('c1')).map((e) => e.id)).toEqual(['e1', 'e3'])
    expect(await r.findByCourse('c9')).toEqual([])
  })

  it('update fusionne et persiste ; inconnu => erreur « Enrollment not found »', async () => {
    const r = new InMemoryEnrollmentRepository()
    await r.create(enrollment('e1', 's1', 'c1'))
    const u = await r.update('e1', { status: 'completed', paymentId: 'p1' })
    expect(u.status).toBe('completed')
    expect(u.studentId).toBe('s1')
    expect((await r.findById('e1'))?.paymentId).toBe('p1')
    await expect(r.update('zzz', { status: 'failed' })).rejects.toThrow('Enrollment not found')
  })
})

describe('InMemoryPaymentRepository (tueurs)', () => {
  it('findById, findByEnrollment, findByStudent', async () => {
    const r = new InMemoryPaymentRepository()
    await r.create(payment('p1', 's1', 'e1'))
    await r.create(payment('p2', 's1', 'e2'))
    await r.create(payment('p3', 's2', 'e3'))
    expect(await r.findById('zzz')).toBeNull()
    expect((await r.findById('p2'))?.enrollmentId).toBe('e2')
    expect((await r.findByEnrollment('e3'))?.id).toBe('p3')
    expect(await r.findByEnrollment('zzz')).toBeNull()
    expect((await r.findByStudent('s1')).map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(await r.findByStudent('s9')).toEqual([])
  })

  it('update fusionne, persiste, rafraîchit updatedAt ; inconnu => « Payment not found »', async () => {
    const r = new InMemoryPaymentRepository()
    const p = payment('p1', 's1', 'e1')
    p.updatedAt = new Date(2000, 0, 1)
    await r.create(p)
    const u = await r.update('p1', { status: 'failed' })
    expect(u.status).toBe('failed')
    expect(u.amount).toBe(10)
    expect(u.updatedAt.getTime()).toBeGreaterThan(new Date(2000, 0, 1).getTime())
    expect((await r.findById('p1'))?.status).toBe('failed')
    await expect(r.update('zzz', { status: 'failed' })).rejects.toThrow('Payment not found')
  })
})
