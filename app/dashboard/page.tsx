'use client'

/**
 * Dashboard v3 — UI pixel-perfect du HTML reference, *toutes les features
 * câblées aux hooks/actions v3*.
 *
 * Architecture :
 *  - Hooks (useCurrentUser, useCurrentTeam, useProjects, useTasks, useTimer,
 *    useDecisions, useNotifications) sont consommés au niveau de cette page
 *    et redistribués aux widgets via props (sauf useTimer/useDecisions qui
 *    sont consommés dans le widget concerné pour ne pas re-render le reste).
 *  - Sous-composants dans `_components/` — chacun re-construit son markup
 *    exact d'après `app/dashboard.css`.
 *  - Widgets non encore branchés (agenda calendrier, équité associés,
 *    revenus, trésorerie/MRR, contributions, charge équipe, chrono global
 *    équipe, dépenses, journal immuable, posts sociaux) restent comme
 *    *stubs visuels* avec tag "Bientôt" et un commentaire TODO. L'UI est
 *    identique à la référence — les valeurs sont placeholders.
 *
 * Le mode toggle Solo ↔ Équipe pilote la classe `.mode-team` de #app, ce
 * qui révèle/cache les widgets `.team-only`/`.solo-only` via CSS (rules
 * définies dans `app/dashboard.css`).
 */

import { useEffect, useMemo, useState } from 'react'
import '../dashboard.css'
import {
  useCurrentUser,
  useCurrentTeam,
  useProjects,
  useTasks,
  useNotifications,
} from '@/hooks'
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/lib/actions/notifications'
import type { Project, Task } from '@/lib/v3-types'

import { Sidebar } from './_components/Sidebar'
import { Topbar } from './_components/Topbar'
import { ModeToggle } from './_components/ModeToggle'
import { GreetRow } from './_components/GreetRow'
import { TasksWidget } from './_components/TasksWidget'
import { ChronoWidget } from './_components/ChronoWidget'
import { DecisionsWidget } from './_components/DecisionsWidget'
import { ProjectsWidget } from './_components/ProjectsWidget'
import { TimeWeekWidget } from './_components/TimeWeekWidget'
import { TimeBreakdownWidget } from './_components/TimeBreakdownWidget'
import { DeadlinesWidget } from './_components/DeadlinesWidget'
import { NotificationsWidget } from './_components/NotificationsWidget'
import { TeamMembersWidget } from './_components/TeamMembersWidget'
import { GovernanceRulesWidget } from './_components/GovernanceRulesWidget'

export default function DashboardPage() {
  // ─── Hooks ───
  const { data: user } = useCurrentUser()
  const { teams, currentTeam, teamId, isSolo, setCurrentTeam } = useCurrentTeam()
  const { data: projects, loading: projectsLoading } = useProjects({ teamId })
  const { data: tasks } = useTasks()
  const { data: notifications, refetch: refetchNotifications } = useNotifications({
    pollMs: 30_000,
  })

  // ─── Maps + dérivés ───
  const projectsById = useMemo<Map<string, Project>>(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  )
  const tasksById = useMemo<Map<string, Task>>(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  )
  const tasksByProjectId = useMemo<Map<string, Task[]>>(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      const arr = m.get(t.projectId) ?? []
      arr.push(t)
      m.set(t.projectId, arr)
    }
    return m
  }, [tasks])

  const openTasksCount = tasks.filter((t) => t.status !== 'done').length

  // ─── Notifications (badge + handlers) ───
  const [pendingDecisionsCount, setPendingDecisionsCount] = useState(0)
  useEffect(() => {
    // Compte d'attente : on lit les notifications de type new_decision non-lues
    setPendingDecisionsCount(
      notifications.filter(
        (n) => n.type === 'new_decision' && n.readAt === null
      ).length
    )
  }, [notifications])

  const unreadCount = notifications.filter((n) => n.readAt === null).length

  const handleMarkRead = async (id: string) => {
    const r = await markNotificationAsReadAction(id)
    if (r.ok) await refetchNotifications()
  }
  const handleMarkAllRead = async () => {
    const r = await markAllNotificationsAsReadAction()
    if (r.ok) await refetchNotifications()
  }

  return (
    <div className="app" id="app" data-screen-label="Dashboard">
      <Sidebar
        tasksBadge={openTasksCount}
        decisionsBadge={pendingDecisionsCount}
      />

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
          <ModeToggle
            isSolo={isSolo}
            teams={teams}
            onSelectTeam={setCurrentTeam}
          />

          <GreetRow userName={user?.name ?? null} />

          {/* ════════ WIDGETS GRID ════════ */}
          <div className="widgets">
            {/* ROW 1 — solo + team partagés */}

            {/* TODO v3 : agenda viendra avec la calendar integration */}
            <AgendaPlaceholder />

            <TasksWidget />

            <ChronoWidget projectsById={projectsById} tasksById={tasksById} />

            {/* TEAM-ONLY */}
            {teamId && <DecisionsWidget teamId={teamId} />}
            {teamId && <EquityScorePlaceholder />}

            <ProjectsWidget
              projects={projects}
              tasksByProjectId={tasksByProjectId}
              loading={projectsLoading}
            />

            <TimeWeekWidget />

            {/* SOLO : Revenus / TEAM : Trésorerie + MRR */}
            <RevenuePlaceholder />
            {teamId && <TreasuryPlaceholder />}

            <NotificationsWidget
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={handleMarkRead}
              markAllRead={handleMarkAllRead}
            />

            {/* TEAM-ONLY */}
            {teamId && <TeamMembersWidget teamId={teamId} />}
            {teamId && <ContributionsPlaceholder />}
            {teamId && <WorkloadPlaceholder />}

            <TimeBreakdownWidget projectsById={projectsById} />

            {teamId && <GovernanceRulesWidget teamId={teamId} />}
            {teamId && <GlobalChronoPlaceholder />}

            <DeadlinesWidget tasks={tasks} projectsById={projectsById} />

            {teamId && <ExpensesPlaceholder />}
            {teamId && <JournalPlaceholder />}
            {teamId && <SocialPostsPlaceholder />}

            <AddWidgetButton />
          </div>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Placeholder widgets — UI identique au reference HTML, tag "Bientôt".
// Ces widgets ne disposent pas encore de modèle de données v3 ;
// ils seront re-câblés en cohérence avec leur backend respectif.
// ─────────────────────────────────────────────────────────────

function PlaceholderTag() {
  return (
    <span
      className="tag"
      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(236,236,236,0.55)' }}
    >
      Bientôt
    </span>
  )
}

function AgendaPlaceholder() {
  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="1.8" y="3" width="10.4" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M1.8 5.5h10.4M5 1.8v2.4M9 1.8v2.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Agenda du jour
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        L&apos;intégration calendrier (Google Calendar) arrive bientôt.
      </p>
    </div>
  )
}

function EquityScorePlaceholder() {
  return (
    <div className="widget w-span-8 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2v10M3 4h8M2 11l1.5-7L5 11M9 11l1.5-7L12 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Équilibre associés
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le score d&apos;équité contribution vs parts sera disponible quand le
        modèle de finance/temps team-wide sera complet.
      </p>
    </div>
  )
}

function RevenuePlaceholder() {
  return (
    <div className="widget w-span-4 solo-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3v8h8M5.5 8.5L7.5 7l1.5 1L11 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Revenus ce mois
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le module finances arrive prochainement.
      </p>
    </div>
  )
}

function TreasuryPlaceholder() {
  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="4" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          Trésorerie &amp; MRR
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le module finances et MRR sera connecté à Stripe.
      </p>
    </div>
  )
}

function ContributionsPlaceholder() {
  return (
    <div className="widget w-span-8 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="2.5" height="6" stroke="currentColor" strokeWidth="1.5" />
              <rect x="5.75" y="3" width="2.5" height="9" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9.5" y="7" width="2.5" height="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          Contributions cette semaine
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le tableau de contributions team-wide arrive bientôt.
      </p>
    </div>
  )
}

function WorkloadPlaceholder() {
  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M2 11h10M3 9.5L5 6l2 2 4-5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Charge équipe
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        La répartition de charge par membre arrive bientôt.
      </p>
    </div>
  )
}

function GlobalChronoPlaceholder() {
  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 5.5v2.5l1.6 1.2M7 2v1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Chrono global équipe
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Les timers actifs des associés arriveront avec la presence layer.
      </p>
    </div>
  )
}

function ExpensesPlaceholder() {
  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="4" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 7h10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          Dépenses récentes
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le module dépenses sera lié au feed décisions.
      </p>
    </div>
  )
}

function JournalPlaceholder() {
  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M4 3h7v9H4z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.5 6h3M6.5 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Journal récent
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le journal immuable des évènements team arrive bientôt.
      </p>
    </div>
  )
}

function SocialPostsPlaceholder() {
  return (
    <div className="widget w-span-8 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="3" y="2" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 11.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Posts sociaux
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        La performance LinkedIn / X sera connectée prochainement.
      </p>
    </div>
  )
}

function AddWidgetButton() {
  return (
    <button className="widget add w-span-4" type="button">
      <span className="plus">
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="lab">Ajouter un widget</span>
    </button>
  )
}
