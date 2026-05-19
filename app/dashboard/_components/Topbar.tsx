'use client'

/**
 * Topbar minimaliste façon Iko°OS / Cron / Linear.
 *
 * À gauche : titre de la page courante (slot prop `pageTitle`, default
 * "Vue d'ensemble") + icône home discrète.
 *
 * À droite (compact rail) :
 *  - Mini-timer compact (00:00 ▶ ou état "en cours" si useTimer.isRunning)
 *  - Status dot (vert si en ligne — toujours green pour l'instant)
 *  - Assistant search (placeholder "espace pour l'assistant" + raccourci)
 *  - Notif bell (dot rouge si unread)
 *  - User pill avec rôle (OWNER, etc.)
 */

import { useRouter, usePathname } from 'next/navigation'
import type { Team } from '@/lib/v3-types'
import { createClient } from '@/lib/supabase/client'
import { useTimer, formatElapsed } from '@/hooks'

function initials(label: string): string {
  return label
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/projects': 'Projets',
  '/tasks': 'Tâches',
  '/chrono': 'Chrono',
  '/calendrier': 'Agenda',
  '/decisions': 'Décisions',
  '/expenses': 'Dépenses',
  '/contributions': 'Contributions',
  '/settings': 'Paramètres',
}

export function Topbar({
  user,
  teams,
  currentTeam,
  isSolo,
  unreadCount,
  onSelectTeam,
}: {
  user: { name: string | null; email: string } | null
  teams: Team[]
  currentTeam: Team | null
  isSolo: boolean
  unreadCount: number
  onSelectTeam: (team: Team | null) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isRunning, elapsedSeconds } = useTimer()

  // Page title : exact match d'abord, sinon prefix pour /projects/[id] etc.
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k + '/'))?.[1] ??
    "Vue d'ensemble"

  // User pill role
  const role = isSolo
    ? 'SOLO'
    : currentTeam
      ? 'OWNER'
      : 'GUEST'
  const userLabel = user?.name ?? user?.email?.split('@')[0] ?? 'Anonyme'
  const userInitials = user?.name
    ? initials(user.name)
    : (user?.email ?? '?').slice(0, 2).toUpperCase()

  const cycleWorkspace = () => {
    if (teams.length === 0) return
    if (isSolo) {
      onSelectTeam(teams[0])
      return
    }
    const idx = teams.findIndex((t) => t.id === currentTeam?.id)
    if (idx === -1 || idx === teams.length - 1) onSelectTeam(null)
    else onSelectTeam(teams[idx + 1])
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="tb-rail">
      {/* Left : page title + home icon */}
      <div className="tb-rail-left">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="tb-rail-home"
          aria-label="Accueil"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 8l6-5 6 5v7a1 1 0 01-1 1h-2v-5H6v5H4a1 1 0 01-1-1V8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="tb-rail-title">{title}</h1>
      </div>

      {/* Right : compact rail */}
      <div className="tb-rail-right">
        {/* Mini timer (live tick) */}
        <button
          type="button"
          className={`tb-rail-timer ${isRunning ? 'on' : ''}`}
          onClick={() => router.push('/chrono')}
          aria-label={isRunning ? 'Chrono en cours' : 'Démarrer un chrono'}
          title={isRunning ? 'Chrono en cours' : 'Aller au chrono'}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 5.5v2.5l1.6 1.2M7 2v1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="tb-rail-timer-val">
            {isRunning ? formatElapsed(elapsedSeconds) : '00:00'}
          </span>
          {isRunning ? (
            <span className="tb-rail-timer-running" />
          ) : (
            <svg width="9" height="9" viewBox="0 0 11 11" fill="currentColor">
              <path d="M2 1v9l7-4.5L2 1z" />
            </svg>
          )}
        </button>

        {/* Status dot (online) */}
        <span className="tb-rail-status" aria-label="En ligne" title="En ligne" />

        {/* Assistant search (placeholder for now) */}
        <button
          type="button"
          className="tb-rail-assistant"
          aria-label="Assistant"
          title="Assistant Bloom"
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <rect x="7" y="2.5" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M4.5 9a4.5 4.5 0 009 0M9 13.5V16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="tb-rail-assistant-text">
            <em>espace</em> pour l&apos;assistant
          </span>
        </button>

        {/* Notif bell */}
        <button
          type="button"
          className="tb-rail-icon"
          aria-label="Notifications"
          title={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M4.5 13.5h9l-1-1.5V8.5A3.5 3.5 0 009 5a3.5 3.5 0 00-3.5 3.5v3.5l-1 1.5zM7.5 15a1.5 1.5 0 003 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && <span className="tb-rail-bell-dot" />}
        </button>

        {/* User pill */}
        <button
          type="button"
          className="tb-rail-user"
          onClick={cycleWorkspace}
          onContextMenu={(e) => {
            e.preventDefault()
            void handleLogout()
          }}
          title="Clic : changer d'espace · Clic droit : se déconnecter"
        >
          <span className="tb-rail-user-av">{userInitials}</span>
          <span className="tb-rail-user-info">
            <span className="tb-rail-user-name">{userLabel}</span>
            <span className="tb-rail-user-role">{role}</span>
          </span>
        </button>
      </div>
    </header>
  )
}
