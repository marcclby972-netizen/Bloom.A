'use client'

/**
 * Topbar v0-style — barre 64px avec :
 *  - Mode toggle Solo/Équipe (pill segment control à gauche)
 *  - Search global au centre
 *  - Mini-timer compact (vit avec useTimer)
 *  - Notif bell + user pill à droite
 *
 * Cf. v0-ui/productivity-dashboard-design/components/dashboard/header.tsx
 * pour la référence visuelle.
 */

import { useRouter } from 'next/navigation'
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
  const { isRunning, elapsedSeconds } = useTimer()

  const userLabel = user?.name ?? user?.email?.split('@')[0] ?? 'Anonyme'
  const userInitials = user?.name
    ? initials(user.name)
    : (user?.email ?? '?').slice(0, 2).toUpperCase()

  const pickSolo = () => onSelectTeam(null)
  const pickTeam = () => {
    if (teams.length > 0) onSelectTeam(teams[0])
    else router.push('/onboard')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="tbv">
      {/* ── Left : mode toggle Solo/Équipe ── */}
      <div className="tbv-mode">
        <button
          type="button"
          onClick={pickSolo}
          className={`tbv-mode-btn ${isSolo ? 'on' : ''}`}
          aria-pressed={isSolo}
        >
          Solo
        </button>
        <button
          type="button"
          onClick={pickTeam}
          className={`tbv-mode-btn ${!isSolo ? 'on' : ''}`}
          aria-pressed={!isSolo}
          title={
            teams.length === 0 ? 'Aucune équipe — crée-en une' : currentTeam?.name
          }
        >
          Équipe
          {currentTeam && !isSolo && (
            <span className="tbv-mode-team-name"> · {currentTeam.name}</span>
          )}
        </button>
      </div>

      {/* ── Center : search ── */}
      <div className="tbv-search">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Rechercher projet, tâche, décision…"
          aria-label="Rechercher"
        />
        <kbd className="tbv-search-kbd">⌘K</kbd>
      </div>

      {/* ── Right : timer + bell + user ── */}
      <div className="tbv-right">
        {/* Mini timer (live) */}
        <button
          type="button"
          className={`tbv-timer ${isRunning ? 'on' : ''}`}
          onClick={() => router.push('/chrono')}
          aria-label={isRunning ? 'Chrono en cours' : 'Démarrer un chrono'}
          title={isRunning ? 'Chrono en cours' : 'Aller au chrono'}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M7 5.5v2.5l1.6 1.2M7 2v1.6"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            />
          </svg>
          <span className="tbv-timer-val">
            {isRunning ? formatElapsed(elapsedSeconds) : '00:00'}
          </span>
          {isRunning && <span className="tbv-timer-dot" />}
        </button>

        {/* Notif bell */}
        <button
          type="button"
          className="tbv-icon"
          aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M4.5 13.5h9l-1-1.5V8.5A3.5 3.5 0 009 5a3.5 3.5 0 00-3.5 3.5v3.5l-1 1.5zM7.5 15a1.5 1.5 0 003 0"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && <span className="tbv-bell-dot" />}
        </button>

        {/* User pill */}
        <button
          type="button"
          className="tbv-user"
          onClick={() => router.push('/settings')}
          onContextMenu={(e) => {
            e.preventDefault()
            void handleLogout()
          }}
          title="Clic : paramètres · Clic droit : se déconnecter"
        >
          <span className="tbv-user-av">{userInitials}</span>
          <span className="tbv-user-name">{userLabel}</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 5l3 3 3-3"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
