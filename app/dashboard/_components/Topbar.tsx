'use client'

/**
 * Topbar — workspace selector (cycle entre teams + solo), search placeholder,
 * notifications bell (badge si unreadCount > 0), help icon, user menu.
 *
 * Click sur le workspace : cycle solo → team1 → team2 → solo …
 *
 * Logout via `supabase.auth.signOut()` puis push `/`.
 */

import { useRouter } from 'next/navigation'
import type { Team } from '@/lib/v3-types'
import { createClient } from '@/lib/supabase/client'

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

  const workspaceLabel = isSolo
    ? 'Mon espace solo'
    : currentTeam?.name ?? 'Choisir un espace'
  const workspaceInitials = isSolo
    ? user?.name
      ? initials(user.name)
      : (user?.email ?? '?').slice(0, 2).toUpperCase()
    : currentTeam
      ? initials(currentTeam.name)
      : '?'

  const userLabel = user?.name ?? user?.email?.split('@')[0] ?? 'Anonyme'
  const userInitials = user?.name
    ? initials(user.name)
    : (user?.email ?? '?').slice(0, 2).toUpperCase()

  // Cycle workspace : solo → team1 → team2 → … → solo
  const cycleWorkspace = () => {
    if (teams.length === 0) return
    if (isSolo) {
      onSelectTeam(teams[0])
      return
    }
    const idx = teams.findIndex((t) => t.id === currentTeam?.id)
    if (idx === -1 || idx === teams.length - 1) {
      onSelectTeam(null) // back to solo
    } else {
      onSelectTeam(teams[idx + 1])
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="topbar">
      <button className="workspace" type="button" onClick={cycleWorkspace} title="Changer d'espace">
        <span className="ws-avatar">{workspaceInitials}</span>
        <span>{workspaceLabel}</span>
        <svg className="chev" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="search">
        <svg viewBox="0 0 14 14" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Rechercher projet, tâche, décision…</span>
        <kbd>⌘K</kbd>
      </div>
      <div className="tb-right">
        <button className="tb-icon" aria-label="Notifications" type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4.5 13.5h9l-1-1.5V8.5A3.5 3.5 0 009 5a3.5 3.5 0 00-3.5 3.5v3.5l-1 1.5zM7.5 15a1.5 1.5 0 003 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && <span className="dot" />}
        </button>
        <button className="tb-icon" aria-label="Aide" type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M7 7.5a2 2 0 014 0c0 1-1 1.5-2 2v.5M9 12.5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className="tb-user"
          type="button"
          onClick={handleLogout}
          title="Se déconnecter"
        >
          <span className="av av-b">{userInitials}</span>
          <span>{userLabel}</span>
        </button>
      </div>
    </header>
  )
}
