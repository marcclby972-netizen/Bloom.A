'use client'

/**
 * Project detail — minimal v3.
 * - Affiche le projet + ses tâches
 * - Form create task
 * - Boutons archiver / supprimer (avec confirmation native)
 */

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProjects, useTasks } from '@/hooks'
import type { TaskStatus, TaskPriority } from '@/lib/v3-types'

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const router = useRouter()
  const projects = useProjects()
  const tasks = useTasks({ projectId: id })

  const project = projects.data.find((p) => p.id === id)

  const [taskTitle, setTaskTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await tasks.create({ projectId: id, title: taskTitle.trim(), priority })
      setTaskTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setCreating(false)
    }
  }

  const onArchive = async () => {
    if (!confirm('Archiver ce projet ?')) return
    await projects.archive(id)
  }

  const onDelete = async () => {
    if (!confirm('Supprimer définitivement ce projet et ses tâches ?')) return
    await projects.remove(id)
    router.push('/projects')
  }

  if (projects.loading) return <main style={{ padding: 24 }}>Chargement…</main>
  if (!project) {
    return (
      <main style={{ padding: 24 }}>
        <p>Projet introuvable.</p>
        <Link href="/projects">← Retour aux projets</Link>
      </main>
    )
  }

  const grouped: Record<TaskStatus, typeof tasks.data> = {
    todo: tasks.data.filter((t) => t.status === 'todo'),
    in_progress: tasks.data.filter((t) => t.status === 'in_progress'),
    done: tasks.data.filter((t) => t.status === 'done'),
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <p><Link href="/projects">← Projets</Link></p>
      <h1>{project.name}</h1>
      <p>Statut : <strong>{project.status}</strong></p>
      {project.description && <p>{project.description}</p>}

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        {project.status === 'active' && (
          <button onClick={onArchive}>Archiver</button>
        )}
        <button onClick={onDelete} style={{ color: 'crimson' }}>Supprimer</button>
      </div>

      {/* New task */}
      <section style={{ marginTop: 24 }}>
        <h2>Nouvelle tâche</h2>
        <form onSubmit={submitTask} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            required
            placeholder="titre"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
          <button type="submit" disabled={creating || !taskTitle.trim()}>
            {creating ? '…' : '+ Ajouter'}
          </button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </section>

      {/* Tasks by status */}
      {(['in_progress', 'todo', 'done'] as TaskStatus[]).map((status) => (
        <section key={status} style={{ marginTop: 24 }}>
          <h3>{status} ({grouped[status].length})</h3>
          <ul>
            {grouped[status].map((t) => (
              <li key={t.id}>
                <strong>{t.title}</strong> · {t.priority}
                {' '}
                {(['todo', 'in_progress', 'done'] as TaskStatus[])
                  .filter((s) => s !== t.status)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => void tasks.setStatus(t.id, s)}
                      style={{ marginLeft: 4 }}
                    >
                      → {s}
                    </button>
                  ))}
                <button
                  onClick={() => void tasks.remove(t.id)}
                  style={{ marginLeft: 4, color: 'crimson' }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
