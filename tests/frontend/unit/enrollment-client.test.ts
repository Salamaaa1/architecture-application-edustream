import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getStoredUser,
  getStoredEnrolledCourseIds,
  saveStoredUser,
  addEnrolledCourse,
  isEnrolledInCourse,
  syncUserEnrollments,
  StoredUser,
} from '@/lib/enrollment-client'

describe('EnrollmentClient - State Management & Resilience Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('LocalStorage Resilience & Corruption Recovery', () => {
    it('should return null when localStorage contains corrupted non-JSON data', () => {
      localStorage.setItem('edustream_user', '{invalid_json: true,,,')
      expect(getStoredUser()).toBeNull()
    })

    it('should return empty array when enrolled courses contains corrupted JSON', () => {
      localStorage.setItem('edustream_enrolled_courses', '[[[BROKEN_JSON')
      expect(getStoredEnrolledCourseIds()).toEqual([])
    })

    it('should gracefully merge enrolled courses from user object and separate enrolled key', () => {
      const mockUser: StoredUser = {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        enrolledCourses: ['react', 'data'],
      }
      localStorage.setItem('edustream_user', JSON.stringify(mockUser))
      localStorage.setItem('edustream_enrolled_courses', JSON.stringify(['data', 'product']))

      const enrolledIds = getStoredEnrolledCourseIds()
      expect(enrolledIds).toContain('react')
      expect(enrolledIds).toContain('data')
      expect(enrolledIds).toContain('product')
    })
  })

  describe('User State Persistence & Window Event Dispatching', () => {
    it('should save user and dispatch edustream_auth_change event', () => {
      const eventListener = vi.fn()
      window.addEventListener('edustream_auth_change', eventListener)

      const saved = saveStoredUser({
        email: 'student@edustream.ma',
        firstName: 'Salma',
        lastName: 'Bennani',
        role: 'USER',
        enrolledCourses: ['react'],
      })

      expect(saved.email).toBe('student@edustream.ma')
      expect(saved.firstName).toBe('Salma')
      expect(isEnrolledInCourse('react')).toBe(true)
      expect(eventListener).toHaveBeenCalledTimes(1)

      window.removeEventListener('edustream_auth_change', eventListener)
    })

    it('should add enrolled course dynamically and prevent duplicate entries', () => {
      addEnrolledCourse('react', { email: 'student@edustream.ma' })
      addEnrolledCourse('react', { email: 'student@edustream.ma' })

      const enrolled = getStoredEnrolledCourseIds()
      expect(enrolled.filter((id) => id === 'react').length).toBe(1)
    })
  })

  describe('Server Synchronization & Network Error Fallback', () => {
    it('should fetch profile and sync enrolled courses from student endpoint', async () => {
      const mockProfile = {
        id: 'student-123',
        email: 'student@edustream.ma',
        enrolledCourses: ['react', 'design'],
      }

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response)

      const synced = await syncUserEnrollments('student@edustream.ma')
      expect(synced).toContain('react')
      expect(synced).toContain('design')
    })

    it('should fall back to enrollments endpoint if student endpoint fails', async () => {
      // First call (student profile endpoint) fails with 404
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response)
        // Second call (enrollments endpoint) succeeds with completed enrollments
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { courseId: 'data', status: 'completed' },
            { courseId: 'failed-course', status: 'failed' },
          ],
        } as Response)

      const synced = await syncUserEnrollments('student@edustream.ma')
      expect(synced).toContain('data')
      expect(synced).not.toContain('failed-course')
    })

    it('should handle network exceptions gracefully without throwing', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection failed'))

      const synced = await syncUserEnrollments('student@edustream.ma')
      expect(Array.isArray(synced)).toBe(true)
    })
  })
})
