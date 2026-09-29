'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Mail, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const enrollmentId = searchParams?.get('enrollmentId') || 'N/A'

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl" />
              <CheckCircle2 className="w-24 h-24 text-green-400 relative" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">Inscription réussie !</h1>
          <p className="text-xl text-slate-300 mb-8">Votre paiement a été traité avec succès.</p>

          {/* Confirmation Details */}
          <div className="bg-slate-900/50 rounded-lg p-6 mb-8 text-left space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Numéro d'inscription</span>
              <span className="font-mono text-white font-semibold">{enrollmentId}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Statut</span>
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Confirmé
              </span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold text-white text-left">Prochaines étapes</h2>
            <div className="space-y-3">
              <div className="flex gap-3 p-4 bg-slate-800/50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-white">Confirmez votre email</p>
                  <p className="text-sm text-slate-400">Vérifiez votre boîte mail pour le lien de confirmation</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-slate-800/50 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-white">Accédez au cours</p>
                  <p className="text-sm text-slate-400">Commencez à apprendre immédiatement depuis votre dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3">
                <BookOpen className="mr-2 w-4 h-4" />
                Accéder à mon cours
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Retour à l'accueil
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-4">Avez-vous besoin d'aide ?</p>
            <a href="mailto:support@edustream.com" className="text-purple-400 hover:text-purple-300 font-medium">
              support@edustream.com
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
