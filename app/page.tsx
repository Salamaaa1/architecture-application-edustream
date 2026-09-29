'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Sparkles, Text } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Layers3, Menu, PlayCircle, Search, ShieldCheck, Sparkles as SparklesIcon, Users, X, Lock, Mail, User, AlertCircle, LogOut } from 'lucide-react'
import type { Mesh } from 'three'
import { Button, buttonVariants } from '@/components/ui/button'

const courses = [
  { id: 'react', title: 'React avancé & architecture', category: 'Développement', level: 'Intermédiaire', price: 1490, seats: 8, duration: '12 h', accent: 'violet', description: 'Construisez des interfaces robustes avec des patterns modernes et testables.' },
  { id: 'data', title: 'Data visualisation avec Python', category: 'Data & IA', level: 'Débutant', price: 990, seats: 14, duration: '8 h', accent: 'cyan', description: 'Transformez vos données en décisions grâce à des visualisations claires.' },
  { id: 'product', title: 'Product design systémique', category: 'Design', level: 'Tous niveaux', price: 1190, seats: 5, duration: '10 h', accent: 'amber', description: 'Créez un langage produit cohérent, accessible et prêt à évoluer.' },
]

function OrbitingCore() {
  const mesh = useMemo(() => ({ current: null as Mesh | null }), [])
  useFrame((_, delta) => { if (mesh.current) mesh.current.rotation.y += delta * 0.35 })
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={mesh.current ? undefined : (node) => { mesh.current = node }} rotation={[0.2, 0.2, 0]}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial color="#9a7cff" emissive="#37206f" emissiveIntensity={1.2} roughness={0.2} metalness={0.5} wireframe />
      </mesh>
      <mesh scale={0.72}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshStandardMaterial color="#16d9ff" emissive="#075d91" emissiveIntensity={1.8} transparent opacity={0.35} />
      </mesh>
    </Float>
  )
}

function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5.4], fov: 38 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 4]} color="#7c5cff" intensity={18} />
        <pointLight position={[-3, -2, 2]} color="#00d9ff" intensity={12} />
        <OrbitingCore />
        <Sparkles count={80} scale={7} size={2.2} speed={0.35} color="#a892ff" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.55} enablePan={false} />
      </Canvas>
    </div>
  )
}

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [currentUser, setCurrentUser] = useState<{ email: string; firstName: string; lastName: string } | null>(null)
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('edustream_user')
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)) } catch {}
    }
  }, [])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      if (authMode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email, password: authForm.password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Connexion échouée')

        const userObj = { email: data.email, firstName: data.firstName || 'Étudiant', lastName: data.lastName || '' }
        setCurrentUser(userObj)
        localStorage.setItem('edustream_user', JSON.stringify(userObj))
        setAuthModalOpen(false)
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            firstName: authForm.firstName,
            lastName: authForm.lastName,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Création de compte échouée")

        const userObj = { email: data.email, firstName: data.firstName, lastName: data.lastName }
        setCurrentUser(userObj)
        localStorage.setItem('edustream_user', JSON.stringify(userObj))
        setAuthModalOpen(false)
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('edustream_user')
  }

  const filtered = courses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className="edustream-shell">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="edustream accueil"><span className="brand-mark"><Layers3 /></span><span>edustream<span className="brand-dot">.</span></span></a>
        <nav className={mobileOpen ? 'main-nav mobile-visible' : 'main-nav'} aria-label="Navigation principale">
          <a href="#catalogue" onClick={() => setMobileOpen(false)}>Catalogue</a>
          <a href="#methode" onClick={() => setMobileOpen(false)}>Notre méthode</a>
          <a href="#aide" onClick={() => setMobileOpen(false)}>Besoin d'aide ?</a>
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-purple-400 font-semibold hover:text-purple-300 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 inline" /> Admin
          </Link>
        </nav>
        <div className="header-actions">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-purple-300">Bonjour, {currentUser.firstName}</span>
              <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-white" size="sm">
                <LogOut className="w-4 h-4 mr-1" /> Déconnexion
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="login-btn" onClick={() => { setAuthMode('login'); setAuthModalOpen(true) }}>
              Se connecter
            </Button>
          )}
          <Button className="header-cta" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>
            Commencer <ArrowRight data-icon="inline-end" />
          </Button>
          <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> L'apprentissage, en orbite</div>
          <h1>Apprenez ce qui<br /><span>vous propulse.</span></h1>
          <p className="hero-text">Des parcours conçus pour transformer votre curiosité en compétences concrètes. Apprenez à votre rythme, guidé par des experts.</p>
          <div className="hero-actions">
            <Button className="primary-cta" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>Explorer les cours <ArrowRight data-icon="inline-end" /></Button>
            <button className="text-link" onClick={() => document.getElementById('methode')?.scrollIntoView({ behavior: 'smooth' })}><PlayCircle /> Voir comment ça marche</button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>AM</span><span>KL</span><span>SR</span><span className="avatar-more">+2k</span></div>
            <div><strong>Rejoignez une communauté</strong><small>de personnes qui construisent leur futur.</small></div>
          </div>
        </div>
        <HeroScene />
        <div className="hero-orbit-label label-one"><span className="label-icon"><BookOpen /></span><div><strong>+120 cours</strong><small>mis à jour chaque mois</small></div></div>
        <div className="hero-orbit-label label-two"><span className="label-icon cyan"><CheckCircle2 /></span><div><strong>Certifié</strong><small>par des experts du métier</small></div></div>
      </section>

      <section id="methode" className="trust-strip"><p>Approuvé par des équipes qui font avancer le monde</p><div className="trust-logos"><span>northstar</span><span>▲ vertex</span><span>loop<span className="brand-dot">.</span>work</span><span>arc / studio</span><span>lumen</span></div></section>

      <section id="catalogue" className="catalogue-section">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> Le catalogue</div><h2>Votre prochaine compétence<br /><em>vous attend.</em></h2></div>
          <div className="catalogue-tools">
            <div className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un cours..." aria-label="Rechercher un cours" /></div>
            <Button variant="outline">Tous les cours <span className="chevron">⌄</span></Button>
          </div>
        </div>
        <div className="course-grid">
          {filtered.map((course) => (
            <article className={`course-card accent-${course.accent}`} key={course.id}>
              <div className="course-visual"><span className="course-category">{course.category}</span><div className="course-orb" /><span className="course-number">0{courses.indexOf(course) + 1}</span></div>
              <div className="course-content">
                <div className="course-meta"><span>{course.level}</span><span><Clock3 /> {course.duration}</span></div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-footer">
                  <strong>{course.price} DH</strong>
                  <span className="seat-count"><Users /> {course.seats} places</span>
                  <Link className={buttonVariants({ size: 'sm' })} href={`/courses/${course.id}`}>Voir le cours <ArrowRight data-icon="inline-end" /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="empty-state">Aucun cours ne correspond à votre recherche.</div>}
      </section>

      <section id="aide" className="feature-section">
        <div className="feature-card"><div className="feature-icon"><ShieldCheck /></div><div><h3>Un cadre pensé pour progresser.</h3><p>Chaque inscription est sécurisée, chaque paiement vérifié et chaque cours est accompagné de ressources pratiques.</p></div><div className="feature-stat"><strong>98<span>%</span></strong><small>de satisfaction</small></div></div>
        <div className="feature-card"><div className="feature-icon cyan-icon"><SparklesIcon /></div><div><h3>Du concret, pas du bruit.</h3><p>Des exercices, des projets et des retours pour passer de la théorie à l'action dès aujourd'hui.</p></div><div className="feature-stat"><strong>2.4<span>x</span></strong><small>plus de rétention</small></div></div>
      </section>

      <footer>
        <a href="#top" className="brand"><span className="brand-mark"><Layers3 /></span><span>edustream<span className="brand-dot">.</span></span></a>
        <span>Apprendre autrement, construire durablement.</span>
        <span>© 2026 edustream</span>
      </footer>

      {/* Auth Modal (Se Connecter / S'inscrire) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-8 text-left">
            <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 border-b border-slate-800 pb-4 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError('') }}
                className={`text-lg font-bold transition-colors ${authMode === 'login' ? 'text-purple-400 border-b-2 border-purple-500 pb-1' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Se connecter
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError('') }}
                className={`text-lg font-bold transition-colors ${authMode === 'register' ? 'text-purple-400 border-b-2 border-purple-500 pb-1' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Créer un compte
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Prénom</label>
                    <input
                      type="text"
                      required
                      value={authForm.firstName}
                      onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                      placeholder="Jean"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={authForm.lastName}
                      onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                      placeholder="Dupont"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="nom@exemple.ma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center gap-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <Button type="submit" disabled={authLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2 py-2.5">
                {authLoading ? 'Traitement...' : authMode === 'login' ? 'Se connecter' : "S'inscrire"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
