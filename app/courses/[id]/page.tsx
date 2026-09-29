'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock3, Users, CheckCircle2, AlertCircle, BookOpen, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  modules: Array<{ title: string; lessons: number }>
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
    modules: [
      { title: 'Fondamentaux avancés', lessons: 8 },
      { title: 'Patterns et architecture', lessons: 10 },
      { title: 'Performance et optimisation', lessons: 7 },
      { title: 'Testing & qualité', lessons: 9 },
    ],
    skills: ['Architecture React', 'Performance', 'Testing', 'State Management'],
    instructor: 'Alexandre Dufour',
    students: 2847,
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
    modules: [
      { title: 'Fondamentaux de Python', lessons: 6 },
      { title: 'Matplotlib & Seaborn', lessons: 8 },
      { title: 'Plotly & interactivité', lessons: 6 },
      { title: 'Cas d\'usage réels', lessons: 5 },
    ],
    skills: ['Python', 'Matplotlib', 'Plotly', 'Data Analysis'],
    instructor: 'Sophie Martin',
    students: 4156,
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
    modules: [
      { title: 'Principes du design system', lessons: 7 },
      { title: 'Composants & patterns', lessons: 9 },
      { title: 'Accessibilité', lessons: 6 },
      { title: 'Implémentation & documentation', lessons: 8 },
    ],
    skills: ['Design Systems', 'Figma', 'Accessibility', 'Documentation'],
    instructor: 'Marie Leclerc',
    students: 1923,
  },
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const course = courseDetails[id]
  const [enrolled, setEnrolled] = useState(false)

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2" /> Retour</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {/* Course Hero */}
            <div className={`h-64 rounded-xl mb-8 bg-gradient-to-br from-${course.accent}-500/20 to-transparent border border-${course.accent}-500/30 flex items-center justify-center`}>
              <div className={`w-24 h-24 rounded-full border-4 border-${course.accent}-500/50 bg-${course.accent}-500/20`} />
            </div>

            {/* Course Meta */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full">{course.category}</span>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full">{course.level}</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-xl text-slate-300 mb-6">{course.fullDescription}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                  <Clock3 className="text-purple-400" />
                  <div>
                    <div className="text-sm text-slate-400">Durée</div>
                    <div className="font-semibold text-white">{course.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                  <Users className="text-cyan-400" />
                  <div>
                    <div className="text-sm text-slate-400">Inscrits</div>
                    <div className="font-semibold text-white">{course.students} étudiants</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Programme</h2>
              <div className="space-y-3">
                {course.modules.map((module, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                        <p className="text-sm text-slate-400">{module.lessons} leçons</p>
                      </div>
                      <CheckCircle2 className="text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Compétences acquises</h2>
              <div className="grid grid-cols-2 gap-3">
                {course.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-white">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <Award className="text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Instructeur</div>
                  <div className="font-semibold text-white">{course.instructor}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="mb-8">
                <div className="text-sm text-slate-400 mb-2">Prix du cours</div>
                <div className="text-5xl font-bold text-white">{course.price}<span className="text-xl"> DH</span></div>
              </div>

              {/* Availability */}
              <div className="mb-6 p-4 bg-slate-900/50 rounded-lg flex items-start gap-3">
                {course.seats > 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">{course.seats} places restantes</div>
                      <div className="text-sm text-slate-400">Inscrivez-vous maintenant</div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Cours complet</div>
                      <div className="text-sm text-slate-400">Aucune place disponible</div>
                    </div>
                  </>
                )}
              </div>

              {!enrolled ? (
                <Link href={`/enroll/${course.id}`} className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={course.seats === 0}>
                    S'inscrire maintenant
                  </Button>
                </Link>
              ) : (
                <div className="w-full p-3 bg-green-500/20 text-green-300 rounded-lg text-center font-semibold">
                  Inscription en cours...
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Accès illimité au contenu
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Certificat de réussite
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Support communautaire
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
