export interface StoredUser {
  id?: string
  email: string
  firstName: string
  lastName: string
  role?: string
  enrolledCourses: string[]
}

const STORAGE_KEY = 'edustream_user'
const ENROLLED_KEY = 'edustream_enrolled_courses'

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.enrolledCourses) {
      parsed.enrolledCourses = getStoredEnrolledCourseIds()
    }
    return parsed
  } catch {
    return null
  }
}

export function getStoredEnrolledCourseIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ENROLLED_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const userRaw = localStorage.getItem(STORAGE_KEY)
    if (userRaw) {
      const user = JSON.parse(userRaw)
      if (Array.isArray(user.enrolledCourses)) {
        for (const id of user.enrolledCourses) {
          if (!list.includes(id)) list.push(id)
        }
      }
    }
    return list
  } catch {
    return []
  }
}

export function saveStoredUser(user: Partial<StoredUser> & { email: string }): StoredUser {
  if (typeof window === 'undefined') {
    return {
      email: user.email,
      firstName: user.firstName || 'Étudiant',
      lastName: user.lastName || '',
      enrolledCourses: user.enrolledCourses || [],
    }
  }

  const existing = getStoredUser()
  const existingEnrolled = getStoredEnrolledCourseIds()
  const mergedEnrolled = Array.from(
    new Set([...existingEnrolled, ...(existing?.enrolledCourses || []), ...(user.enrolledCourses || [])])
  )

  const updated: StoredUser = {
    id: user.id || existing?.id,
    email: user.email,
    firstName: user.firstName || existing?.firstName || 'Étudiant',
    lastName: user.lastName || existing?.lastName || '',
    role: user.role || existing?.role || 'USER',
    enrolledCourses: mergedEnrolled,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  localStorage.setItem(ENROLLED_KEY, JSON.stringify(mergedEnrolled))
  window.dispatchEvent(new Event('edustream_auth_change'))
  return updated
}

export function addEnrolledCourse(
  courseId: string,
  userInfo?: { email?: string; firstName?: string; lastName?: string }
): void {
  if (typeof window === 'undefined') return

  const currentEnrolled = getStoredEnrolledCourseIds()
  if (!currentEnrolled.includes(courseId)) {
    currentEnrolled.push(courseId)
    localStorage.setItem(ENROLLED_KEY, JSON.stringify(currentEnrolled))
  }

  const currentUser = getStoredUser()
  if (currentUser) {
    if (!currentUser.enrolledCourses.includes(courseId)) {
      currentUser.enrolledCourses.push(courseId)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
  } else if (userInfo?.email) {
    const newUser: StoredUser = {
      email: userInfo.email,
      firstName: userInfo.firstName || 'Étudiant',
      lastName: userInfo.lastName || '',
      enrolledCourses: [courseId],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  window.dispatchEvent(new Event('edustream_auth_change'))
}

export function isEnrolledInCourse(courseId: string): boolean {
  if (typeof window === 'undefined') return false
  const enrolledIds = getStoredEnrolledCourseIds()
  return enrolledIds.includes(courseId)
}

export async function syncUserEnrollments(emailOrId: string): Promise<string[]> {
  if (typeof window === 'undefined' || !emailOrId) return getStoredEnrolledCourseIds()

  try {
    // 1. Try students profile endpoint
    const res = await fetch(`/api/students/${encodeURIComponent(emailOrId)}`)
    if (res.ok) {
      const profile = await res.json()
      if (Array.isArray(profile.enrolledCourses)) {
        for (const cid of profile.enrolledCourses) {
          addEnrolledCourse(cid)
        }
        return getStoredEnrolledCourseIds()
      }
    }

    // 2. Try enrollments by student endpoint
    const enrRes = await fetch(`/api/enrollments/student/${encodeURIComponent(emailOrId)}`)
    if (enrRes.ok) {
      const enrollments = await enrRes.json()
      if (Array.isArray(enrollments)) {
        for (const enr of enrollments) {
          if (enr.courseId && (enr.status === 'completed' || enr.status === 'COMPLETED')) {
            addEnrolledCourse(enr.courseId)
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to sync enrollments from server:', err)
  }

  return getStoredEnrolledCourseIds()
}
