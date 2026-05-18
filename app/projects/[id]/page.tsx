'use client'

/**
 * Project detail — 3 colonnes kanban (To-do / In progress / Done) avec
 * boutons de transition de status. Création de tâche inline en haut.
 *
 * Actions disponibles : archiver, supprimer (avec confirm).
 */

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DashboardShell,
  PageHeader,
} from '../../dashboard/_components/DashboardShell'
import { useProjects, useTasks } from '@/hooks'
import type { Task, TaskPriority, TaskStatus } from '@/lib/v3-types'

const PRIO_LABEL: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}
const PRIO_CLASS: Record<TaskPriority, string> = {
  low: 'l',
  medium: 'm',
  high: 'h',
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
}

export default function ProjectDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(props.params)
  return (
    <DashboardShell screenLabel="Project detail">
      <ProjectDetailContent projectId={id} />
    </DashboardShell>
  )
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const router = useRouter()
  const projects = useProjects()
  const tasks = useTasks({ projectId })

  const project = projects.data.find((p) => p.id === projectId)

  const [taskTitle, setTaskTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grouped = useMemo<Record<TaskStatus, Task[]>>(
    () => ({
      todo: tasks.data.filter((t) => t.status === 'todo'),
      in_progress: tasks.data.filter((t) => t.status === 'in_progress'),
      done: tasks.data.filter((t) => t.status === 'done'),
    }),
    [tasks.data]
  )

  const totalCount = tasks.data.length
  const doneCount = grouped.done.length
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setError(null)
    setBusy(true)
    try {
      await tasks.create({
        projectId,
        title: taskTitle.trim(),
        priority,
      })
      setTaskTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setBusy(false)
    }
  }

  const onArchive = async () => {
    if (!confirm('Archiver ce projet ?')) return
    await projects.archive(projectId)
  }
  const onDelete = async () => {
    if (!confirm('Supprimer définitivement ce projet et ses tâches ?')) return
    await projects.remove(projectId)
    router.push('/projects')
  }

  if (projects.loading && !project) {
    return <p style={{ color: 'rgba(236,236,236,0.55)' }}>Chargement…</p>
  }

  if (!project) {
    return (
      <>
        <PageHeader
          eyebrow="Erreur"
          title="Projet introuvable"
          right={
            <Link href="/projects" className="btn btn-ghost-dark">
              ← Retour
            </Link>
          }
        />
        <p style={{ color: 'rgba(236,236,236,0.55)' }}>
          Ce projet a peut-être été archivé ou supprimé.
        </p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={
          project.status === 'archived' ? 'Archivé' : project.teamId ? 'Équipe' : 'Solo'
        }
        title={project.name}
        right={
          <>
            <Link href="/projects" className="btn btn-ghost-dark">
              ← Projets
            </Link>
            {project.status === 'active' && (
              <button
                type="button"
                className="btn btn-ghost-dark"
                onClick={onArchive}
              >
                Archiver
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost-dark"
              onClick={onDelete}
              style={{ color: '#FCA5A5' }}
            >
              Supprimer
            </button>
          </>
        }
      />

      {project.description && (
        <p
          style={{
            color: 'rgba(236,236,236,0.65)',
            fontSize: 14,
            lineHeight: 1.55,
            marginBottom: 16,
            maxWidth: 720,
          }}
        >
          {project.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 14,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-card)',
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(236,236,236,0.5)',
              marginBottom: 4,
            }}
          >
            Progression
          </div>
          <div className="bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1,
          }}
        >
          {pct}%
        </div>
        <div
          style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)', marginLeft: 4 }}
        >
          {doneCount}/{totalCount} tâche{totalCount > 1 ? 's' : ''}
        </div>
      </div>

      {/* Inline create task */}
      <form
        onSubmit={submitTask}
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-card)',
          padding: 12,
          marginBottom: 20,
        }}
      >
        <input
          type="text"
          placeholder="Nouvelle tâche…"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          required
          maxLength={200}
          style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--ink)',
            padding: '10px 12px',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--ink)',
            padding: '10px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {(Object.keys(PRIO_LABEL) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              Priorité {PRIO_LABEL[p]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !taskTitle.trim()}
        >
          {busy ? '…' : '+ Ajouter'}
        </button>
        {error && (
          <span role="alert" style={{ fontSize: 13, color: '#FCA5A5' }}>
            {error}
          </span>
        )}
      </form>

      {/* Kanban */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={grouped[status]}
            onMove={(taskId, next) => void tasks.setStatus(taskId, next)}
            onRemove={(taskId) => {
              if (confirm('Supprimer cette tâche ?')) void tasks.remove(taskId)
            }}
          />
        ))}
      </div>
    </>
  )
}

function KanbanColumn({
  status,
  tasks,
  onMove,
  onRemove,
}: {
  status: TaskStatus
  tasks: Task[]
  onMove: (id: string, next: TaskStatus) => void
  onRemove: (id: string) => void
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
        padding: 14,
        minHeight: 240,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {STATUS_LABEL[status]}
        </h3>
        <span className="w-meta">{tasks.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.length === 0 && (
          <p
            style={{
              fontSize: 12.5,
              color: 'rgba(236,236,236,0.4)',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            Aucune tâche
          </p>
        )}

        {tasks.map((t) => {
          const otherStatuses = STATUS_ORDER.filter((s) => s !== status)
          return (
            <div
              key={t.id}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  className={`dot-prio ${PRIO_CLASS[t.priority]}`}
                  style={{ marginTop: 5 }}
                />
                <div
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    textDecoration: status === 'done' ? 'line-through' : undefined,
                    opacity: status === 'done' ? 0.7 : 1,
                  }}
                >
                  {t.title}
                </div>
              </div>
              <div
                style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}
              >
                {otherStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onMove(t.id, s)}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'rgba(236,236,236,0.65)',
                      cursor: 'pointer',
                    }}
                  >
                    → {STATUS_LABEL[s]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onRemove(t.id)}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: '#FCA5A5',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                  title="Supprimer la tâche"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
