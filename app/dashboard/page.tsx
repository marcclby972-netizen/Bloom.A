'use client'

/**
 * Dashboard v3 — page d'accueil de l'app.
 *
 * Utilise `<DashboardShell />` partagé avec les autres pages connectées
 * (/projects, /tasks, /chrono, /decisions, /calendrier) — voir
 * `_components/DashboardShell.tsx`.
 *
 * Cette page ajoute :
 *  - ModeToggle Solo ↔ Équipe
 *  - GreetRow "Bonjour {prénom}"
 *  - Grille de widgets (.widgets) — chaque widget consomme ses propres
 *    hooks/actions v3 ; placeholders "Bientôt" pour les domaines sans
 *    encore de modèle de données (équité, finances, agenda, journal…).
 */

import { useMemo } from 'react'
import {
  useCurrentUser,
  useCurrentTeam,
  useProjects,
  useTasks,
} from '@/hooks'
import type { Project, Task } from '@/lib/v3-types'

import { DashboardShell, useDashboardShell } from './_components/DashboardShell'
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
  return (
    <DashboardShell screenLabel="Dashboard">
      <DashboardContent />
    </DashboardShell>
  )
}

function DashboardContent() {
  const { user, teamId, isSolo, notifications, unreadCount, markRead, markAllRead } =
    useDashboardShell()
  const { teams, setCurrentTeam } = useCurrentTeam()
  void useCurrentUser() // déjà chargé dans le shell — déclencher refetch si besoin
  const { data: projects, loading: projectsLoading } = useProjects({ teamId })
  const { data: tasks } = useTasks()

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

  return (
    <>
      <ModeToggle isSolo={isSolo} teams={teams} onSelectTeam={setCurrentTeam} />
      <GreetRow userName={user?.name ?? null} />

      <div className="widgets">
        <AgendaPlaceholder />
        <TasksWidget />
        <ChronoWidget projectsById={projectsById} tasksById={tasksById} />

        {teamId && <DecisionsWidget teamId={teamId} />}
        {teamId && <EquityScorePlaceholder />}

        <ProjectsWidget
          projects={projects}
          tasksByProjectId={tasksByProjectId}
          loading={projectsLoading}
        />

        <TimeWeekWidget />

        <RevenuePlaceholder />
        {teamId && <TreasuryPlaceholder />}

        <NotificationsWidget
          notifications={notifications}
          unreadCount={unreadCount}
          markRead={markRead}
          markAllRead={markAllRead}
        />

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
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Placeholders (UI identique à la reference HTML, tag "Bientôt")
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
              <path d="M1.8 5.5h10.4M5 1.8v2.4M9 1.8v2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Agenda du jour
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        L&apos;intégration calendrier arrive bientôt.
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
              <path d="M7 2v10M3 4h8M2 11l1.5-7L5 11M9 11l1.5-7L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Équilibre associés
        </div>
        <PlaceholderTag />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginTop: 8 }}>
        Le score d&apos;équité contribution vs parts arrive bientôt.
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
              <path d="M3 3v8h8M5.5 8.5L7.5 7l1.5 1L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M2 11h10M3 9.5L5 6l2 2 4-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="lab">Ajouter un widget</span>
    </button>
  )
}
