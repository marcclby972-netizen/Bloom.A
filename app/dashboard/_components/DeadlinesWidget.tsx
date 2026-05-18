'use client'

/**
 * Widget solo "Échéances" — tâches assignées non-done avec `dueDate` dans
 * les 7 prochains jours, triées par échéance.
 *
 * Réutilise les tasks déjà chargées par le parent via useTasks().
 */

import Link from 'next/link'
import { useMemo } from 'react'
import type { Project, Task, TaskPriority } from '@/lib/v3-types'

const PRIO_CLASS: Record<TaskPriority, string> = {
  low: 'l',
  medium: 'm',
  high: 'h',
}

function formatDue(dueIso: string): { label: string; warn: boolean } {
  const due = new Date(dueIso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  const diffMs = dueDay.getTime() - today.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'En retard', warn: true }
  if (days === 0) return { label: "Aujourd'hui", warn: true }
  if (days === 1) return { label: 'Demain', warn: false }
  return { label: `Dans ${days} jours`, warn: false }
}

export function DeadlinesWidget({
  tasks,
  projectsById,
}: {
  tasks: Task[]
  projectsById: Map<string, Project>
}) {
  const deadlines = useMemo(() => {
    const now = Date.now()
    const limit = now + 7 * 24 * 3600 * 1000
    return tasks
      .filter(
        (t) =>
          t.status !== 'done' &&
          t.dueDate !== null &&
          new Date(t.dueDate).getTime() <= limit
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      )
      .slice(0, 4)
  }, [tasks])

  return (
    <div className="widget w-span-4 solo-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M3 4l1 8h6l1-8M5 4V2.5h4V4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Échéances
        </div>
        <span className="w-meta">7 prochains jours</span>
      </div>
      <div className="list" style={{ margin: '-8px' }}>
        {deadlines.length === 0 && (
          <div className="row" style={{ opacity: 0.6 }}>
            <span className="dot-prio l" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ECECEC' }}>
                Aucune échéance à venir
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(236,236,236,0.55)' }}>
                Ajoutez une date d&apos;échéance dans une tâche
              </div>
            </div>
          </div>
        )}

        {deadlines.map((t) => {
          const due = formatDue(t.dueDate!)
          const projectName = projectsById.get(t.projectId)?.name ?? 'Projet'
          return (
            <Link
              key={t.id}
              href={`/projects/${t.projectId}`}
              className="row"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <span className={`dot-prio ${PRIO_CLASS[t.priority]}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#ECECEC',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'rgba(236,236,236,0.55)',
                  }}
                >
                  {projectName}
                </div>
              </div>
              <span className={`tag${due.warn ? ' warn' : ''}`}>{due.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
