'use client'

/**
 * Dashboard sidebar — mirror exact du HTML reference (sb-brand, sb-section,
 * sb-item, badges). Active state dérivé de l'URL.
 *
 * Items team-only sont rendus avec `.team-only` ; visibilité contrôlée par
 * la classe `.mode-team` sur #app (gérée par le mode toggle).
 *
 * Collapse géré via le bouton #sb-toggle (encore manipulé en JS DOM par
 * `DashboardScripts.tsx` pour rester proche du HTML reference).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

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
      <svg viewBox="0 0 18 18" fill="none">
        <path
          d="M3 8l6-5 6 5v7a1 1 0 01-1 1h-2v-5H6v5H4a1 1 0 01-1-1V8z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10.5" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2.5" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10.5" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: 'Tâches',
    href: '/tasks',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Chrono',
    href: '/chrono',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 6.5v3.5l2.2 1.5M9 2v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Agenda',
    href: '/calendrier',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="4" width="13" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 7h13M6 2.5v3M12 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

const TEAM: NavItem[] = [
  {
    label: 'Mode Associés',
    href: '/dashboard',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <circle cx="6" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="13" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M2 15c0-2.2 1.8-4 4-4s4 1.8 4 4M11 15c0-1.7 1.3-3 3-3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: 'Décisions',
    href: '/decisions',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M3 4h12v10H3z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Journal',
    href: '/dashboard',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M4 3h10v12H4z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 6h4M7 9h4M7 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Finances',
    href: '/dashboard',
    teamOnly: true,
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 4.5l3-2M15.5 4.5l-3-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

const TOOLS: NavItem[] = [
  {
    label: 'Agent IA',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="3" y="5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="7" cy="9.5" r="1" fill="currentColor" />
        <circle cx="11" cy="9.5" r="1" fill="currentColor" />
        <path d="M9 3v2M6 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Planificateur',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="5" y="2" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 13.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Audio → IA',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 18 18" fill="none">
        <rect x="7" y="2.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M4.5 9a4.5 4.5 0 009 0M9 13.5V16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

function SbItem({
  item,
  pathname,
  badge,
}: {
  item: NavItem
  pathname: string
  badge?: React.ReactNode
}) {
  // active : pathname === href ET pathname === /dashboard pour ne pas
  // mettre actif tous les liens de placeholder team-only/Tools
  const active =
    item.href === '/dashboard'
      ? pathname === '/dashboard' && item.label === 'Dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={[
        'sb-item',
        active ? 'active' : '',
        item.teamOnly ? 'team-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {item.icon}
      <span className="label">{item.label}</span>
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
  const toggleCollapse = useCallback(() => {
    document.getElementById('app')?.classList.toggle('collapsed')
  }, [])

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <Link href="/dashboard" className="sb-brand">
          <span className="sb-brand-mark">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="bgsb" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#E37520" />
                  <stop offset="1" stopColor="#FBBE4D" />
                </linearGradient>
              </defs>
              <path d="M14 2C16.5 5 16.5 8 14 11C11.5 8 11.5 5 14 2Z" fill="url(#bgsb)" />
              <path d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z" fill="url(#bgsb)" />
              <path d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z" fill="url(#bgsb)" />
              <path d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z" fill="url(#bgsb)" />
              <circle cx="14" cy="14" r="2.4" fill="#ECECEC" />
            </svg>
          </span>
          Bloom
        </Link>
        <button
          className="sb-collapse"
          id="sb-toggle"
          aria-label="Collapse sidebar"
          type="button"
          onClick={toggleCollapse}
        >
          <svg viewBox="0 0 14 14" fill="none">
            <path
              d="M9 3L5 7l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="sb-section">Principal</div>
      {PRINCIPAL.map((it) => (
        <SbItem
          key={it.label}
          item={it}
          pathname={pathname}
          badge={
            it.label === 'Tâches' && tasksBadge !== undefined && tasksBadge > 0 ? (
              <span className="badge">{tasksBadge}</span>
            ) : undefined
          }
        />
      ))}

      <div className="sb-section team-only">Équipe</div>
      {TEAM.map((it) => (
        <SbItem
          key={it.label}
          item={it}
          pathname={pathname}
          badge={
            it.label === 'Décisions' && decisionsBadge !== undefined && decisionsBadge > 0 ? (
              <span className="badge">{decisionsBadge}</span>
            ) : undefined
          }
        />
      ))}

      <div className="sb-section">Outils</div>
      {TOOLS.map((it) => (
        <SbItem key={it.label} item={it} pathname={pathname} />
      ))}

      <div className="sb-footer">
        <Link href="/settings" className="sb-item">
          <svg viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M9 2v2M9 14v2M2 9h2M14 9h2M4 4l1.5 1.5M13 13l1.5 1.5M4 14l1.5-1.5M13 5l1.5-1.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="label">Paramètres</span>
        </Link>
        <Link href="/dashboard" className="sb-item">
          <svg viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M7 7.5a2 2 0 014 0c0 1-1 1.5-2 2v.5M9 12.5h.01"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="label">Aide</span>
        </Link>
      </div>
    </aside>
  )
}
