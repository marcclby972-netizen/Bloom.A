'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

/**
 * Bloom landing — OS pour associés et cofondateurs.
 * Voir /guideline.md §5 pour la spec complète.
 */
export default function LandingPage() {
  // Scroll-reveal observer for .reveal-* elements
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Skip animation, mark all as in-view immediately
      document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up')
        .forEach((el) => el.classList.add('in-view'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.2 }
    )
    document
      .querySelectorAll('.reveal-left, .reveal-right, .reveal-up')
      .forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <HeaderPill />
      <Hero />
      <WhyBloom />
      <FeatureAssocies />
      <FeatureJournal />
      <FeatureIris />
      <FeatureAgenda />
      <Pricing />
      <FinalCta />
      <FooterPanel />
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Header pill (fixed, floating)
// ─────────────────────────────────────────────────────────────

function HeaderPill() {
  return (
    <header
      className="fixed left-1/2 -translate-x-1/2 z-[60] header-pill animate-in fade-in slide-in-from-top-4 duration-500"
      style={{ top: 24 }}
    >
      {/* Logo + wordmark */}
      <Link href="/" className="flex items-center gap-2.5 mr-2">
        <Image src="/bloom-logo.png" alt="Bloom" width={28} height={28} className="rounded-md" />
        <span
          className="text-[22px] leading-none"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-on-light-primary)' }}
        >
          Bloom
        </span>
      </Link>

      {/* Nav — desktop only */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { href: '#features', label: 'Produit' },
          { href: '#features', label: 'Fonctionnalités' },
          { href: '#pricing', label: 'Prix' },
          { href: '#footer', label: 'Ressources' },
        ].map((item, i) => (
          <a
            key={`${item.label}-${i}`}
            href={item.href}
            className="h-9 px-3.5 inline-flex items-center text-[14px] font-medium rounded-full transition-colors"
            style={{ color: 'var(--ink-on-light-primary)' }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* CTAs */}
      <div className="flex items-center gap-2 ml-2">
        <Link
          href="/login"
          className="hidden sm:inline-flex h-10 px-4 items-center text-[14px] font-medium rounded-full transition-colors"
          style={{ color: 'var(--ink-on-light-muted)' }}
        >
          Sign in
        </Link>
        <Link href="/onboard" className="btn-cta" style={{ height: '2.5rem', padding: '0 1.25rem', fontSize: '0.875rem' }}>
          Get started
        </Link>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="hero-glow relative overflow-hidden"
      style={{ paddingTop: 'clamp(8rem, 14vw, 11rem)', paddingBottom: 'clamp(4rem, 8vw, 6rem)' }}
    >
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-20">
        <div className="max-w-[820px] mx-auto text-center">
          {/* Overline pill — staggered animation */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <span className="pill-accent tag-micro inline-flex">
              OS pour associés
            </span>
          </div>

          {/* Headline (Madimi One) */}
          <h1
            className="h-display mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fondez ensemble.
            <br />
            <span className="text-gradient">Pilotez clairement.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="body-lg max-w-[540px] mx-auto mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300"
            style={{ color: 'var(--ink-on-dark-muted)' }}
          >
            Le temps, l&apos;argent et les règles sur la même page. Bloom est l&apos;OS
            des cofondateurs qui veulent grandir sans se déchirer.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center animate-in fade-in slide-in-from-bottom-3 duration-500 delay-[440ms]">
            <Link href="/onboard" className="btn-cta btn-cta-lg">
              Commencer gratuitement
            </Link>
            <a href="#features" className="btn-ghost" style={{ height: '3.5rem' }}>
              Voir la démo →
            </a>
          </div>
        </div>

        {/* Dashboard mock (break out below — partial reveal) */}
        <div className="mt-16 sm:mt-20 relative animate-in fade-in slide-in-from-bottom-6 duration-700 delay-[560ms]">
          <HeroDashboardMock />
        </div>
      </div>
    </section>
  )
}

function HeroDashboardMock() {
  return (
    <div className="relative max-w-[980px] mx-auto">
      <div
        className="rounded-[24px] border-gradient overflow-hidden"
        style={{ boxShadow: 'var(--shadow-elev)' }}
      >
        <div className="rounded-[23px] p-5 sm:p-6 panel-deep">
          {/* Mini top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="overline" style={{ color: 'var(--ink-on-dark-subtle)' }}>
              bloomco · vue d&apos;ensemble
            </span>
            <span className="w-12" />
          </div>

          {/* 2-col mock content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Equity balance */}
            <div className="card-deep p-4">
              <div className="overline mb-3">Équilibre associés</div>
              <div className="space-y-2.5">
                {[
                  { name: 'Marc', pct: 70, color: '#E37520' },
                  { name: 'Alex', pct: 30, color: '#FBBE4D' },
                ].map((m) => (
                  <div key={m.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span style={{ color: 'var(--ink-on-dark-primary)' }}>{m.name}</span>
                      <span className="tabular-nums" style={{ color: 'var(--ink-on-dark-muted)' }}>{m.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="iris-pulse w-2 h-2 rounded-full" style={{ background: 'var(--accent-solid)' }} />
                  <span style={{ color: 'var(--ink-on-dark-muted)' }}>
                    Iris : <span style={{ color: 'var(--ink-on-dark-primary)' }}>écart 40% sur 4 sem.</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Decisions pending */}
            <div className="card-deep p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="overline">Décisions à voter</span>
                <span className="tag-micro tag-micro-accent" style={{ height: '1.25rem', padding: '0 0.5rem', fontSize: '0.625rem' }}>3</span>
              </div>
              <div className="space-y-2">
                {[
                  { title: 'Achat Macbook Pro', amount: '2 400 €', tag: 'CRITIQUE' },
                  { title: 'Distribution mensuelle', amount: '—', tag: 'RÈGLE' },
                  { title: 'Notion Team upgrade', amount: '180 €', tag: 'NORMAL' },
                ].map((d) => (
                  <div key={d.title} className="flex items-center justify-between text-sm py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate" style={{ color: 'var(--ink-on-dark-primary)' }}>{d.title}</span>
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--ink-on-dark-muted)' }}>{d.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Why Bloom — short intro section
// ─────────────────────────────────────────────────────────────

function WhyBloom() {
  const KPIS = [
    { value: '0', label: 'décision passée sans trace' },
    { value: '4', label: 'modules au cœur du cockpit' },
    { value: '8€', label: 'par utilisateur, par mois, sans surprise' },
  ]
  return (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 reveal-up">
        {KPIS.map((k) => (
          <div key={k.label} className="card-deep p-6 text-center">
            <div className="kpi-display" style={{ color: 'var(--ink-on-dark-primary)' }}>{k.value}</div>
            <div className="text-xs mt-2" style={{ color: 'var(--ink-on-dark-muted)' }}>{k.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Feature sections (Attio 2-col pattern)
// ─────────────────────────────────────────────────────────────

type FeatureProps = {
  overline: string
  title: string
  body: string
  bullets: string[]
  reverse?: boolean
  visual: React.ReactNode
}

function FeatureSection({ overline, title, body, bullets, reverse, visual }: FeatureProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-20 py-8 sm:py-12">
      <div
        className="panel-light p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        style={{ color: 'var(--ink-on-light-primary)' }}
      >
        <div className={`lg:col-span-5 ${reverse ? 'lg:order-2' : ''} reveal-left`}>
          <div
            className="tag-micro inline-flex"
            style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--ink-on-light-muted)' }}
          >
            {overline}
          </div>
          <h2 className="h-section mt-4" style={{ color: 'var(--ink-on-light-primary)' }}>
            {title}
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: 'var(--ink-on-light-muted)' }}>
            {body}
          </p>
          <ul className="mt-6 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent-solid)' }} />
                <span className="text-[15px]" style={{ color: 'var(--ink-on-light-primary)' }}>{b}</span>
              </li>
            ))}
          </ul>
          <a
            href="#pricing"
            className="inline-flex items-center gap-1 mt-6 text-[15px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-on-light-primary)' }}
          >
            En savoir plus
            <span aria-hidden>→</span>
          </a>
        </div>
        <div className={`lg:col-span-7 ${reverse ? 'lg:order-1' : ''} reveal-right`}>
          {visual}
        </div>
      </div>
    </section>
  )
}

function FeatureAssocies() {
  return (
    <FeatureSection
      overline="Gouvernance"
      title="Des règles écrites, des disputes évitées."
      body="Définis tes seuils de vote, ton vesting, ta fréquence de distribution. Bloom applique automatiquement les règles à chaque décision."
      bullets={['Seuils de vote configurables', 'Vesting automatique', 'Distribution programmée']}
      visual={<VisualRules />}
    />
  )
}

function FeatureJournal() {
  return (
    <FeatureSection
      overline="Transparence"
      title="Un journal que personne ne peut réécrire."
      body="Chaque décision, dépense, changement d'équité est inscrit. Lecture seule. Pour toujours."
      bullets={['Append-only par design', 'Signature par membre', 'Export PDF audit']}
      reverse
      visual={<VisualJournal />}
    />
  )
}

function FeatureIris() {
  return (
    <FeatureSection
      overline="Agent IA"
      title="Iris voit ce que tu n'oses pas dire."
      body="Iris analyse les contributions, repère les déséquilibres, et te prévient avant que ça devienne un sujet de conflit."
      bullets={['Résumé hebdo automatique', 'Wizard pacte d\'associés', 'Alertes 24h/24']}
      visual={<VisualIris />}
    />
  )
}

function FeatureAgenda() {
  return (
    <FeatureSection
      overline="Pilotage"
      title="Toute l'équipe sur la même timeline."
      body="Voit qui fait quoi, quand. Programme les posts. Sync Google Calendar + Notion en un clic."
      bullets={['Agenda partagé', 'Posts programmables', 'Sync Google + Notion']}
      reverse
      visual={<VisualAgenda />}
    />
  )
}

// ─── Visuals (mocks dark-on-light cards) ───

function VisualRules() {
  return (
    <div className="rounded-[20px] p-5 panel-deep" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="overline mb-4">Règles BloomCo</div>
      <div className="space-y-4">
        <RuleRow label="Seuil de vote" value="> 100 € → unanimité" />
        <RuleRow label="Vesting" value="48 mois · cliff 12" />
        <RuleRow label="Distribution" value="Mensuelle, 80/20" />
        <RuleRow label="Sortie d'associé" value="Pacte d'achat priorité" />
      </div>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
      <span className="text-sm" style={{ color: 'var(--ink-on-dark-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--ink-on-dark-primary)' }}>{value}</span>
    </div>
  )
}

function VisualJournal() {
  const entries = [
    { who: 'Marc', what: 'a approuvé la dépense Macbook Pro', amount: '2 400 €', when: 'il y a 2 h' },
    { who: 'Alex', what: 'a voté NON sur la distribution exceptionnelle', amount: null, when: 'il y a 3 j' },
    { who: 'Marc', what: 'a modifié la règle "seuil de vote"', amount: null, when: 'il y a 1 sem' },
  ]
  return (
    <div className="rounded-[20px] p-5 panel-deep" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="overline">Journal · append-only</div>
        <span className="text-[10px] font-mono" style={{ color: 'var(--ink-on-dark-subtle)' }}>
          14 entrées
        </span>
      </div>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="relative shrink-0 w-2.5 mt-1.5">
              <span className="block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-solid)' }} />
              {i < entries.length - 1 && (
                <span className="absolute left-1/2 -translate-x-1/2 top-3 w-px h-8" style={{ background: 'var(--border-on-dark-deep)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="text-sm" style={{ color: 'var(--ink-on-dark-primary)' }}>
                <span className="font-semibold">{e.who}</span>{' '}
                <span style={{ color: 'var(--ink-on-dark-muted)' }}>{e.what}</span>
                {e.amount && <span className="ml-1 tabular-nums" style={{ color: 'var(--ink-on-dark-primary)' }}>· {e.amount}</span>}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-on-dark-subtle)' }}>
                {e.when} · hash: a8f3…2c1
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VisualIris() {
  return (
    <div className="rounded-[20px] p-5 panel-deep" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="iris-pulse w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-solid)' }} />
        <span className="overline">Iris · alerte</span>
        <span className="ml-auto tag-micro" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', height: '1.25rem', padding: '0 0.5rem', fontSize: '0.625rem' }}>
          WARNING
        </span>
      </div>
      <p className="text-[15px] leading-relaxed mb-3" style={{ color: 'var(--ink-on-dark-primary)' }}>
        Marc a fait <span className="font-semibold">70 % des heures</span> sur les 4 dernières semaines, Alex 30 %.
      </p>
      <p className="text-sm" style={{ color: 'var(--ink-on-dark-muted)' }}>
        Pensez à organiser un point d&apos;équipe avant que ça ne devienne un sujet de tension.
      </p>
      <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
        <button className="tag-micro" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-on-dark-primary)' }}>
          Programmer un point
        </button>
        <button className="tag-micro" style={{ background: 'transparent', color: 'var(--ink-on-dark-muted)' }}>
          Ignorer
        </button>
      </div>
    </div>
  )
}

function VisualAgenda() {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
  const blocks = [
    { day: 0, top: 10, height: 40, who: 'Marc', color: '#E37520' },
    { day: 0, top: 55, height: 25, who: 'Alex', color: '#FBBE4D' },
    { day: 1, top: 20, height: 50, who: 'Marc', color: '#E37520' },
    { day: 2, top: 15, height: 35, who: 'Alex', color: '#FBBE4D' },
    { day: 3, top: 10, height: 60, who: 'Marc', color: '#E37520' },
    { day: 4, top: 30, height: 20, who: 'Alex', color: '#FBBE4D' },
  ]
  return (
    <div className="rounded-[20px] p-5 panel-deep" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="overline">Sem. 21 · partagée</div>
        <span className="text-[10px]" style={{ color: 'var(--ink-on-dark-subtle)' }}>Marc · Alex</span>
      </div>
      <div className="grid grid-cols-5 gap-2 h-[180px] relative">
        {days.map((d, i) => (
          <div key={d} className="relative rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="absolute top-1 left-2 text-[10px] font-medium" style={{ color: 'var(--ink-on-dark-subtle)' }}>
              {d}
            </div>
            {blocks.filter((b) => b.day === i).map((b, k) => (
              <div
                key={k}
                className="absolute left-1 right-1 rounded-md opacity-90"
                style={{ top: `${b.top}%`, height: `${b.height}%`, background: b.color }}
                title={b.who}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="text-center mb-12 reveal-up">
        <span className="overline">Plan unique</span>
        <h2 className="h-section mt-3">Un prix. Tout inclus.</h2>
        <p className="body-lg mt-4 max-w-[480px] mx-auto" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Pas de palier, pas d&apos;upsell. Tu paies par utilisateur actif.
        </p>
      </div>

      <div className="max-w-[760px] mx-auto reveal-up">
        <div className="border-gradient p-1">
          <div
            className="rounded-[28px] p-8 sm:p-12"
            style={{ background: 'var(--bg-panel-deep)', boxShadow: 'var(--shadow-elev)' }}
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <span className="tag-micro tag-micro-accent">Plan unique</span>
              <span className="text-xs" style={{ color: 'var(--ink-on-dark-subtle)' }}>
                14 jours d&apos;essai · sans CB
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="h-display-md" style={{ fontFamily: 'var(--font-display)' }}>8 €</span>
              <span className="text-base" style={{ color: 'var(--ink-on-dark-muted)' }}>
                / utilisateur / mois
              </span>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--ink-on-dark-muted)' }}>
              L&apos;OS complet — IA, stockage, mode associés inclus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
              <div>
                <div className="overline mb-3">Inclus</div>
                <ul className="space-y-2.5">
                  {[
                    'Tous les modules',
                    '100 requêtes Iris / user / mois',
                    '1 Go de stockage',
                    'Journal immuable + export audit',
                    'Apple Sign In + email',
                    'Sync Google Calendar + Notion',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink-on-dark-primary)' }}>
                      <span style={{ color: 'var(--accent-solid)' }} aria-hidden>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="overline mb-3">Parfait pour</div>
                <ul className="space-y-2.5">
                  {[
                    '2–5 cofondateurs',
                    'Studios indépendants',
                    'Équipes early-stage',
                    'Qui veulent éviter le drame',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink-on-dark-muted)' }}>
                      <span aria-hidden style={{ color: 'var(--ink-on-dark-subtle)' }}>·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link href="/onboard" className="btn-cta btn-cta-lg w-full mt-10 justify-center">
              Commencer 14 jours d&apos;essai
            </Link>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--ink-on-dark-subtle)' }}>
              Annule en 1 clic. Tes données restent à toi.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16">
      <div
        className="panel-light p-12 sm:p-20 text-center reveal-up"
        style={{ color: 'var(--ink-on-light-primary)' }}
      >
        <h2
          className="h-display-lg"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-on-light-primary)' }}
        >
          Prêt à fonder ensemble ?
        </h2>
        <p
          className="mt-4 max-w-[480px] mx-auto text-[17px]"
          style={{ color: 'var(--ink-on-light-muted)' }}
        >
          14 jours pour décider. Sans engagement, sans CB.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/onboard" className="btn-cta btn-cta-lg">
            Démarrer mon essai
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Footer panel
// ─────────────────────────────────────────────────────────────

function FooterPanel() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Tarifs', href: '#pricing' },
        { label: 'Changelog', href: '#' },
        { label: 'Roadmap', href: '#' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Guides', href: '/integrations-guide' },
      ],
    },
    {
      title: 'Société',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Contact', href: 'mailto:marc.clby.972@gmail.com' },
        { label: 'Confidentialité', href: '/privacy' },
        { label: 'CGU', href: '/terms' },
        { label: 'Cookies', href: '/cookies' },
      ],
    },
  ]
  return (
    <footer id="footer" className="max-w-[1200px] mx-auto px-6 lg:px-20 pb-10">
      <div className="footer-panel p-10 sm:p-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/bloom-logo.png" alt="Bloom" width={32} height={32} className="rounded-md" />
              <span
                className="text-2xl"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-on-dark-primary)' }}
              >
                Bloom
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--ink-on-dark-muted)' }}>
              OS pour associés. Fait à Paris, pour les studios qui veulent
              grandir sans se déchirer.
            </p>
          </div>

          {/* Link cols */}
          {columns.map((col) => (
            <div key={col.title}>
              <div className="overline mb-4">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--ink-on-dark-muted)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row gap-3 items-center justify-between text-xs"
          style={{ borderColor: 'var(--border-on-dark-deep)', color: 'var(--ink-on-dark-subtle)' }}
        >
          <span>© 2026 Bloom · Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:opacity-80">Confidentialité</Link>
            <Link href="/cookies" className="hover:opacity-80">Cookies</Link>
            <Link href="/terms" className="hover:opacity-80">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
