'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

/**
 * Bloom landing v3 — narrative + conversion-optimized.
 * Voir /guideline.md §5 + /ui-ux-pro-max landing patterns.
 *
 * Structure (Hero + Testimonials + CTA pattern, with light storytelling) :
 *  1. Header pill (fixed)
 *  2. Hero — short headline, dual CTA, trust strip, dashboard mock
 *  3. Chapitre 01 — Le problème (3 stats startup conflicts)
 *  4. Chapitre 02 — La solution (3 piliers Contributions/Décisions/Journal)
 *  5. 4 features Attio 2-col
 *  6. Testimonials (social proof avant pricing)
 *  7. Pricing carte unique
 *  8. FAQ
 *  9. CTA final
 * 10. Footer panel
 */
export default function LandingPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      <ChapterProblem />
      <ChapterSolution />
      <FeatureAssocies />
      <FeatureJournal />
      <FeatureIris />
      <FeatureAgenda />
      <Testimonials />
      <Pricing />
      <Faq />
      <FinalCta />
      <FooterPanel />
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Header pill
// ─────────────────────────────────────────────────────────────

function HeaderPill() {
  return (
    <header
      className="fixed left-1/2 -translate-x-1/2 z-[60] header-pill animate-in fade-in slide-in-from-top-4 duration-500"
      style={{ top: 24 }}
    >
      <Link href="/" className="flex items-center gap-2.5 mr-2">
        <Image src="/bloom-logo-noir.png" alt="Bloom" width={28} height={28} className="rounded-md" />
        <span
          className="text-[22px] leading-none"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-on-light-primary)' }}
        >
          Bloom
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {[
          { href: '#features', label: 'Fonctionnalités' },
          { href: '#testimonials', label: 'Témoignages' },
          { href: '#pricing', label: 'Prix' },
          { href: '#faq', label: 'FAQ' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="h-9 px-3.5 inline-flex items-center text-[14px] font-medium rounded-full transition-colors"
            style={{ color: 'var(--ink-on-light-primary)' }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 ml-2">
        <Link
          href="/login"
          className="hidden sm:inline-flex h-10 px-4 items-center text-[14px] font-medium rounded-full transition-colors"
          style={{ color: 'var(--ink-on-light-muted)' }}
        >
          Sign in
        </Link>
        <Link
          href="/onboard"
          className="btn-cta"
          style={{ height: '2.5rem', padding: '0 1.25rem', fontSize: '0.875rem' }}
        >
          Get started
        </Link>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────
// Hero — short, punchy
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="hero-glow relative overflow-hidden"
      style={{ paddingTop: 'clamp(8rem, 14vw, 11rem)', paddingBottom: 'clamp(4rem, 8vw, 6rem)' }}
    >
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-20">
        <div className="max-w-[760px] mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <span className="pill-accent tag-micro inline-flex">OS pour cofondateurs</span>
          </div>

          <h1
            className="h-display mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fondez ensemble.
            <br />
            <span className="text-gradient">Pilotez clairement.</span>
          </h1>

          <p
            className="body-lg max-w-[520px] mx-auto mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300"
            style={{ color: 'var(--ink-on-dark-muted)' }}
          >
            Le temps, l&apos;argent, les règles : tout sur la même page. Bloom
            empêche les conflits avant qu&apos;ils n&apos;existent.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center animate-in fade-in slide-in-from-bottom-3 duration-500 delay-[440ms]">
            <Link href="/onboard" className="btn-cta btn-cta-lg">
              Commencer gratuitement
            </Link>
            <a href="#features" className="btn-ghost" style={{ height: '3.5rem' }}>
              Voir la démo →
            </a>
          </div>

          {/* Trust strip */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs animate-in fade-in duration-500 delay-[560ms]"
            style={{ color: 'var(--ink-on-dark-subtle)' }}
          >
            <TrustItem>14 jours gratuits</TrustItem>
            <Dot />
            <TrustItem>Sans carte bancaire</TrustItem>
            <Dot />
            <TrustItem>8€/utilisateur/mois</TrustItem>
            <Dot />
            <TrustItem>Annule en 1 clic</TrustItem>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 relative animate-in fade-in slide-in-from-bottom-6 duration-700 delay-[680ms]">
          <HeroDashboardMock />
        </div>
      </div>
    </section>
  )
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 6.5 5 9l4.5-5" stroke="var(--accent-solid)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  )
}

function Dot() {
  return <span className="opacity-40">·</span>
}

function HeroDashboardMock() {
  return (
    <div className="relative max-w-[980px] mx-auto">
      <div
        className="rounded-[24px] border-gradient overflow-hidden"
        style={{ boxShadow: 'var(--shadow-elev)' }}
      >
        <div className="rounded-[23px] p-5 sm:p-6 panel-deep">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="card-deep p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="overline">Décisions à voter</span>
                <span className="tag-micro tag-micro-accent" style={{ height: '1.25rem', padding: '0 0.5rem', fontSize: '0.625rem' }}>3</span>
              </div>
              <div className="space-y-2">
                {[
                  { title: 'Achat Macbook Pro', amount: '2 400 €' },
                  { title: 'Distribution mensuelle', amount: '—' },
                  { title: 'Notion Team upgrade', amount: '180 €' },
                ].map((d) => (
                  <div key={d.title} className="flex items-center justify-between text-sm py-1.5">
                    <span className="truncate" style={{ color: 'var(--ink-on-dark-primary)' }}>{d.title}</span>
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
// Chapitre 01 — Le problème
// ─────────────────────────────────────────────────────────────

function ChapterProblem() {
  const stats = [
    { value: '65%', label: 'des startups échouent à cause de conflits internes', source: 'Harvard Business Review' },
    { value: '3×', label: 'plus de chances de péter quand les rôles ne sont pas clairs', source: 'CB Insights' },
    { value: '70%', label: 'des cofondateurs se séparent avant 4 ans', source: 'Noam Wasserman' },
  ]
  return (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="max-w-[760px] mx-auto text-center mb-14 reveal-up">
        <span className="overline">— Chapitre 01</span>
        <h2 className="h-section mt-3">L&apos;argent et les contributions tuent plus de startups que la concurrence.</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 reveal-up">
        {stats.map((s) => (
          <div key={s.label} className="card-deep p-6">
            <div className="kpi-display text-gradient">{s.value}</div>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--ink-on-dark-primary)' }}>
              {s.label}
            </p>
            <p className="text-[11px] mt-3" style={{ color: 'var(--ink-on-dark-subtle)' }}>
              {s.source}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Chapitre 02 — La solution (3 piliers)
// ─────────────────────────────────────────────────────────────

function ChapterSolution() {
  const pillars = [
    {
      title: 'Contributions',
      desc: 'Qui a fait quoi, combien, sur quel projet. Visible en temps réel par tous.',
      icon: <IconBalance />,
    },
    {
      title: 'Décisions',
      desc: 'Vote selon des règles écrites. Plus d&apos;argument du plus fort, plus de zone grise.',
      icon: <IconVote />,
    },
    {
      title: 'Journal',
      desc: 'Tout ce qui compte est inscrit, signé, immuable. Personne ne peut réécrire l&apos;histoire.',
      icon: <IconJournal />,
    },
  ]
  return (
    <section id="features" className="max-w-[1200px] mx-auto px-6 lg:px-20 py-8 sm:py-16">
      <div className="max-w-[760px] mx-auto text-center mb-14 reveal-up">
        <span className="overline">— Chapitre 02</span>
        <h2 className="h-section mt-3">Un cockpit. Trois piliers. Zéro flou.</h2>
        <p className="body-lg mt-4 max-w-[520px] mx-auto" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Bloom ne remplace pas la confiance. Il la rend impossible à perdre par accident.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-up">
        {pillars.map((p) => (
          <div key={p.title} className="card-deep card-deep-hover p-7">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent-solid)' }}
            >
              {p.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--ink-on-dark-primary)' }}>{p.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-on-dark-muted)' }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function IconBalance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16" />
      <path d="M4 8h16" />
      <path d="M7 8l-3 6a3 3 0 0 0 6 0l-3-6Z" />
      <path d="M17 8l-3 6a3 3 0 0 0 6 0l-3-6Z" />
    </svg>
  )
}
function IconVote() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18M3 9l2-5h14l2 5" />
      <path d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" />
      <path d="M8 14l2.5 2.5L16 11" />
    </svg>
  )
}
function IconJournal() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4a2 2 0 0 1 2-2h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Z" />
      <path d="M17 2v4h4" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Feature sections (Attio 2-col)
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
          <Link
            href="/onboard"
            className="inline-flex items-center gap-1 mt-6 text-[15px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--ink-on-light-primary)' }}
          >
            Essayer gratuitement
            <span aria-hidden>→</span>
          </Link>
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
      bullets={["Résumé hebdo automatique", "Wizard pacte d'associés", 'Alertes 24h/24']}
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
        <span className="text-[10px] font-mono" style={{ color: 'var(--ink-on-dark-subtle)' }}>14 entrées</span>
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
    { day: 0, top: 10, height: 40, color: '#E37520' },
    { day: 0, top: 55, height: 25, color: '#FBBE4D' },
    { day: 1, top: 20, height: 50, color: '#E37520' },
    { day: 2, top: 15, height: 35, color: '#FBBE4D' },
    { day: 3, top: 10, height: 60, color: '#E37520' },
    { day: 4, top: 30, height: 20, color: '#FBBE4D' },
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
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Testimonials (social proof before pricing)
// ─────────────────────────────────────────────────────────────

function Testimonials() {
  const items = [
    {
      quote: "On a évité une grosse engueulade en décembre grâce au journal. C'est devenu impossible de réécrire l'histoire — et ça change tout.",
      name: 'Camille R.',
      role: 'Cofondatrice, studio design',
    },
    {
      quote: "Avant Bloom, on faisait nos comptes sur Notion + Google Sheets + WhatsApp. Aujourd'hui un seul écran, et personne ne discute plus du « qui a fait quoi ».",
      name: 'Nadir B.',
      role: 'Co-founder, SaaS B2B',
    },
    {
      quote: "Iris a flagué un déséquilibre que je n'avais pas vu. Le point qu'on a fait derrière a sauvé l'asso.",
      name: 'Marc C.',
      role: 'Founder solo → équipe',
    },
  ]
  return (
    <section id="testimonials" className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="text-center mb-12 reveal-up">
        <span className="overline">— Témoignages</span>
        <h2 className="h-section mt-3">Ils ont arrêté de se déchirer.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-up">
        {items.map((t) => (
          <figure key={t.name} className="card-deep p-7 flex flex-col">
            <svg width="24" height="20" viewBox="0 0 24 20" fill="var(--accent-solid)" className="mb-4" aria-hidden>
              <path d="M0 20V12C0 5.6 3.4 1.2 10.2 0L11 3.6C7.2 4.8 5.2 7.2 5.2 11.6H10.2V20H0ZM13.8 20V12C13.8 5.6 17.2 1.2 24 0L24.8 3.6C21 4.8 19 7.2 19 11.6H24V20H13.8Z" opacity="0.7" />
            </svg>
            <blockquote className="flex-1 text-[15px] leading-relaxed" style={{ color: 'var(--ink-on-dark-primary)' }}>
              {t.quote}
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                style={{ background: 'var(--accent-gradient)', color: '#111' }}
              >
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink-on-dark-primary)' }}>{t.name}</div>
                <div className="text-xs" style={{ color: 'var(--ink-on-dark-subtle)' }}>{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="max-w-[1200px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="text-center mb-12 reveal-up">
        <span className="overline">— Tarifs</span>
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
// FAQ
// ─────────────────────────────────────────────────────────────

function Faq() {
  const items = [
    {
      q: "Et si on n'est qu'un seul cofondateur (freelance) ?",
      a: "Bloom marche aussi en mode solo. Tu y retrouves le time tracking, le pilotage projets, le chrono et Iris. Mais le cœur (gouvernance, votes, journal) prend tout son sens dès que tu es plus d'un.",
    },
    {
      q: "Mes données sont-elles vraiment privées ?",
      a: "Oui. Le journal est append-only par design — même nous ne pouvons pas le modifier. Tu peux exporter ton workspace en JSON à tout moment. RGPD compliant, hébergé en UE.",
    },
    {
      q: "Comment fonctionne l'IA ?",
      a: "Iris est branchée sur Anthropic Claude. Tes données ne servent jamais d'entraînement. Tu as 100 requêtes/mois inclus dans le prix — au-delà, tu peux brancher ta propre clé API.",
    },
    {
      q: "Que se passe-t-il si on quitte Bloom ?",
      a: "Tu exportes tout (data + journal en PDF) en un clic. Pas de lock-in. Les données restent à toi. Si tu reviens dans les 30 jours, on les retrouve telles quelles.",
    },
    {
      q: "Pourquoi 8 € par utilisateur et pas un forfait ?",
      a: "Parce qu'on facture l'usage réel. À 2 cofondateurs = 16 €. À 5 = 40 €. Personne ne paie pour des sièges fantômes. Et tu peux annuler en 1 clic.",
    },
  ]
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <section id="faq" className="max-w-[800px] mx-auto px-6 lg:px-20 py-16 sm:py-24">
      <div className="text-center mb-12 reveal-up">
        <span className="overline">— FAQ</span>
        <h2 className="h-section mt-3">Les questions qui reviennent.</h2>
      </div>
      <div className="space-y-2 reveal-up">
        {items.map((item, i) => {
          const open = openIdx === i
          return (
            <div key={i} className="card-deep overflow-hidden">
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 transition-colors hover:bg-white/[0.02]"
                aria-expanded={open}
              >
                <span className="text-[15px] font-medium" style={{ color: 'var(--ink-on-dark-primary)' }}>
                  {item.q}
                </span>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 transition-transform"
                  style={{ color: 'var(--ink-on-dark-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
                  aria-hidden
                >
                  <path d="M3 6l5 5 5-5" />
                </svg>
              </button>
              {open && (
                <div className="px-5 pb-5 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300" style={{ color: 'var(--ink-on-dark-muted)' }}>
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
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
        { label: 'Témoignages', href: '#testimonials' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Changelog', href: '#' },
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
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/bloom-logo-blanc.png" alt="Bloom" width={32} height={32} className="rounded-md" />
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
