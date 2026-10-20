import { describe, it, expect } from 'vitest'
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  StudentNotFoundException,
  PaymentRefusedException,
} from '@/lib/exceptions'
import { makeWorld, newStudent, newCourse, validCard } from './_helpers'

describe('StudentService.createStudent (tueurs)', () => {
  it('crée l\'étudiant avec les champs fournis et un identifiant', async () => {
    const w = makeWorld()
    const s = await w.studentService.createStudent('a@edustream.ma', 'Ali', 'Alaoui', 'secret')
    expect(s.id).toBeDefined()
    expect(s.email).toBe('a@edustream.ma')
    expect(s.firstName).toBe('Ali')
    expect(s.lastName).toBe('Alaoui')
    expect(s.createdAt).toBeInstanceOf(Date)
    expect(await w.studentRepo.findById(s.id)).toEqual(s)
  })

  it('e-mail déjà utilisé => EmailAlreadyExistsException et aucun second compte', async () => {
    const w = makeWorld()
    await w.studentService.createStudent('dup@edustream.ma', 'A', 'B', 'p1')
    await expect(w.studentService.createStudent('dup@edustream.ma', 'C', 'D', 'p2')).rejects.toThrow(
      EmailAlreadyExistsException
    )
    expect(await w.studentRepo.findAll()).toHaveLength(1)
  })
})

describe('StudentService.authenticateStudent (tueurs)', () => {
  it('bons identifiants : renvoie l\'étudiant', async () => {
    const w = makeWorld()
    const s = await w.studentService.createStudent('login@edustream.ma', 'A', 'B', 'bonmdp')
    await expect(w.studentService.authenticateStudent('login@edustream.ma', 'bonmdp')).resolves.toEqual(s)
  })

  it('mauvais mot de passe => InvalidCredentialsException', async () => {
    const w = makeWorld()
    await w.studentService.createStudent('login@edustream.ma', 'A', 'B', 'bonmdp')
    await expect(w.studentService.authenticateStudent('login@edustream.ma', 'mauvais')).rejects.toThrow(
      InvalidCredentialsException
    )
  })

  it('e-mail inconnu => InvalidCredentialsException (même erreur : pas de fuite d\'information)', async () => {
    const w = makeWorld()
    await expect(w.studentService.authenticateStudent('inconnu@edustream.ma', 'x')).rejects.toThrow(
      InvalidCredentialsException
    )
  })
})

describe('StudentService.getStudentProfile (tueurs)', () => {
  it('étudiant inconnu => StudentNotFoundException', async () => {
    const w = makeWorld()
    await expect(w.studentService.getStudentProfile('inconnu')).rejects.toThrow(StudentNotFoundException)
  })

  it('ne contient jamais le mot de passe', async () => {
    const w = makeWorld()
    const s = await newStudent(w)
    const profile = await w.studentService.getStudentProfile(s.id)
    expect('password' in profile).toBe(false)
    expect(profile.email).toBe(s.email)
    expect(profile.firstName).toBe(s.firstName)
    expect(profile.lastName).toBe(s.lastName)
  })

  it('compte uniquement les inscriptions « completed » et les paiements « completed »', async () => {
    let call = 0
    const w = makeWorld(async () => {
      call++
      if (call === 2) throw new PaymentRefusedException('Refus')
      return `TXN-${call}`
    })
    const s = await newStudent(w)
    const ok = await newCourse(w, 1490)
    const refused = await newCourse(w, 990)
    const ok2 = await newCourse(w, 500)
    await w.enrollmentService.enrollStudent(s.id, ok.id, validCard())
    await expect(w.enrollmentService.enrollStudent(s.id, refused.id, validCard())).rejects.toThrow(PaymentRefusedException)
    await w.enrollmentService.enrollStudent(s.id, ok2.id, validCard())

    const profile = await w.studentService.getStudentProfile(s.id)
    expect(profile.enrolledCourses).toEqual([ok.id, ok2.id])
    expect(profile.totalSpent).toBe(1990) // 1490 + 500 ; les 990 DH refusés ne comptent pas
  })

  it('le profil d\'un étudiant ne contient pas les achats d\'un autre', async () => {
    const w = makeWorld()
    const s1 = await newStudent(w)
    const s2 = await newStudent(w)
    const c = await newCourse(w, 1000)
    await w.enrollmentService.enrollStudent(s1.id, c.id, validCard())
    const p2 = await w.studentService.getStudentProfile(s2.id)
    expect(p2.enrolledCourses).toEqual([])
    expect(p2.totalSpent).toBe(0)
  })
})

describe('StudentService.updateStudent (tueurs)', () => {
  it('étudiant inconnu => StudentNotFoundException', async () => {
    const w = makeWorld()
    await expect(w.studentService.updateStudent('inconnu', { firstName: 'X' })).rejects.toThrow(
      StudentNotFoundException
    )
  })

  it('étudiant inconnu avec un nouvel e-mail => StudentNotFoundException (et non une TypeError)', async () => {
    const w = makeWorld()
    await expect(w.studentService.updateStudent('inconnu', { email: 'nouveau@edustream.ma' })).rejects.toThrow(
      StudentNotFoundException
    )
  })

  it('met à jour un champ sans toucher aux autres', async () => {
    const w = makeWorld()
    const s = await newStudent(w, 'maj@edustream.ma')
    const updated = await w.studentService.updateStudent(s.id, { firstName: 'Nouveau' })
    expect(updated.firstName).toBe('Nouveau')
    expect(updated.lastName).toBe(s.lastName)
    expect(updated.email).toBe('maj@edustream.ma')
    expect(updated.password).toBe(s.password)
  })

  it('refuse un e-mail déjà utilisé par un autre étudiant', async () => {
    const w = makeWorld()
    await newStudent(w, 'pris@edustream.ma')
    const s = await newStudent(w, 'moi@edustream.ma')
    await expect(w.studentService.updateStudent(s.id, { email: 'pris@edustream.ma' })).rejects.toThrow(
      EmailAlreadyExistsException
    )
    expect((await w.studentRepo.findById(s.id))?.email).toBe('moi@edustream.ma')
  })

  it('accepte de « changer » vers son propre e-mail et vers un e-mail libre', async () => {
    const w = makeWorld()
    const s = await newStudent(w, 'moi@edustream.ma')
    await expect(w.studentService.updateStudent(s.id, { email: 'moi@edustream.ma' })).resolves.toBeDefined()
    const moved = await w.studentService.updateStudent(s.id, { email: 'libre@edustream.ma' })
    expect(moved.email).toBe('libre@edustream.ma')
  })
})
