'use client'

/**
 * Sidebar minimaliste icon-only — inspirée de Iko°OS / Linear / Cron.
 *
 * Toujours en mode rail étroit (~60px), labels révélés en tooltip au hover.
 * Pas de section headers (Principal/Équipe/Outils) → on les groupe par
 * espacement vertical.
 *
 * Items team-only restent rendus mais cachés via la classe `.team-only` +
 * la règle CSS `.app:not(.mode-team) .team-only { display: none }` (cf.
 * dashboard.css).
 *
 * Active state dérivé du pathname.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  badge?: number
  teamOnly?: boolean
  icon: React.ReactNode
}

const PRINCIPAL: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path
          d="M3 9l7-6 7 6v8a1 1 0 01-1 1h-3v-6H7v6H4a1 1 0 01-1-1V9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Agenda',
    href: '/calendrier',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Tâches',
    href: '/tasks',
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

const TEAM: NavItem[] = [
  {
    label: 'Décisions',
    href: '/decisions',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 10l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
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
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

function SbIcon({
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
        'sb-rail-item',
        active ? 'active' : '',
        item.teamOnly ? 'team-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={item.label}
      title={item.label}
    >
      {item.icon}
      {badge}
    </Link>
  )
}

export function Sidebar({
  tasksBadge,
  decisionsBadge,
}: {
  tasksBadge?: number
  decisionsBadge?: number
}) {
  const pathname = usePathname()

  return (
    <aside className="sidebar sidebar-rail">
      {/* Brand mark — minuscule logo en haut */}
      <Link href="/dashboard" className="sb-rail-brand" aria-label="Accueil Bloom">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
          <defs>
            <linearGradient id="bgsb-rail" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#E37520" />
              <stop offset="1" stopColor="#FBBE4D" />
            </linearGradient>
          </defs>
          <path d="M14 2C16.5 5 16.5 8 14 11C11.5 8 11.5 5 14 2Z" fill="url(#bgsb-rail)" />
          <path d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z" fill="url(#bgsb-rail)" />
          <path d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z" fill="url(#bgsb-rail)" />
          <path d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z" fill="url(#bgsb-rail)" />
          <circle cx="14" cy="14" r="2.4" fill="#ECECEC" />
        </svg>
      </Link>

      {/* Group : principal */}
      <div className="sb-rail-group">
        {PRINCIPAL.map((it) => (
          <SbIcon
            key={it.label}
            item={it}
            pathname={pathname}
            badge={
              it.label === 'Tâches' && tasksBadge !== undefined && tasksBadge > 0 ? (
                <span className="sb-rail-badge">{tasksBadge}</span>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* Group : équipe (auto-hidden en mode solo via .team-only CSS) */}
      <div className="sb-rail-group">
        {TEAM.map((it) => (
          <SbIcon
            key={it.label}
            item={it}
            pathname={pathname}
            badge={
              it.label === 'Décisions' && decisionsBadge !== undefined && decisionsBadge > 0 ? (
                <span className="sb-rail-badge">{decisionsBadge}</span>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* Footer : settings */}
      <div className="sb-rail-footer">
        {FOOTER.map((it) => (
          <SbIcon key={it.label} item={it} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}
