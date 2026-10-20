'use client'

import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Lock, CreditCard, Calendar, User, PlayCircle, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { addEnrolledCourse, isEnrolledInCourse, syncUserEnrollments } from '@/lib/enrollment-client'

const courseData: Record<string, any> = {
  react: { title: 'React avancé & architecture', price: 1490, id: 'react' },
  data: { title: 'Data visualisation avec Python', price: 990, id: 'data' },
  product: { title: 'Product design systémique', price: 1190, id: 'product' },
}

interface PaymentForm {
  cardName: string
  cardNumber: string
  expiryDate: string
  cvv: string
  billingAddress: string
  billingCity: string
  billingZip: string
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const course = courseData[id || '']
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams?.get('email') || ''
  const firstName = searchParams?.get('firstName') || ''
  const lastName = searchParams?.get('lastName') || ''

  const [formData, setFormData] = useState<PaymentForm>({
    cardName: firstName && lastName ? `${firstName} ${lastName}` : '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    billingCity: '',
    billingZip: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)

  useEffect(() => {
    if (course?.id) {
      if (isEnrolledInCourse(course.id)) {
        setAlreadyEnrolled(true)
      } else if (email) {
        syncUserEnrollments(email).then((list) => {
          if (list.includes(course.id)) {
            setAlreadyEnrolled(true)
          }
        })
      }
    }
  }, [course?.id, email])

  if (!course) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Cours non trouvé</h1>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </main>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target

    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').slice(0, 16)
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    }

    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '').slice(0, 4)
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2)
      }
    }

    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3)
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const validatePayment = () => {
    if (!formData.cardName.trim()) return 'Le nom sur la carte est requis'
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) return 'Numéro de carte invalide (16 chiffres)'
    if (!formData.expiryDate.match(/^\d{2}\/\d{2}$/)) return "Date d'expiration invalide (MM/YY)"
    if (formData.cvv.length !== 3) return 'CVV invalide (3 chiffres)'
    if (!formData.billingAddress.trim()) return "L'adresse est requise"
    if (!formData.billingCity.trim()) return 'La ville est requise'
    if (!formData.billingZip.match(/^\d{5}$/)) return 'Code postal invalide (5 chiffres)'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validatePayment()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          studentEmail: email,
          firstName,
          lastName,
          amount: course.price,
          cardData: {
            name: formData.cardName,
            number: formData.cardNumber.replace(/\s/g, ''),
            expiry: formData.expiryDate,
            cvv: formData.cvv,
          },
          billingInfo: {
            address: formData.billingAddress,
            city: formData.billingCity,
            zipCode: formData.billingZip,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.alreadyEnrolled || (data.error && data.error.toLowerCase().includes('déjà inscrit'))) {
          addEnrolledCourse(course.id, { email, firstName, lastName })
          setAlreadyEnrolled(true)
          setLoading(false)
          return
        }
        throw new Error(data.error || 'Erreur lors du traitement du paiement')
      }

      addEnrolledCourse(course.id, { email, firstName, lastName })
      setSuccess(true)
      setTimeout(() => {
        router.push(`/success?enrollmentId=${data.enrollmentId || 'ENR-CONFIRMED'}&courseId=${course.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/courses/${course.id}`}>
            <Button variant="ghost">Retour au cours</Button>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-purple-400 hover:text-purple-300">
            Mon tableau de bord
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Paiement sécurisé</h1>
              <p className="text-slate-400">Finalisez votre inscription à {course.title}</p>
            </div>

            {alreadyEnrolled ? (
              <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                <CheckCircle2 className="w-16 h-16 text-purple-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Vous possédez déjà ce cours !</h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Votre compte est déjà inscrit à la formation <strong className="text-purple-300">{course.title}</strong>. Vous n'avez pas besoin de payer à nouveau.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Link href={`/courses/${course.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Accéder au cours maintenant
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-slate-700 text-slate-200">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Mon tableau de bord
                    </Button>
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-300 mb-2">Paiement réussi !</h2>
                <p className="text-green-300/80">Activation de votre cours en cours...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Security Badge */}
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <Lock className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Paiement protégé par SSL (Banque Populaire / CMI)</span>
                </div>

                {/* Card Information */}
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700/50">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informations de la carte bancaire
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Nom sur la carte</label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Numéro de carte</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                        placeholder="4532 0000 0000 0000"
                        maxLength={19}
                      />
                      <p className="text-xs text-slate-500 mt-1">Format: 16 chiffres</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expiration
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700/50">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Adresse de facturation
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Adresse</label>
                      <input
                        type="text"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        placeholder="123 Avenue Mohammed V"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Ville</label>
                        <input
                          type="text"
                          name="billingCity"
                          value={formData.billingCity}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          placeholder="Casablanca"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Code Postal</label>
                        <input
                          type="text"
                          name="billingZip"
                          value={formData.billingZip}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          placeholder="20000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-semibold shadow-lg shadow-purple-600/30"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Traitement du paiement...
                    </>
                  ) : (
                    `Payer ${course.price} DH`
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white mb-6">Résumé de la commande</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cours sélectionné</p>
                  <p className="font-semibold text-white">{course.title}</p>
                </div>
                {email && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Email étudiant</p>
                    <p className="text-sm text-white font-mono break-all">{email}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Sous-total</span>
                  <span>{course.price} DH</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>TVA (0%)</span>
                  <span>0 DH</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg mb-6">
                <span className="font-semibold text-white">Total à régler</span>
                <span className="text-2xl font-bold text-purple-400">{course.price} DH</span>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Paiement sécurisé CMI / SSL</span>
                </li>
                <li className="flex gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Accès illimité et immédiat au cours</span>
                </li>
                <li className="flex gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Certificat de réussite inclus</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
