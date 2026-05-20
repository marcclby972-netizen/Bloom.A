'use client'

/**
 * Sidebar v0-style — 256px wide avec labels visibles + bouton primaire
 * "Nouveau projet" en haut + groupes nav vertical.
 *
 * Sections (cf. brief v0) :
 *  - Principal : Vue d'ensemble, Projets, Tâches, Calendrier, Chrono
 *  - Création : Brouillons, Stats
 *  - Équipe (team-only) : Gouvernance, Dépenses, Contributions
 *  - Footer : Paramètres + Aide
 *
 * Active state via pathname, badges live, "+ Nouveau projet" → /projects.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  teamOnly?: boolean
  icon: React.ReactNode
}

const PRINCIPAL: NavItem[] = [
  {
    label: "Vue d'ensemble",
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M3 9l7-6 7 6v8a1 1 0 01-1 1h-3v-6H7v6H4a1 1 0 01-1-1V9z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="4" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="12" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="12" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Tâches',
    href: '/tasks',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 10l2.5 2.5L14 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Calendrier',
    href: '/calendrier',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Chrono',
    href: '/chrono',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 7v4l2.5 1.5M10 2v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

const CREATION: NavItem[] = [
  {
    label: 'Brouillons',
    href: '/brouillons',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M5 3h7l4 4v10H5z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        />
        <path d="M12 3v4h4M8 12h5M8 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M3 17V8m5 9V4m5 13v-7m5 7v-4"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
]

const TEAM: NavItem[] = [
  {
    label: 'Gouvernance',
    href: '/decisions',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2L3 5v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9V5l-7-3z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        />
        <path d="M7.5 10l1.8 1.8L13 8.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Dépenses',
    href: '/expenses',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 5l3.5-2.5M17 5l-3.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Contributions',
    href: '/contributions',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 17c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M12 17c0-2 1.5-3.5 4-3.5"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
]

const FOOTER: NavItem[] = [
  {
    label: 'Paramètres',
    href: '/settings',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 2.5v2.5M10 15v2.5M2.5 10h2.5M15 10h2.5M4.5 4.5l1.8 1.8M13.7 13.7l1.8 1.8M4.5 15.5l1.8-1.8M13.7 6.3l1.8-1.8"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
]

function SbRow({
  item,
  pathname,
  badge,
}: {
  item: NavItem
  pathname: string
  badge?: React.ReactNode
}) {
  const active =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={[
        'sbv-row',
        active ? 'active' : '',
        item.teamOnly ? 'team-only' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className="sbv-icon">{item.icon}</span>
      <span className="sbv-label">{item.label}</span>
      {badge && <span className="sbv-badge">{badge}</span>}
    </Link>
  )
}

function SbSection({ title }: { title: string }) {
  return <div className="sbv-section">{title}</div>
}

export function Sidebar({
  tasksBadge,
  decisionsBadge,
}: {
  tasksBadge?: number
  decisionsBadge?: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="sbv">
      {/* Brand */}
      <Link href="/dashboard" className="sbv-brand">
        <span className="sbv-brand-mark">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="bgsbv" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FF8A1A" />
                <stop offset="1" stopColor="#FBBE4D" />
              </linearGradient>
            </defs>
            <path d="M14 2C16.5 5 16.5 8 14 11C11.5 8 11.5 5 14 2Z" fill="url(#bgsbv)" />
            <path d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z" fill="url(#bgsbv)" />
            <path d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z" fill="url(#bgsbv)" />
            <path d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z" fill="url(#bgsbv)" />
            <circle cx="14" cy="14" r="2.4" fill="#F3F3F2" />
          </svg>
        </span>
        <span className="sbv-brand-name">Bloom</span>
      </Link>

      {/* + Nouveau projet (CTA orange v0-style) */}
      <button
        type="button"
        onClick={() => router.push('/projects')}
        className="sbv-new-project"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Nouveau projet
      </button>

      {/* Nav */}
      <nav className="sbv-nav">
        <SbSection title="Principal" />
        {PRINCIPAL.map((it) => (
          <SbRow
            key={it.label}
            item={it}
            pathname={pathname}
            badge={
              it.label === 'Tâches' && tasksBadge !== undefined && tasksBadge > 0
                ? tasksBadge
                : undefined
            }
          />
        ))}

        <SbSection title="Création" />
        {CREATION.map((it) => (
          <SbRow key={it.label} item={it} pathname={pathname} />
        ))}

        <div className="team-only" style={{ display: 'contents' }}>
          <SbSection title="Équipe" />
        </div>
        {TEAM.map((it) => (
          <SbRow
            key={it.label}
            item={it}
            pathname={pathname}
            badge={
              it.label === 'Gouvernance' && decisionsBadge !== undefined && decisionsBadge > 0
                ? decisionsBadge
                : undefined
            }
          />
        ))}
      </nav>

      <div className="sbv-footer">
        {FOOTER.map((it) => (
          <SbRow key={it.label} item={it} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}
