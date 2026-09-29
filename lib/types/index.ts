export interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface StudentProfile extends Omit<Student, 'password'> {
  enrolledCourses: string[]
  totalSpent: number
}

export interface Course {
  id: string
  title: string
  description: string
  price: number
  availableSeats: number
  totalSeats: number
  instructorName: string
  category: string
  duration: number
  createdAt: Date
  updatedAt: Date
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  status: 'pending' | 'completed' | 'failed'
  enrolledAt: Date
  paymentId?: string
}

export interface Payment {
  id: string
  enrollmentId: string
  studentId: string
  courseId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  cardLast4: string
  transactionId: string
  createdAt: Date
  updatedAt: Date
  failureReason?: string
}

export interface CardData {
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  cardholderName: string
}
