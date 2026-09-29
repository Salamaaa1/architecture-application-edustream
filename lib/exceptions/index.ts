export class BusinessException extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.name = 'BusinessException'
  }
}

export class CourseCompletedException extends BusinessException {
  constructor(courseId: string) {
    super(
      `Le cours ${courseId} n'a plus de places disponibles`,
      'COURSE_COMPLETED',
      409
    )
    this.name = 'CourseCompletedException'
  }
}

export class PaymentRefusedException extends BusinessException {
  constructor(reason: string) {
    super(`Paiement refusé : ${reason}`, 'PAYMENT_REFUSED', 402)
    this.name = 'PaymentRefusedException'
  }
}

export class InsufficientFundsException extends BusinessException {
  constructor() {
    super('Fonds insuffisants', 'INSUFFICIENT_FUNDS', 402)
    this.name = 'InsufficientFundsException'
  }
}

export class InvalidCardException extends BusinessException {
  constructor(reason: string) {
    super(`Carte invalide : ${reason}`, 'INVALID_CARD', 400)
    this.name = 'InvalidCardException'
  }
}

export class StudentNotFoundException extends BusinessException {
  constructor(studentId: string) {
    super(`Étudiant ${studentId} non trouvé`, 'STUDENT_NOT_FOUND', 404)
    this.name = 'StudentNotFoundException'
  }
}

export class CourseNotFoundException extends BusinessException {
  constructor(courseId: string) {
    super(`Cours ${courseId} non trouvé`, 'COURSE_NOT_FOUND', 404)
    this.name = 'CourseNotFoundException'
  }
}

export class EnrollmentAlreadyExistsException extends BusinessException {
  constructor(studentId: string, courseId: string) {
    super(
      `L'étudiant ${studentId} est déjà inscrit au cours ${courseId}`,
      'ENROLLMENT_EXISTS',
      409
    )
    this.name = 'EnrollmentAlreadyExistsException'
  }
}

export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super('Email ou mot de passe invalide', 'INVALID_CREDENTIALS', 401)
    this.name = 'InvalidCredentialsException'
  }
}

export class EmailAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(`L'email ${email} est déjà utilisé`, 'EMAIL_EXISTS', 409)
    this.name = 'EmailAlreadyExistsException'
  }
}
