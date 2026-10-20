import { describe, it, expect } from 'vitest'
import { CourseNotFoundException } from '@/lib/exceptions'
import { makeWorld, newCourse, newStudent, validCard } from './_helpers'

describe('CourseService (tueurs)', () => {
  it('createCourse : places disponibles = places totales, champs conservés', async () => {
    const w = makeWorld()
    const c = await w.courseService.createCourse('React', 'Desc', 1490, 500, 'Prof A', 'Dev', 12)
    expect(c.id).toBeDefined()
    expect(c.title).toBe('React')
    expect(c.description).toBe('Desc')
    expect(c.price).toBe(1490)
    expect(c.totalSeats).toBe(500)
    expect(c.availableSeats).toBe(500)
    expect(c.instructorName).toBe('Prof A')
    expect(c.category).toBe('Dev')
    expect(c.duration).toBe(12)
  })

  it('getAllCourses renvoie tous les cours', async () => {
    const w = makeWorld()
    expect(await w.courseService.getAllCourses()).toEqual([])
    await newCourse(w)
    await newCourse(w, 1000, 0)
    expect(await w.courseService.getAllCourses()).toHaveLength(2)
  })

  it('getCourseDetails : cours inconnu => CourseNotFoundException', async () => {
    const w = makeWorld()
    await expect(w.courseService.getCourseDetails('inconnu')).rejects.toThrow(CourseNotFoundException)
  })

  it('updateCourse : cours inconnu => CourseNotFoundException', async () => {
    const w = makeWorld()
    await expect(w.courseService.updateCourse('inconnu', { price: 1 })).rejects.toThrow(CourseNotFoundException)
  })

  it('updateCourse : modifie les champs demandés uniquement', async () => {
    const w = makeWorld()
    const c = await newCourse(w, 1000, 10)
    const u = await w.courseService.updateCourse(c.id, { price: 1200 })
    expect(u.price).toBe(1200)
    expect(u.title).toBe(c.title)
    expect(u.availableSeats).toBe(10)
    expect((await w.courseService.getCourseDetails(c.id)).price).toBe(1200)
  })

  it('getAvailableCourses : exclut les cours à 0 place, garde ceux à 1 place', async () => {
    const w = makeWorld()
    const full = await newCourse(w, 1000, 0)
    const last = await newCourse(w, 1000, 1)
    const many = await newCourse(w, 1000, 50)
    const ids = (await w.courseService.getAvailableCourses()).map((c) => c.id)
    expect(ids).toContain(last.id)
    expect(ids).toContain(many.id)
    expect(ids).not.toContain(full.id)
    expect(ids).toHaveLength(2)
  })

  it('getCourseAvailability : cours inconnu => CourseNotFoundException', async () => {
    const w = makeWorld()
    await expect(w.courseService.getCourseAvailability('inconnu')).rejects.toThrow(CourseNotFoundException)
  })

  it('getCourseAvailability : inscrits = places totales - places disponibles', async () => {
    const w = makeWorld()
    const c = await newCourse(w, 1000, 10)
    for (let i = 0; i < 3; i++) {
      const s = await newStudent(w)
      await w.enrollmentService.enrollStudent(s.id, c.id, validCard())
    }
    expect(await w.courseService.getCourseAvailability(c.id)).toEqual({
      courseId: c.id,
      totalSeats: 10,
      availableSeats: 7,
      enrolledCount: 3,
    })
  })
})
