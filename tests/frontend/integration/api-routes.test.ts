import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getCourses, POST as createCourse } from '@/app/api/courses/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as processPayment } from '@/app/api/payments/process/route'
import { getServiceContainer } from '@/lib/services/container'

describe('Next.js API Routes - Fallback & Integration Edge Cases', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('GET /api/courses', () => {
    it('should return courses from local ServiceContainer when Spring Boot backend fetch fails', async () => {
      // Mock fetch failure (backend down)
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Backend unreachable'))

      const req = new NextRequest('http://localhost:3000/api/courses')
      const res = await getCourses(req)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return courses from Spring Boot backend when response is OK', async () => {
      const mockBackendCourses = [
        { id: 'spring-1', title: 'Spring Course', price: 1000, availableSeats: 50 },
      ]

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendCourses,
      } as Response)

      const req = new NextRequest('http://localhost:3000/api/courses')
      const res = await getCourses(req)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual(mockBackendCourses)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return status 400 when email or password is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: '' }),
      })

      const res = await login(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Email et mot de passe requis')
    })
  })

  describe('POST /api/payments/process', () => {
    it('should return status 400 when required payment payload fields are incomplete', async () => {
      const req = new NextRequest('http://localhost:3000/api/payments/process', {
        method: 'POST',
        body: JSON.stringify({ courseId: 'react' }), // missing amount and cardData
      })

      const res = await processPayment(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Données de paiement incomplètes')
    })

    it('should handle payment process using fallback container when Spring Boot backend fetch fails', async () => {
      // Mock backend down
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'))

      // Ensure course exists in local container
      const container = getServiceContainer()
      const courseRepo = container.getCourseRepository()
      await courseRepo.create({
        id: 'test-course-id',
        title: 'Test Course',
        description: 'Test Desc',
        price: 990,
        availableSeats: 10,
        totalSeats: 10,
        instructorName: 'Prof. X',
        category: 'Dev',
        duration: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const paymentPayload = {
        studentEmail: 'api-student@edustream.ma',
        courseId: 'test-course-id',
        amount: 990,
        cardData: {
          number: '4532015112830366',
          expiry: '12/30',
          cvv: '123',
          name: 'API Student',
        },
      }

      const req = new NextRequest('http://localhost:3000/api/payments/process', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      })

      const res = await processPayment(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.paymentId).toBeDefined()
    })
  })
})
