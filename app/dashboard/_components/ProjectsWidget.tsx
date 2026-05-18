'use client'

/**
 * Widget "Projets en cours" — liste les projets actifs du scope (team ou
 * solo), avec progress bar = % tâches done / total.
 *
 * Données : `useProjects({ teamId })` + agrégation `useTasks` côté parent
 * pour calculer les ratios sans refaire un fetch par projet.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import type { Project, Task } from '@/lib/v3-types'

export function ProjectsWidget({
  projects,
  tasksByProjectId,
  loading,
}: {
  projects: Project[]
  tasksByProjectId: Map<string, Task[]>
  loading: boolean
}) {
  const active = useMemo(
    () => projects.filter((p) => p.status === 'active').slice(0, 4),
    [projects]
  )

  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="3" width="10" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 6h10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          Projets en cours
        </div>
        <span className="w-meta">{active.length} actifs</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && active.length === 0 && (
          <div className="proj-card" style={{ opacity: 0.5 }}>
            <div className="top">
              <span className="name">Chargement…</span>
            </div>
          </div>
        )}

        {!loading && active.length === 0 && (
          <div className="proj-card" style={{ opacity: 0.6 }}>
            <div className="top">
              <span className="name">Aucun projet actif</span>
              <Link href="/projects" className="w-link" style={{ display: 'inline' }}>
                Créer →
              </Link>
            </div>
          </div>
        )}

        {active.map((p) => {
          const tasks = tasksByProjectId.get(p.id) ?? []
          const total = tasks.length
          const done = tasks.filter((t) => t.status === 'done').length
          const pct = total === 0 ? 0 : Math.round((done / total) * 100)
          return (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="proj-card"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="top">
                <span className="name">{p.name}</span>
                <span className="tasks">
                  {done}/{total} tâche{total > 1 ? 's' : ''}
                </span>
              </div>
              <div className="row-end">
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span className="pct">{pct}%</span>
              </div>
            </Link>
          )
        })}
      </div>

      <Link href="/projects" className="w-link">
        + Nouveau projet
      </Link>
    </div>
  )
}
