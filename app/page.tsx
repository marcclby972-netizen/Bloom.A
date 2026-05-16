'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { num: '/ 01', title: 'Tâches & Calendrier', desc: 'Vue jour/semaine/mois avec timeline précise, drag & drop, et chronomètre lié à chaque tâche.' },
  { num: '/ 02', title: 'Pipeline CRM', desc: 'Tes contacts du prospect au client. Drag & drop entre statuts, follow-ups automatiques.' },
  { num: '/ 03', title: 'Marketing & ROI', desc: 'Posts social par plateforme, métriques d’engagement, ROI par projet, croisement ads vs revenu.' },
  { num: '/ 04', title: 'Stripe automatique', desc: 'Connecte ton Stripe une fois, Bloom récupère revenus + abonnements et calcule MRR/ARR par projet.' },
  { num: '/ 05', title: 'Iris IA', desc: 'Assistant Claude/GPT/Gemini contextuel à toutes tes données — apporte ta clé API.' },
  { num: '/ 06', title: 'Coffre-fort chiffré', desc: 'Mots de passe en AES-256-GCM côté client. Personne — pas même nous — n’y accède.' },
]

const KPIS = [
  { value: '12+', label: 'modules intégrés dans une seule app' },
  { value: '0', label: 'tracker tiers — RGPD compliant par défaut' },
  { value: '< 1s', label: 'temps de chargement de chaque page' },
]

export default function LandingPage() {
  const [yearly, setYearly] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const monthly = 8.6
  const annual = 72.24
  const savings = ((monthly * 12 - annual) / (monthly * 12)) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* ── Floating nav (Teplin style) ─────────────────────────── */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 h-12 rounded-full bg-background/85 backdrop-blur-md border border-border transition-shadow ${scrolled ? 'shadow-lg' : 'shadow-md'}`}>
        <Link href="/" className="h-9 w-9 ml-0.5 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <Image src="/bloom-logo.png" alt="Bloom" width={20} height={20} className="rounded" />
        </Link>
        <span className="h-5 w-px bg-border mx-1" />
        <a href="#features" className="h-9 px-3 inline-flex items-center text-[12px] font-medium tracking-tight rounded-full text-muted-foreground hover:text-foreground transition-colors uppercase">Features</a>
        <a href="#pricing" className="h-9 px-3 inline-flex items-center text-[12px] font-medium tracking-tight rounded-full text-muted-foreground hover:text-foreground transition-colors uppercase">Pricing</a>
        <a href="#faq" className="h-9 px-3 inline-flex items-center text-[12px] font-medium tracking-tight rounded-full text-muted-foreground hover:text-foreground transition-colors uppercase">FAQ</a>
        <Link href="/login" className="ml-1 h-9 px-4 inline-flex items-center text-[12px] font-medium tracking-tight rounded-full bg-foreground text-background hover:opacity-90 transition-opacity uppercase">
          Connexion
        </Link>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="px-6 pt-32 sm:pt-40 pb-20 max-w-5xl mx-auto text-center">
        <p className="card-num mb-6 animate-in fade-in duration-700">/ TON COCKPIT PERSONNEL</p>
        <h1 className="h-display animate-in fade-in slide-in-from-bottom-2 duration-700">
          Tout ce que tu fais, dans <span className="italic">une</span> seule app.
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          Tâches, calendrier, CRM, marketing, revenus Stripe, IA, vocal, coffre-fort.
          Une seule app, un seul prix, tes données chiffrées.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <Link
            href="/onboard"
            className="pill pill-dark text-sm py-3.5 px-6"
          >
            Commencer — 14 jours gratuits
          </Link>
          <a href="#features" className="pill text-sm py-3.5 px-6">
            Voir les features →
          </a>
        </div>

        {/* social proof line */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {KPIS.map((k) => (
            <div key={k.label} className="soft-card p-5 text-center">
              <div className="kpi-display">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-2">{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="card-num mb-3">/ FEATURES</p>
          <h2 className="h-section">Tout ce dont tu as besoin. Rien que tu n&apos;utiliseras pas.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s, i) => (
            <div
              key={s.num}
              className="soft-card soft-card-hover p-7 animate-in fade-in slide-in-from-bottom-3"
              style={{ animationDelay: `${i * 80}ms`, animationDuration: '600ms', animationFillMode: 'backwards' }}
            >
              <div className="flex items-start justify-between mb-5">
                <span className="card-num">{s.num}</span>
                <span className="icon-square">
                  <span className="text-base font-semibold">{i + 1}</span>
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="card-num mb-3">/ PRICING</p>
          <h2 className="h-section">Un prix simple. Tout inclus.</h2>
        </div>

        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex p-1 rounded-full bg-secondary">
            <button onClick={() => setYearly(false)}
              className={`h-10 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase ${!yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Mensuel
            </button>
            <button onClick={() => setYearly(true)}
              className={`h-10 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase relative ${yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold">
                -{Math.round(savings)}%
              </span>
            </button>
          </div>
        </div>

        <div className="soft-card p-10 max-w-md mx-auto text-center">
          <p className="card-num mb-3">{yearly ? '/ ANNUEL' : '/ MENSUEL'}</p>
          <h3 className="text-lg font-semibold mb-1">Bloom Pro</h3>
          <p className="text-sm text-muted-foreground mb-7">Tout, sans limite, sans engagement.</p>
          <div className="kpi-display">
            {(yearly ? annual : monthly).toFixed(2).replace('.', ',')} €
          </div>
          <p className="text-sm text-muted-foreground mt-2">{yearly ? 'par an' : 'par mois'}</p>
          {yearly && (
            <p className="text-xs text-emerald-600 mt-1">Soit {(annual / 12).toFixed(2).replace('.', ',')} € / mois — économie {(monthly * 12 - annual).toFixed(2).replace('.', ',')} €</p>
          )}
          <Link
            href="/onboard"
            className="block mt-8 pill pill-dark text-sm py-3.5"
          >
            Commencer maintenant
          </Link>
        </div>
        <div className="text-center mt-6">
          <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Comparer les détails →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="h-section mb-6">Prêt à arrêter de jongler entre 8 outils ?</h2>
        <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
          14 jours d&apos;essai gratuit. Annule en 1 clic. Tes données restent à toi.
        </p>
        <Link href="/onboard" className="pill pill-dark text-base py-4 px-8 inline-flex">
          Démarrer mon essai
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6 mt-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/bloom-logo.png" alt="Bloom" width={20} height={20} className="rounded" />
            <span>Bloom · ton cockpit</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">CGU</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Se connecter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
