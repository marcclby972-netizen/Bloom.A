'use client'

/**
 * Tasks page — tâches assignées au current user across all projects.
 * Filter par status via 3 boutons. Click sur status → toggle (optimistic).
 */

import { useState } from 'react'
import { useTasks } from '@/hooks'
import type { TaskStatus } from '@/lib/v3-types'

type Filter = 'all' | TaskStatus

export default function TasksPage() {
  const tasks = useTasks()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all'
    ? tasks.data
    : tasks.data.filter((t) => t.status === filter)

  const counts = {
    all: tasks.data.length,
    todo: tasks.data.filter((t) => t.status === 'todo').length,
    in_progress: tasks.data.filter((t) => t.status === 'in_progress').length,
    done: tasks.data.filter((t) => t.status === 'done').length,
  }

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Mes tâches</h1>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {tasks.loading && <p>…</p>}
      {tasks.error && <p style={{ color: 'crimson' }}>{tasks.error.message}</p>}
      {!tasks.loading && filtered.length === 0 && (
        <p style={{ marginTop: 16 }}>Aucune tâche.</p>
      )}

      <ul style={{ marginTop: 16 }}>
        {filtered.map((t) => (
          <li key={t.id} style={{ marginBottom: 6 }}>
            <button
              onClick={() => void tasks.setStatus(t.id, nextStatus[t.status])}
              title={`→ ${nextStatus[t.status]}`}
            >
              [{t.status}]
            </button>
            {' '}
            <strong>{t.title}</strong>
            {t.priority !== 'medium' && ` · ${t.priority}`}
            {t.dueDate && ` · ${t.dueDate}`}
          </li>
        ))}
      </ul>
    </main>
  )
}
