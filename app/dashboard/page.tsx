'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ArrowRight,
  Clock3,
  Award,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Layers3,
  LogOut,
  User,
  Search,
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { getStoredUser, getStoredEnrolledCourseIds, syncUserEnrollments, StoredUser } from '@/lib/enrollment-client'

interface CourseInfo {
  id: string
  title: string
  category: string
  level: string
  price: number
  seats: number
  duration: string
  accent: string
  description: string
  instructor: string
}

const allCourses: Record<string, CourseInfo> = {
  react: {
    id: 'react',
    title: 'React avancé & architecture',
    category: 'Développement',
    level: 'Intermédiaire',
    price: 1490,
    seats: 8,
    duration: '12 h',
    accent: 'violet',
    description: 'Construisez des interfaces robustes avec des patterns modernes et testables.',
    instructor: 'Alexandre Dufour',
  },
  data: {
    id: 'data',
    title: 'Data visualisation avec Python',
    category: 'Data & IA',
    level: 'Débutant',
    price: 990,
    seats: 14,
    duration: '8 h',
    accent: 'cyan',
    description: 'Transformez vos données en décisions grâce à des visualisations claires.',
    instructor: 'Sophie Martin',
  },
  product: {
    id: 'product',
    title: 'Product design systémique',
    category: 'Design',
    level: 'Tous niveaux',
    price: 1190,
    seats: 5,
    duration: '10 h',
    accent: 'amber',
    description: 'Créez un langage produit cohérent, accessible et prêt à évoluer.',
    instructor: 'Marie Leclerc',
  },
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookupSuccess, setLookupSuccess] = useState('')

  const loadData = async () => {
    const user = getStoredUser()
    setCurrentUser(user)
    const storedIds = getStoredEnrolledCourseIds()
    setEnrolledCourseIds(storedIds)

    if (user?.email || user?.id) {
      const synced = await syncUserEnrollments(user.email || user.id || '')
      setEnrolledCourseIds(synced)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData()
    }

    window.addEventListener('edustream_auth_change', handleUpdate)
    return () => {
      window.removeEventListener('edustream_auth_change', handleUpdate)
    }
  }, [])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLookupError('')
    setLookupSuccess('')
    if (!lookupEmail.includes('@')) {
      setLookupError('Veuillez entrer une adresse email valide.')
      return
    }

    try {
      const synced = await syncUserEnrollments(lookupEmail.trim())
      if (synced.length > 0) {
        setEnrolledCourseIds(synced)
        setLookupSuccess(`${synced.length} cours trouvé(s) et synchronisé(s) !`)
      } else {
        setLookupError('Aucun cours trouvé pour cette adresse email.')
      }
    } catch {
      setLookupError('Erreur de synchronisation avec le serveur.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('edustream_user')
    localStorage.removeItem('edustream_enrolled_courses')
    setCurrentUser(null)
    setEnrolledCourseIds([])
    window.dispatchEvent(new Event('edustream_auth_change'))
  }

  const enrolledCourses = enrolledCourseIds
    .map((id) => allCourses[id])
    .filter(Boolean)

  const otherCourses = Object.values(allCourses).filter(
    (c) => !enrolledCourseIds.includes(c.id)
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="brand flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span className="brand-mark text-purple-400"><Layers3 /></span>
            <span>edustream<span className="text-purple-400">.</span></span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition">
              Catalogue
            </Link>
            <Link href="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition">
              Admin
            </Link>
            {currentUser && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4 mr-1.5" /> Déconnexion
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Banner Profile */}
        <section className="p-8 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/30 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              <GraduationCap className="w-4 h-4" /> Espace Apprenant
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Bonjour, {currentUser?.firstName || 'Cher Apprenant'} {currentUser?.lastName || ''} !
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Retrouvez l'ensemble de vos formations achetées, suivez votre progression et accédez à vos contenus de cours illimités.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center min-w-[130px]">
              <span className="text-3xl font-bold text-purple-400">{enrolledCourses.length}</span>
              <p className="text-xs text-slate-400 mt-1">Cours acquis</p>
            </div>
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center min-w-[130px]">
              <span className="text-3xl font-bold text-cyan-400">
                {enrolledCourses.reduce((sum, c) => sum + parseInt(c.duration || '0'), 0)}h
              </span>
              <p className="text-xs text-slate-400 mt-1">Volume de cours</p>
            </div>
          </div>
        </section>

        {/* Mes Cours Enrolés */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-purple-400 w-6 h-6" /> Mes Formations Disponibles
              </h2>
              <p className="text-slate-400 text-sm">
                Vous avez un accès permanent et illimité à ces formations.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-full font-semibold">
              {enrolledCourses.length} actif{enrolledCourses.length > 1 ? 's' : ''}
            </span>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="group relative bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold rounded-md">
                        {course.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acquis
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2">
                      {course.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                      <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5 text-slate-400" /> {course.duration}</span>
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {course.instructor}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <Link href={`/courses/${course.id}`} className="w-full block">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25">
                        <PlayCircle className="w-4 h-4" /> Accéder à la formation
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold text-white">Vous n'avez pas encore de cours actif</h3>
                <p className="text-slate-400 text-sm">
                  Lorsque vous réglez une formation, celle-ci apparaît automatiquement ici avec l'ensemble de ses modules et ressources.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/#catalogue">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Explorer le catalogue <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {/* Email lookup fallback */}
              <div className="max-w-md mx-auto pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-3">
                  Vous avez déjà payé mais vos cours ne s'affichent pas ? Entrez votre email utilisé lors de l'inscription :
                </p>
                <form onSubmit={handleLookup} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <Button type="submit" size="sm" variant="outline" className="text-xs">
                    Synchroniser
                  </Button>
                </form>
                {lookupError && <p className="text-xs text-red-400 mt-2">{lookupError}</p>}
                {lookupSuccess && <p className="text-xs text-green-400 mt-2">{lookupSuccess}</p>}
              </div>
            </div>
          )}
        </section>

        {/* Formations supplémentaires recommandées */}
        {otherCourses.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-slate-800/80">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-cyan-400 w-5 h-5" /> Formations Recommandées
              </h2>
              <p className="text-slate-400 text-sm">Développez d'autres compétences complémentaires.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCourses.map((course) => (
                <div key={course.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">{course.category}</span>
                    <h3 className="font-bold text-white text-lg">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-purple-400 text-sm">{course.price} DH</span>
                    <Link href={`/courses/${course.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      Découvrir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
