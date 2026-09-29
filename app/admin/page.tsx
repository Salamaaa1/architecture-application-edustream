'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Users, BookOpen, CreditCard, RefreshCw, LogOut, CheckCircle, AlertCircle, ShieldAlert, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AdminStats {
  totalStudents: number
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
  currency: string
}

interface StudentItem {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt?: string
}

interface EnrollmentItem {
  id: string
  studentId: string
  courseId: string
  status: string
  enrolledAt: string
  paymentId?: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'enrollments'>('users')
  const [roleMessage, setRoleMessage] = useState('')

  // Check stored auth session
  useEffect(() => {
    const savedAuth = localStorage.getItem('edustream_admin_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData()
    }
  }, [isAuthenticated])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@edustream.ma', password: adminPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Mot de passe administrateur incorrect')
      }

      setIsAuthenticated(true)
      localStorage.setItem('edustream_admin_auth', 'true')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur d\'authentification')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('edustream_admin_auth')
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, studentsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/students'),
        fetch('/api/admin/enrollments'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(Array.isArray(studentsData) ? studentsData : [])
      }

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : [])
      }
    } catch (err) {
      console.error('Erreur chargement données admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserRole = async (studentId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    try {
      const res = await fetch(`/api/students/${studentId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        throw new Error('Erreur lors du changement de rôle')
      }

      setRoleMessage(`Rôle mis à jour avec succès : ${newRole}`)
      setTimeout(() => setRoleMessage(''), 3000)

      // Refresh student list
      loadAdminData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Espace Administrateur</h1>
            <p className="text-slate-400 text-sm">Gestion de la plateforme EduStream</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe Admin
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Entrez le mot de passe admin"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-base"
            >
              {loginLoading ? 'Connexion...' : 'Se connecter en tant qu\'Admin'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
              ← Retour au site public
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                EduStream <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">ADMIN</span>
              </h1>
              <p className="text-xs text-slate-400">Panneau de gestion & administration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Revenus Totaux</span>
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.totalRevenue ?? 0} <span className="text-lg text-purple-400 font-medium">DH</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Dirhams Marocains (MAD)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Total Étudiants</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalStudents ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Comptes utilisateurs inscrits</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Inscriptions Cours</span>
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalEnrollments ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Inscriptions enregistrées</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium">Cours Actifs</span>
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalCourses ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Formations dans le catalogue</p>
          </div>
        </div>

        {/* Action feedback */}
        {roleMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/40 rounded-xl flex items-center gap-3 text-green-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{roleMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Gestion des Utilisateurs ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'enrollments'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Historique des Inscriptions ({enrollments.length})
          </button>
        </div>

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Utilisateurs & Gestion des Rôles</h2>
                <p className="text-xs text-slate-400">Promouvoir des utilisateurs en Admin ou ajuster les accès</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nom & Prénom</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Rôle Actuel</th>
                    <th className="px-6 py-4 text-right">Actions (User ↔ Admin)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{student.id}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">{student.email}</td>
                      <td className="px-6 py-4">
                        {student.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <Users className="w-3.5 h-3.5" />
                            USER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant={student.role === 'ADMIN' ? 'outline' : 'default'}
                          onClick={() => toggleUserRole(student.id, student.role)}
                          className={
                            student.role === 'ADMIN'
                              ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }
                        >
                          {student.role === 'ADMIN' ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                              Passer en User
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                              Promouvoir Admin
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Enrollments */}
        {activeTab === 'enrollments' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Registre des Inscriptions</h2>
              <p className="text-xs text-slate-400">Historique complet des transactions & inscriptions</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">ID Inscription</th>
                    <th className="px-6 py-4">ID Étudiant</th>
                    <th className="px-6 py-4">ID Cours</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">ID Paiement</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono text-xs text-purple-400">{enr.id}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{enr.studentId}</td>
                      <td className="px-6 py-4 font-semibold text-white uppercase">{enr.courseId}</td>
                      <td className="px-6 py-4">
                        {enr.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                            Validé
                          </span>
                        ) : enr.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                            Échoué
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{enr.paymentId || '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleString('fr-FR') : '-'}
                      </td>
                    </tr>
                  ))}
                  {enrollments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        Aucune inscription enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
