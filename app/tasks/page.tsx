'use client'

/**
 * Tasks — toutes les tâches assignées à l'utilisateur courant.
 * Filtres : status (Toutes / À faire / En cours / Terminées).
 * Click checkbox → toggle done (optimiste).
 * Select status → setStatus.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useProjects, useTasks } from '@/hooks'
import type { Task, TaskPriority, TaskStatus } from '@/lib/v3-types'

const PRIO_CLASS: Record<TaskPriority, string> = {
  low: 'l',
  medium: 'm',
  high: 'h',
}

type Filter = 'all' | TaskStatus

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Toutes',
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminées',
}

export default function TasksPage() {
  return (
    <DashboardShell screenLabel="Tasks">
      <TasksContent />
    </DashboardShell>
  )
}

function TasksContent() {
  const { data: tasks, setStatus, remove, loading } = useTasks()
  const { data: projects } = useProjects()
  const [filter, setFilter] = useState<Filter>('all')

  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  )

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks]
  )

  const filtered = useMemo<Task[]>(() => {
    const arr = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
    const prioOrder = (p: TaskPriority) =>
      p === 'high' ? 0 : p === 'medium' ? 1 : 2
    const statusOrder = (s: TaskStatus) =>
      s === 'todo' ? 0 : s === 'in_progress' ? 1 : 2
    return [...arr].sort((a, b) => {
      const s = statusOrder(a.status) - statusOrder(b.status)
      if (s !== 0) return s
      return prioOrder(a.priority) - prioOrder(b.priority)
    })
  }, [tasks, filter])

  const toggleDone = async (t: Task) => {
    await setStatus(t.id, t.status === 'done' ? 'todo' : 'done').catch(() => {})
  }

  return (
    <>
      <PageHeader
        eyebrow="Mes tâches"
        title="Tâches"
        right={
          <>
            {(['all', 'todo', 'in_progress', 'done'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn ${filter === f ? '' : 'btn-ghost-dark'}`}
                onClick={() => setFilter(f)}
                style={
                  filter === f
                    ? { background: 'var(--ink)', color: '#fff' }
                    : undefined
                }
              >
                {FILTER_LABEL[f]}
                <span
                  style={{
                    opacity: 0.6,
                    marginLeft: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {counts[f]}
                </span>
              </button>
            ))}
          </>
        }
      />

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-card)',
          overflow: 'hidden',
        }}
      >
        {loading && filtered.length === 0 && (
          <div className="task-row" style={{ opacity: 0.5 }}>
            <div className="checkbox" />
            <div className="name">Chargement…</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'rgba(236,236,236,0.55)',
              fontSize: 14,
            }}
          >
            {filter === 'done'
              ? 'Aucune tâche terminée pour le moment.'
              : filter === 'all'
                ? 'Aucune tâche assignée. Crée un projet pour démarrer.'
                : 'Rien à afficher pour ce filtre.'}
          </div>
        )}

        {filtered.map((t) => {
          const done = t.status === 'done'
          const project = projectsById.get(t.projectId)
          return (
            <div
              key={t.id}
              className={`task-row ${done ? 'done' : ''}`}
              style={{
                cursor: 'default',
                alignItems: 'center',
                padding: '12px 14px',
              }}
            >
              <button
                type="button"
                className={`checkbox ${done ? 'done' : ''}`}
                onClick={() => void toggleDone(t)}
                aria-label={done ? 'Marquer non terminée' : 'Marquer terminée'}
                style={{
                  cursor: 'pointer',
                  background: 'transparent',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name" style={{ marginBottom: 2 }}>
                  {t.title}
                  {project && <span className="proj"> · {project.name}</span>}
                </div>
                {t.dueDate && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'rgba(236,236,236,0.5)',
                    }}
                  >
                    Échéance · {new Date(t.dueDate).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>

              <select
                value={t.status}
                onChange={(e) =>
                  void setStatus(t.id, e.target.value as TaskStatus).catch(() => {})
                }
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--ink)',
                  padding: '4px 8px',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>

              <span className={`dot-prio ${PRIO_CLASS[t.priority]}`} />

              {project && (
                <Link
                  href={`/projects/${project.id}`}
                  className="w-meta"
                  style={{ fontSize: 12, marginLeft: 4 }}
                >
                  →
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  if (confirm('Supprimer cette tâche ?'))
                    void remove(t.id).catch(() => {})
                }}
                title="Supprimer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(252,165,165,0.7)',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 14,
                  marginLeft: 4,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: 'rgba(236,236,236,0.55)',
        }}
      >
        Pour créer une tâche, ouvre un{' '}
        <Link
          href="/projects"
          style={{ color: 'var(--orange)', textDecoration: 'none' }}
        >
          projet
        </Link>
        .
      </p>
    </>
  )
}
