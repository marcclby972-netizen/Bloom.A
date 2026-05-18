'use client'

/**
 * DashboardShell — wrapper réutilisable pour toutes les pages connectées
 * (/dashboard, /projects, /tasks, /chrono, /decisions, /calendrier).
 *
 * Rend la structure HTML/CSS de référence :
 *  - <div class="app" id="app"> wrapper
 *  - <Sidebar /> côté gauche
 *  - <main class="main"><Topbar /><div class="content">{children}</div></main>
 *
 * Charge dashboard.css ici (partagé entre toutes les pages-shell).
 *
 * Les pages restent responsables de leur propre layout dans `.content` —
 * typiquement une PageHeader (titre + actions) + grille/liste.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import {
  useCurrentUser,
  useCurrentTeam,
  useNotifications,
  useTasks,
  useDecisions,
} from '@/hooks'
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/lib/actions/notifications'
import type { User, Team, Notification } from '@/lib/v3-types'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import '../../dashboard.css'

type ShellCtx = {
  user: User | null
  currentTeam: Team | null
  teamId: string | null
  isSolo: boolean
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const DashboardShellCtx = createContext<ShellCtx | null>(null)

export function useDashboardShell(): ShellCtx {
  const v = useContext(DashboardShellCtx)
  if (!v) {
    throw new Error('useDashboardShell must be used inside <DashboardShell>')
  }
  return v
}

export function DashboardShell({
  children,
  screenLabel,
}: {
  children: React.ReactNode
  screenLabel: string
}) {
  const { data: user } = useCurrentUser()
  const { teams, currentTeam, teamId, isSolo, setCurrentTeam } = useCurrentTeam()
  const { data: tasks } = useTasks()
  const { data: notifications, refetch } = useNotifications({ pollMs: 60_000 })
  const { data: decisions } = useDecisions(teamId)

  // Sync .mode-team sur #app — CSS rules `.team-only` / `.solo-only` en
  // dépendent (cf. dashboard.css lignes 343-344).
  useEffect(() => {
    const app = document.getElementById('app')
    if (app) app.classList.toggle('mode-team', !isSolo)
  }, [isSolo])

  const openTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done').length,
    [tasks]
  )
  const pendingDecisionsCount = useMemo(
    () => decisions.filter((d) => d.status === 'pending').length,
    [decisions]
  )
  const unreadCount = notifications.filter((n) => n.readAt === null).length

  const handleMarkRead = async (id: string) => {
    const r = await markNotificationAsReadAction(id)
    if (r.ok) await refetch()
  }
  const handleMarkAllRead = async () => {
    const r = await markAllNotificationsAsReadAction()
    if (r.ok) await refetch()
  }

  const ctx: ShellCtx = {
    user,
    currentTeam,
    teamId,
    isSolo,
    notifications,
    unreadCount,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
  }

  return (
    <div className="app" id="app" data-screen-label={screenLabel}>
      <Sidebar tasksBadge={openTasksCount} decisionsBadge={pendingDecisionsCount} />
      <main className="main">
        <Topbar
          user={user ? { name: user.name, email: user.email } : null}
          teams={teams}
          currentTeam={currentTeam}
          isSolo={isSolo}
          unreadCount={unreadCount}
          onSelectTeam={setCurrentTeam}
        />
        <div className="content">
          <DashboardShellCtx.Provider value={ctx}>
            {children}
          </DashboardShellCtx.Provider>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PageHeader — utilitaire visuel pour titre + actions
// ─────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  eyebrow,
  right,
}: {
  title: React.ReactNode
  eyebrow?: string
  right?: React.ReactNode
}) {
  return (
    <div className="greet-row" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
      <div className="greet" style={{ flex: 1 }}>
        {eyebrow && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(236,236,236,0.5)',
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
      </div>
      {right && (
        <div className="quick-actions" style={{ gap: 8 }}>
          {right}
        </div>
      )}
    </div>
  )
}
