'use client'

/**
 * Dashboard v3 — refonte UI inspirée Iko°OS.
 *
 * Layout :
 *  - HeroGreeting (avatar + "Bonjour, {prénom}" très grand)
 *  - Row 1 : 5 KPI cards aérés
 *      [Projets actifs] [Vélocité tâches] [Streak] [Agenda du jour] [Tâches du jour]
 *  - Row 2 : 3 widgets plus larges
 *      [Décisions à voter / vide solo] [Charge équipe / Tasks list] [Chrono actif]
 *  - Row 3 : Chart full-width (dépenses ou placeholder)
 *
 * Les sections team-only sont rendues conditionnellement (pas par
 * `.team-only` CSS car la nouvelle grille n'utilise plus ce flag).
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
import { HeroGreeting } from './_components/HeroGreeting'
import { KpiCard, KpiValue, KpiSub, KpiSeeMore } from './_components/KpiCard'
import { StreakKpi } from './_components/StreakKpi'
import { AgendaDayKpi } from './_components/AgendaDayKpi'
import { VelocityKpi } from './_components/VelocityKpi'
import { ChronoWidget } from './_components/ChronoWidget'
import { DecisionsWidget } from './_components/DecisionsWidget'
import { TasksWidget } from './_components/TasksWidget'
import { ProjectsWidget } from './_components/ProjectsWidget'
import { RevenueChartWidget } from './_components/RevenueChartWidget'

export default function DashboardPage() {
  return (
    <DashboardShell screenLabel="Dashboard">
      <DashboardContent />
    </DashboardShell>
  )
}

function DashboardContent() {
  const { teamId } = useDashboardShell()
  const { data: user } = useCurrentUser()
  void useCurrentTeam() // ensure mount
  const { data: projects, loading: projectsLoading } = useProjects({ teamId })
  const { data: tasks } = useTasks()

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

  const activeProjectsCount = projects.filter((p) => p.status === 'active').length
  const openTasksCount = tasks.filter((t) => t.status !== 'done').length

  return (
    <>
      <HeroGreeting
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
      />

      <div className="dash-divider" />

      {/* ── Row 1 : 5 KPI compacts ── */}
      <div className="dash-kpi-row dash-kpi-row-5">
        <KpiCard
          title="Projets actifs"
          rightAction={<KpiSeeMore href="/projects" />}
          href="/projects"
        >
          <KpiValue>{activeProjectsCount}</KpiValue>
          <KpiSub>
            {activeProjectsCount === 0
              ? 'Crée ton premier projet'
              : `${activeProjectsCount} en cours`}
          </KpiSub>
        </KpiCard>

        <VelocityKpi />

        <StreakKpi />

        <AgendaDayKpi teamId={teamId} />

        <KpiCard
          title="Tâches du jour"
          rightAction={<KpiSeeMore href="/tasks" />}
          href="/tasks"
        >
          <KpiValue>
            {openTasksCount === 0 ? '0' : openTasksCount}
          </KpiValue>
          <KpiSub>
            {openTasksCount === 0
              ? 'Aucune tâche en cours'
              : `${openTasksCount} restante${openTasksCount > 1 ? 's' : ''}`}
          </KpiSub>
        </KpiCard>
      </div>

      {/* ── Row 2 : 3 widgets moyens ── */}
      <div className="dash-kpi-row dash-kpi-row-3">
        {teamId ? (
          <DecisionsWidget teamId={teamId} />
        ) : (
          <ProjectsWidget
            projects={projects}
            tasksByProjectId={tasksByProjectId}
            loading={projectsLoading}
          />
        )}
        <TasksWidget />
        <ChronoWidget projectsById={projectsById} tasksById={tasksById} />
      </div>

      {/* ── Row 3 : Chart full-width ── */}
      <div className="dash-kpi-row dash-kpi-row-1">
        <RevenueChartWidget teamId={teamId} />
      </div>
    </>
  )
}
