'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Clock3,
  Users,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Zap,
  PlayCircle,
  PauseCircle,
  CheckSquare,
  Square,
  Lock,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Share2,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getStoredUser, isEnrolledInCourse, syncUserEnrollments, addEnrolledCourse } from '@/lib/enrollment-client'

interface Lesson {
  id: string
  title: string
  duration: string
  content: string
  codeSnippet?: string
}

interface Module {
  title: string
  lessons: Lesson[]
}

type CourseDetail = {
  id: string
  title: string
  category: string
  level: string
  price: number
  seats: number
  duration: string
  accent: string
  description: string
  fullDescription: string
  modules: Module[]
  skills: string[]
  instructor: string
  students: number
}

const courseDetails: Record<string, CourseDetail> = {
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
    fullDescription: `Plongez dans les concepts avancés de React pour maîtriser l'architecture d'applications à grande échelle. 
    
Ce cours couvre les patterns modernes, l'optimisation des performances, la gestion d'état avec des services injectables, 
et les bonnes pratiques de test. Vous apprendrez à construire des applications maintenables et testables.`,
    skills: ['Architecture React', 'Performance & Profiling', 'Testing & Qualité', 'Gestion d\'état scalable'],
    instructor: 'Alexandre Dufour',
    students: 2847,
    modules: [
      {
        title: 'Module 1 : Fondamentaux avancés et Réconciliation',
        lessons: [
          {
            id: 'react-1',
            title: 'Le fonctionnement interne du Fiber Reconciler',
            duration: '25 min',
            content: 'Comprenez comment React planifie les mises à jour, sépare le render du commit phase, et comment le Concurrent Mode priorise les interactions utilisateur.',
            codeSnippet: `// Exemple de transition React 19 / Concurrent
import { useTransition, useState } from 'react'

function CourseFilter() {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')

  const handleSearch = (e) => {
    startTransition(() => {
      setFilter(e.target.value)
    })
  }
}`
          },
          {
            id: 'react-2',
            title: 'Custom Hooks et composition avancée',
            duration: '35 min',
            content: 'Créer des hooks découplés et composables avec gestion d\'états asynchrones et synchronisation propre des effets.',
            codeSnippet: `function useAsyncOperation<T>(asyncFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  // ...
  return { data, loading, execute }
}`
          }
        ]
      },
      {
        title: 'Module 2 : Patterns architecturaux & Clean Code',
        lessons: [
          {
            id: 'react-3',
            title: 'Inversion de dépendance et Injection de Services',
            duration: '40 min',
            content: 'Mise en place du pattern Repository et Service Container pour rendre votre code React indépendant des bibliothèques externes et 100% testable.',
            codeSnippet: `// Interface Repository
export interface CourseRepository {
  findById(id: string): Promise<Course>
  getAvailableCourses(): Promise<Course[]>
}`
          },
          {
            id: 'react-4',
            title: 'Gestion d\'état scalable et immutabilité',
            duration: '30 min',
            content: 'Patterns de découpage d\'état : quand utiliser le local state, le contexte, ou un store externalisé sans surcharger le re-render tree.',
          }
        ]
      },
      {
        title: 'Module 3 : Performance et Tests',
        lessons: [
          {
            id: 'react-5',
            title: 'Profilage React DevTools & Benchmarking',
            duration: '30 min',
            content: 'Identifier les re-renders inutiles, mesurer le temps de render et appliquer useMemo/useCallback avec discernement.',
          },
          {
            id: 'react-6',
            title: 'Tests unitaires et d\'intégration avec Vitest & Testing Library',
            duration: '45 min',
            content: 'Tester les comportements utilisateurs réels sans tester les détails d\'implémentation internes.',
            codeSnippet: `test('affiche le badge débloqué pour un étudiant inscrit', async () => {
  render(<CoursePage />)
  expect(screen.getByText(/accès illimité débloqué/i)).toBeInTheDocument()
})`
          }
        ]
      }
    ]
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
    fullDescription: `Apprenez à créer des visualisations data percutantes avec Python. De Matplotlib à Plotly,
    
maîtrisez les outils essentiels pour communiquer vos données efficacement. Aucune expérience préalable requise.`,
    skills: ['Python Data', 'Matplotlib & Seaborn', 'Plotly Interactif', 'Storytelling avec les données'],
    instructor: 'Sophie Martin',
    students: 4156,
    modules: [
      {
        title: 'Module 1 : Prise en main des données avec Pandas',
        lessons: [
          {
            id: 'data-1',
            title: 'Nettoyage et structuration de données tabulaires',
            duration: '30 min',
            content: 'Importer des fichiers CSV/JSON, gérer les valeurs manquantes et filtrer les séries de données avec Pandas.',
            codeSnippet: `import pandas as pd
df = pd.read_csv('ventes.csv')
df_clean = df.dropna().groupby('region')['montant'].sum()`
          },
          {
            id: 'data-2',
            title: 'Statistiques descriptives clés',
            duration: '25 min',
            content: 'Moyenne, médiane, écart-type et corrélations pour identifier les tendances avant visualisation.'
          }
        ]
      },
      {
        title: 'Module 2 : Visualisations statiques & interactives',
        lessons: [
          {
            id: 'data-3',
            title: 'Graphiques éditoriaux avec Seaborn',
            duration: '40 min',
            content: 'Distribution, heatmaps et graphiques de régression prêts pour vos rapports professionnels.',
            codeSnippet: `import seaborn as sns
sns.set_theme(style="darkgrid")
sns.barplot(data=df, x="categorie", y="revenu", palette="magma")`
          },
          {
            id: 'data-4',
            title: 'Dashboards dynamiques avec Plotly',
            duration: '45 min',
            content: 'Création de graphiques interactifs avec zoom, infobulles et sélection dynamique pour vos utilisateurs finaux.'
          }
        ]
      }
    ]
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
    fullDescription: `Découvrez comment créer des design systems qui durent. Ce cours explore les principes
    
de scalabilité, d'accessibilité et de maintenabilité dans la conception de produits digitaux.`,
    skills: ['Design Systems', 'Design Tokens', 'Accessibilité (WCAG)', 'Storybook & Documentation'],
    instructor: 'Marie Leclerc',
    students: 1923,
    modules: [
      {
        title: 'Module 1 : Architecture du Design System',
        lessons: [
          {
            id: 'product-1',
            title: 'Design Tokens : Couleurs, Typographies et Espacements',
            duration: '35 min',
            content: 'Standardiser les valeurs fondamentales pour assurer la parité exacte entre Figma et le code CSS/Tailwind.',
            codeSnippet: `// tokens.json
{
  "color": {
    "brand": { "primary": "#7c3aed", "accent": "#06b6d4" },
    "surface": { "background": "#0b0f19", "card": "#131b2e" }
  }
}`
          },
          {
            id: 'product-2',
            title: 'Atomic Design en pratique',
            duration: '40 min',
            content: 'Découpage du produit en atomes, molécules, organismes et templates pour une réutilisabilité maximale.'
          }
        ]
      },
      {
        title: 'Module 2 : Accessibilité et Déploiement',
        lessons: [
          {
            id: 'product-3',
            title: 'Accessibilité numérique et contrastes WCAG AA/AAA',
            duration: '30 min',
            content: 'Assurer une accessibilité universelle : focus states, navigation clavier et sémantique ARIA.'
          },
          {
            id: 'product-4',
            title: 'Documentation vivante et gouvernance du système',
            duration: '45 min',
            content: 'Comment documenter les patterns, intégrer Storybook et faire évoluer le système en équipe multidisciplinaire.'
          }
        ]
      }
    ]
  },
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const course = courseDetails[id || '']

  const [enrolled, setEnrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<'learning' | 'overview'>('overview')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)

  // Total lessons in course
  const allLessons = course ? course.modules.flatMap((m) => m.lessons) : []
  const totalLessonsCount = allLessons.length

  // Check enrollment status and load progress
  useEffect(() => {
    if (!course?.id) return

    const checkStatus = async () => {
      const user = getStoredUser()
      let isUserEnrolled = isEnrolledInCourse(course.id)

      if (searchParams?.get('enrolled') === 'true') {
        addEnrolledCourse(course.id)
        isUserEnrolled = true
      }

      if (user?.email && !isUserEnrolled) {
        const synced = await syncUserEnrollments(user.email)
        if (synced.includes(course.id)) {
          isUserEnrolled = true
        }
      }

      setEnrolled(isUserEnrolled)
      if (isUserEnrolled) {
        setActiveTab('learning')
      }

      // Load progress
      try {
        const savedProgress = localStorage.getItem(`edustream_progress_${course.id}`)
        if (savedProgress) {
          const list: string[] = JSON.parse(savedProgress)
          setCompletedLessonIds(list)
        }
      } catch {}

      if (allLessons.length > 0 && !selectedLesson) {
        setSelectedLesson(allLessons[0])
      }
    }

    checkStatus()

    const handleAuthChange = () => checkStatus()
    window.addEventListener('edustream_auth_change', handleAuthChange)
    return () => window.removeEventListener('edustream_auth_change', handleAuthChange)
  }, [course?.id, searchParams])

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessonIds((prev) => {
      let next: string[]
      if (prev.includes(lessonId)) {
        next = prev.filter((id) => id !== lessonId)
      } else {
        next = [...prev, lessonId]
      }
      try {
        localStorage.setItem(`edustream_progress_${course.id}`, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Cours non trouvé</h1>
          <Link href="/">
            <Button><ArrowLeft className="mr-2" /> Retour à l'accueil</Button>
          </Link>
        </div>
      </main>
    )
  }

  const completionPercent = totalLessonsCount > 0
    ? Math.round((completedLessonIds.length / totalLessonsCount) * 100)
    : 0

  const user = getStoredUser()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 w-4 h-4" /> Retour à l'accueil
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {enrolled && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-purple-500/40 text-purple-300 hover:bg-purple-950/40">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" /> Mon tableau de bord
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Enrolled Status Banner */}
      {enrolled && (
        <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border-b border-purple-500/30 py-3 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-green-300 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Vous possédez cette formation &bull; Accès illimité débloqué</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-300">
                Progression : <strong>{completionPercent}%</strong> ({completedLessonIds.length}/{totalLessonsCount} leçons)
              </span>
              <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* View Mode Tabs for enrolled students */}
            {enrolled && (
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveTab('learning')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                    activeTab === 'learning'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" /> Espace de Formation (Lecteur & Leçons)
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                    activeTab === 'overview'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Programme & Présentation
                </button>
              </div>
            )}

            {/* TAB: LEARNING SPACE (When enrolled and selected) */}
            {enrolled && activeTab === 'learning' ? (
              <div className="space-y-6">
                {/* Interactive Player Mockup */}
                <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 flex flex-col items-center justify-center p-6 text-center relative group">
                    <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-transparent opacity-60" />
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 transition transform hover:scale-105"
                      aria-label={isPlaying ? 'Pause' : 'Lire la leçon'}
                    >
                      {isPlaying ? (
                        <PauseCircle className="w-10 h-10" />
                      ) : (
                        <PlayCircle className="w-10 h-10 ml-1" />
                      )}
                    </button>
                    <p className="mt-4 text-sm font-semibold text-slate-300">
                      {isPlaying ? 'Lecture en cours...' : 'Cliquer pour démarrer la leçon vidéo'}
                    </p>
                    <span className="text-xs text-purple-400 font-mono mt-1">
                      {selectedLesson?.duration || '30 min'} &bull; Haute Définition 1080p
                    </span>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Leçon en cours</span>
                      <h2 className="text-lg font-bold text-white">{selectedLesson?.title || allLessons[0]?.title}</h2>
                    </div>

                    {selectedLesson && (
                      <Button
                        onClick={() => toggleLessonCompleted(selectedLesson.id)}
                        variant={completedLessonIds.includes(selectedLesson.id) ? 'default' : 'outline'}
                        size="sm"
                        className={
                          completedLessonIds.includes(selectedLesson.id)
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'border-slate-700 text-slate-300 hover:text-white'
                        }
                      >
                        {completedLessonIds.includes(selectedLesson.id) ? (
                          <>
                            <CheckSquare className="w-4 h-4 mr-1.5" /> Leçon terminée !
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 mr-1.5" /> Marquer comme terminée
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lesson Description & Resources */}
                {selectedLesson && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" /> Contenu et Objectifs de la Leçon
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selectedLesson.content}
                    </p>

                    {selectedLesson.codeSnippet && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-semibold text-slate-400">Exemple de code / Mise en pratique :</span>
                        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-purple-300 text-xs font-mono overflow-x-auto">
                          {selectedLesson.codeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Curriculum list with interactive selection */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-purple-400 w-5 h-5" /> Sommaire du cours
                  </h3>

                  <div className="space-y-3">
                    {course.modules.map((module, mIdx) => (
                      <div key={mIdx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="font-semibold text-white text-sm text-purple-300">
                          {module.title}
                        </h4>
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => {
                            const isSelected = selectedLesson?.id === lesson.id
                            const isDone = completedLessonIds.includes(lesson.id)
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  setSelectedLesson(lesson)
                                  setIsPlaying(false)
                                }}
                                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition border ${
                                  isSelected
                                    ? 'bg-purple-950/40 border-purple-500/50 text-white'
                                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <PlayCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                  )}
                                  <span className="text-sm font-medium">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">{lesson.duration}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate Banner when completed */}
                {completionPercent === 100 && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-green-950/60 via-slate-900 to-purple-950/60 border border-green-500/40 text-center space-y-3 shadow-xl">
                    <Award className="w-12 h-12 text-yellow-400 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Félicitations ! Vous avez validé l'intégralité du cours</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Toutes les compétences pratiques requises ont été acquises. Votre certificat de réussite est disponible.
                    </p>
                    <Button
                      onClick={() => setShowCertificateModal(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" /> Voir mon Certificat de Réussite
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* TAB: OVERVIEW & PRESENTATION */
              <div className="space-y-8">
                {/* Course Hero Banner */}
                <div className={`h-64 rounded-2xl bg-gradient-to-br from-${course.accent}-500/20 via-slate-900 to-slate-950 border border-${course.accent}-500/30 flex items-center justify-center relative overflow-hidden`}>
                  <div className="text-center space-y-2 z-10 px-4">
                    <span className="px-3 py-1 bg-slate-900/80 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30">
                      {course.category} &bull; {course.level}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{course.title}</h1>
                  </div>
                </div>

                {/* Course Meta Info */}
                <div className="space-y-4">
                  <p className="text-lg text-slate-300 leading-relaxed">{course.fullDescription}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <Clock3 className="text-purple-400 w-5 h-5" />
                      <div>
                        <div className="text-xs text-slate-400">Durée totale</div>
                        <div className="font-semibold text-white">{course.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                      <Users className="text-cyan-400 w-5 h-5" />
                      <div>
                        <div className="text-xs text-slate-400">Communauté</div>
                        <div className="font-semibold text-white">{course.students} inscrits</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modules Curriculum Overview */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Programme de la formation</h2>
                  <div className="space-y-3">
                    {course.modules.map((module, i) => (
                      <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                            <p className="text-xs text-slate-400">{module.lessons.length} leçons interactives</p>
                          </div>
                          {enrolled ? (
                            <CheckCircle2 className="text-green-400 w-5 h-5" />
                          ) : (
                            <Lock className="text-slate-500 w-5 h-5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Compétences acquises</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {course.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-white text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructor */}
                <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Award className="text-purple-400 w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Instructeur certifié</div>
                    <div className="font-semibold text-white text-lg">{course.instructor}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/60 shadow-xl space-y-6">
              {enrolled ? (
                /* ENROLLED VIEW IN SIDEBAR */
                <div className="space-y-6">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-1" />
                    <h3 className="font-bold text-white text-base">Vous êtes inscrit</h3>
                    <p className="text-xs text-slate-300">Votre formation est entièrement débloquée.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progression globale</span>
                      <span className="font-semibold text-white">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveTab('learning')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 shadow-lg shadow-purple-600/30"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Continuer la formation
                  </Button>

                  <Link href="/dashboard" className="block w-full">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-200">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Voir mon tableau de bord
                    </Button>
                  </Link>
                </div>
              ) : (
                /* NOT ENROLLED VIEW IN SIDEBAR (Pricing & Enroll CTA) */
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Tarif unique</div>
                    <div className="text-4xl font-extrabold text-white">
                      {course.price} <span className="text-lg text-purple-400 font-semibold">DH</span>
                    </div>
                  </div>

                  {/* Seat Availability */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-3">
                    {course.seats > 0 ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white text-sm">{course.seats} places disponibles</div>
                          <div className="text-xs text-slate-400">Inscriptions ouvertes</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white text-sm">Cours complet</div>
                          <div className="text-xs text-slate-400">Session fermée</div>
                        </div>
                      </>
                    )}
                  </div>

                  <Link href={`/enroll/${course.id}`} className="block w-full">
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-base shadow-lg shadow-purple-600/30"
                      disabled={course.seats === 0}
                    >
                      S'inscrire maintenant
                    </Button>
                  </Link>
                </div>
              )}

              {/* Guarantees */}
              <div className="pt-6 border-t border-slate-700/50 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Accès illimité et à vie au contenu</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Certificat d'achèvement officiel</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Exercices et projets pratiques inclus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border-2 border-yellow-500/50 rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mx-auto text-yellow-400">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Certificat d'Accomplissement</span>
              <h2 className="text-2xl font-bold text-white">{course.title}</h2>
              <p className="text-slate-300 text-sm">
                Décerné avec félicitations à :
              </p>
              <p className="text-xl font-extrabold text-purple-300">
                {user?.firstName || 'Étudiant'} {user?.lastName || ''}
              </p>
              <p className="text-xs text-slate-400">
                Pour avoir validé avec succès l'ensemble des modules ({totalLessonsCount} leçons pratiques).
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Instructeur : {course.instructor}</span>
              <span>Plateforme : EduStream</span>
            </div>

            <Button
              onClick={() => setShowCertificateModal(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
