'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const courseData: Record<string, any> = {
  react: { title: 'React avancé & architecture', price: 1490, id: 'react' },
  data: { title: 'Data visualisation avec Python', price: 990, id: 'data' },
  product: { title: 'Product design systémique', price: 1190, id: 'product' },
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  agreeTerms: boolean
}

export default function EnrollPage() {
  const { id } = useParams<{ id: string }>()
  const course = courseData[id || '']
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreeTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  if (!course) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Cours non trouvé</h1>
          <Link href="/">
            <Button><ArrowLeft className="mr-2" /> Retour</Button>
          </Link>
        </div>
      </main>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'Le prénom est requis'
    if (!formData.lastName.trim()) return 'Le nom est requis'
    if (!formData.email.includes('@')) return 'Email invalide'
    if (!formData.phone.trim()) return 'Le téléphone est requis'
    if (!formData.agreeTerms) return 'Vous devez accepter les conditions'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setStep('confirm')
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          studentEmail: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      })

      if (!response.ok) throw new Error('Inscription échouée')
      
      // Redirect to payment
      window.location.href = `/payment/${course.id}?email=${encodeURIComponent(formData.email)}&firstName=${encodeURIComponent(formData.firstName)}&lastName=${encodeURIComponent(formData.lastName)}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <header className="border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href={`/courses/${course.id}`}>
            <Button variant="ghost"><ArrowLeft className="mr-2" /> Retour au cours</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Inscription au cours</h1>
              <p className="text-slate-400">{course.title}</p>
            </div>

            {/* Steps Indicator */}
            <div className="flex gap-4 mb-12">
              <div className={`flex-1 h-1 rounded-full transition ${step === 'form' ? 'bg-purple-500' : 'bg-slate-700'}`} />
              <div className={`flex-1 h-1 rounded-full transition ${step === 'confirm' ? 'bg-purple-500' : 'bg-slate-700'}`} />
            </div>

            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 p-8 rounded-xl border border-slate-700/50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    placeholder="jean@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    placeholder="+212 6 XX XX XX XX"
                  />
                </div>

                <label className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 accent-purple-500"
                  />
                  <span className="text-sm text-slate-300">
                    J'accepte les conditions d'utilisation et la politique de confidentialité
                  </span>
                </label>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg">
                  Continuer
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700/50">
                  <h2 className="text-xl font-bold text-white mb-6">Confirmer vos informations</h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Nom complet</span>
                      <span className="text-white font-semibold">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white font-semibold">{formData.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Cours</span>
                      <span className="text-white font-semibold">{course.title}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex gap-3 mb-6">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep('form')}
                      className="flex-1"
                      disabled={loading}
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        'Procéder au paiement'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white mb-4">Résumé de l'inscription</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cours</p>
                  <p className="font-semibold text-white">{course.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Prix</p>
                  <p className="text-2xl font-bold text-white">{course.price} DH</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Accès immédiat</span>
                </div>
                <div className="flex gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Certificat inclus</span>
                </div>
                <div className="flex gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Support 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
