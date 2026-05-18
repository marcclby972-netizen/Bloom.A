'use client'

/**
 * Widget "Tâches du jour" — top 5 tâches assignées à l'utilisateur,
 * toggle done ↔ todo optimiste via `useTasks().setStatus`.
 *
 * Priorité mappée vers `.dot-prio l|m|h`.
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { useTasks } from '@/hooks'
import type { Task, TaskPriority } from '@/lib/v3-types'

const PRIO_CLASS: Record<TaskPriority, string> = {
  low: 'l',
  medium: 'm',
  high: 'h',
}

export function TasksWidget() {
  const { data: tasks, setStatus, loading } = useTasks()

  // Top 5 tâches non archivées : done en haut OK (le HTML les montre cochées)
  // mais on garde l'ordre : todo + in_progress en haut, done à la fin.
  const top5 = useMemo<Task[]>(() => {
    const order = (s: Task['status']) =>
      s === 'todo' ? 0 : s === 'in_progress' ? 1 : 2
    return [...tasks]
      .sort((a, b) => order(a.status) - order(b.status))
      .slice(0, 5)
  }, [tasks])

  const doneCount = top5.filter((t) => t.status === 'done').length

  const toggleDone = async (t: Task) => {
    const next = t.status === 'done' ? 'todo' : 'done'
    try {
      await setStatus(t.id, next)
    } catch {
      /* erreur déjà capturée dans le hook */
    }
  }

  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M4.5 7l2 2 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Tâches du jour
        </div>
        <span className="w-meta">
          {doneCount}/{top5.length || 0}
        </span>
      </div>

      <div className="list" style={{ margin: '-10px -10px 0' }}>
        {loading && top5.length === 0 && (
          <div className="task-row" style={{ opacity: 0.5 }}>
            <div className="checkbox" />
            <div className="name">Chargement…</div>
          </div>
        )}

        {!loading && top5.length === 0 && (
          <div className="task-row" style={{ opacity: 0.6 }}>
            <div className="checkbox" />
            <div className="name">Aucune tâche assignée pour le moment.</div>
          </div>
        )}

        {top5.map((t) => {
          const done = t.status === 'done'
          return (
            <div
              key={t.id}
              className={`task-row ${done ? 'done' : ''}`}
              onClick={() => toggleDone(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDone(t)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className={`checkbox ${done ? 'done' : ''}`} />
              <div className="name">{t.title}</div>
              <span className={`dot-prio ${PRIO_CLASS[t.priority]}`} />
            </div>
          )
        })}
      </div>

      <Link href="/tasks" className="w-link">
        + Nouvelle tâche
      </Link>
    </div>
  )
}
