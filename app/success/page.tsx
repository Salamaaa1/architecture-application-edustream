'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Mail, BookOpen, ArrowRight, PlayCircle, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { addEnrolledCourse } from '@/lib/enrollment-client'

const courseTitles: Record<string, string> = {
  react: 'React avancé & architecture',
  data: 'Data visualisation avec Python',
  product: 'Product design systémique',
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const enrollmentId = searchParams?.get('enrollmentId') || 'N/A'
  const courseId = searchParams?.get('courseId') || ''
  const courseTitle = courseId && courseTitles[courseId] ? courseTitles[courseId] : 'Votre formation'

  useEffect(() => {
    if (courseId) {
      addEnrolledCourse(courseId)
    }
  }, [courseId])

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm">
      {/* Success Icon */}
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl" />
          <CheckCircle2 className="w-20 h-20 text-green-400 relative" />
        </div>
      </div>

      <div className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-300 text-xs rounded-full font-semibold mb-3">
        Paiement Confirmé
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Inscription réussie !</h1>
      <p className="text-lg text-slate-300 mb-6">
        Félicitations, votre accès à <span className="text-purple-300 font-semibold">{courseTitle}</span> est immédiatement débloqué.
      </p>

      {/* Confirmation Details */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8 text-left space-y-3">
        <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-lg">
          <span className="text-slate-400 text-sm">Numéro d'inscription</span>
          <span className="font-mono text-white text-sm font-semibold">{enrollmentId}</span>
        </div>
        {courseId && (
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-lg">
            <span className="text-slate-400 text-sm">Formation acquise</span>
            <span className="text-purple-300 text-sm font-semibold">{courseTitle}</span>
          </div>
        )}
        <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-lg">
          <span className="text-slate-400 text-sm">Statut du paiement</span>
          <span className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Validé (Accès activé)
          </span>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8 space-y-4">
        <h2 className="text-base font-semibold text-white text-left">Vos avantages disponibles</h2>
        <div className="space-y-3">
          <div className="flex gap-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-left">
            <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-sm">Accès complet aux leçons</p>
              <p className="text-xs text-slate-400">Tous les modules, vidéos et ressources pratiques sont accessibles à votre rythme.</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-left">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white text-sm">Reçu et attestation</p>
              <p className="text-xs text-slate-400">Votre reçu de transaction a été enregistré et vous pouvez télécharger votre certificat à la fin du cours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {courseId ? (
          <Link href={`/courses/${courseId}`} className="flex-1">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 font-semibold shadow-lg shadow-purple-600/30">
              <PlayCircle className="mr-2 w-4 h-4" />
              Accéder au cours maintenant
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 font-semibold shadow-lg shadow-purple-600/30">
              <LayoutDashboard className="mr-2 w-4 h-4" />
              Accéder à mon tableau de bord
            </Button>
          </Link>
        )}

        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full py-3 text-slate-200 border-slate-700 hover:bg-slate-800">
            <LayoutDashboard className="mr-2 w-4 h-4 text-purple-400" />
            Mon tableau de bord
          </Button>
        </Link>
      </div>

      <div className="mt-4">
        <Link href="/" className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1">
          Retour à l'accueil <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <Suspense fallback={<div className="text-white text-center">Chargement des informations...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}