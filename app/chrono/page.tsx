'use client'

/**
 * Chrono — affichage grand format du timer en cours + sélection projet/tâche
 * pour démarrer + historique des entries de la semaine groupées par jour.
 *
 * useTimer fait le tick (1s) côté client ; start/stop appellent les server
 * actions correspondantes avec rollback optimiste.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useCurrentTeam, useProjects, useTasks, useTimer } from '@/hooks'
import { getTimeEntriesAction } from '@/lib/actions/time'
import { createTaskAction } from '@/lib/actions/tasks'
import { createProjectAction } from '@/lib/actions/projects'
import type { Project, Task, TimeEntry } from '@/lib/v3-types'

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${pad(m)}`
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(d = new Date()): Date {
  const w = new Date(d)
  const day = w.getDay()
  const diff = day === 0 ? -6 : 1 - day
  w.setDate(w.getDate() + diff)
  w.setHours(0, 0, 0, 0)
  return w
}

const DAY_LABEL = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const

export default function ChronoPage() {
  return (
    <DashboardShell screenLabel="Chrono">
      <ChronoContent />
    </DashboardShell>
  )
}

function ChronoContent() {
  const { teamId } = useCurrentTeam()
  const { activeEntry, isRunning, elapsedSeconds, start, stop, loading } =
    useTimer()
  const { data: projects } = useProjects({ teamId })
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { data: tasks } = useTasks(
    selectedProjectId ? { projectId: selectedProjectId } : {}
  )
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Inline quick-create state
  const [quickTaskMode, setQuickTaskMode] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [quickBusy, setQuickBusy] = useState(false)
  const [quickProjectMode, setQuickProjectMode] = useState(false)
  const [quickProjectName, setQuickProjectName] = useState('')

  const projectsById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  )

  // Week history
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const reloadHistory = async () => {
    setHistoryLoading(true)
    const from = isoDay(startOfWeek())
    const r = await getTimeEntriesAction({ from })
    if (r.ok) setWeekEntries(r.data)
    setHistoryLoading(false)
  }

  useEffect(() => {
    void reloadHistory()
  }, [])

  const activeProject = activeEntry?.projectId
    ? projectsById.get(activeEntry.projectId)
    : null

  const handleStart = async () => {
    if (isRunning) return
    setBusy(true)
    setError(null)
    try {
      await start({
        projectId: selectedProjectId || undefined,
        taskId: selectedTaskId || undefined,
        note: note.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de démarrer')
    } finally {
      setBusy(false)
    }
  }

  const handleStop = async () => {
    setBusy(true)
    setError(null)
    try {
      await stop()
      await reloadHistory()
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’arrêter')
    } finally {
      setBusy(false)
    }
  }

  /** Crée une tâche inline sur le projet sélectionné et la sélectionne. */
  const handleQuickCreateTask = async () => {
    if (!selectedProjectId || !quickTaskTitle.trim()) return
    setQuickBusy(true)
    setError(null)
    const r = await createTaskAction({
      projectId: selectedProjectId,
      title: quickTaskTitle.trim(),
      priority: 'medium',
    })
    setQuickBusy(false)
    if (r.ok) {
      setSelectedTaskId(r.data.id)
      setQuickTaskTitle('')
      setQuickTaskMode(false)
    } else {
      setError(r.error.message)
    }
  }

  /** Crée un projet inline (scope team courante) et le sélectionne. */
  const handleQuickCreateProject = async () => {
    if (!quickProjectName.trim()) return
    setQuickBusy(true)
    setError(null)
    const r = await createProjectAction({
      name: quickProjectName.trim(),
      teamId: teamId ?? undefined,
    })
    setQuickBusy(false)
    if (r.ok) {
      setSelectedProjectId(r.data.id)
      setSelectedTaskId('')
      setQuickProjectName('')
      setQuickProjectMode(false)
    } else {
      setError(r.error.message)
    }
  }

  // Group week entries by day
  const grouped = useMemo(() => {
    const m = new Map<string, TimeEntry[]>()
    for (const e of weekEntries) {
      const k = isoDay(new Date(e.startedAt))
      const arr = m.get(k) ?? []
      arr.push(e)
      m.set(k, arr)
    }
    const start = startOfWeek()
    const days: Array<{ iso: string; label: string; entries: TimeEntry[]; totalSec: number }> =
      []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const iso = isoDay(d)
      const entries = m.get(iso) ?? []
      const totalSec = entries.reduce(
        (sum, e) => sum + (e.durationSeconds ?? 0),
        0
      )
      days.push({
        iso,
        label: `${DAY_LABEL[d.getDay()]} ${d.getDate()}`,
        entries,
        totalSec,
      })
    }
    return days.reverse() // most recent first
  }, [weekEntries])

  const h = Math.floor(elapsedSeconds / 3600)
  const m = Math.floor((elapsedSeconds % 3600) / 60)
  const s = elapsedSeconds % 60

  return (
    <>
      <PageHeader
        eyebrow="Suivi du temps"
        title="Chrono"
        right={
          <span
            className="tag"
            style={
              isRunning
                ? { background: 'rgba(34,197,94,0.14)', color: '#15803D' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(236,236,236,0.55)' }
            }
          >
            {loading ? 'Chargement' : isRunning ? 'En cours' : 'Arrêté'}
          </span>
        }
      />

      {/* Hero chrono */}
      <div
        className="widget"
        style={{
          padding: '40px 36px',
          marginBottom: 20,
          background: isRunning
            ? 'linear-gradient(135deg, rgba(227,117,32,0.12) 0%, rgba(251,190,77,0.05) 100%)'
            : 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="chrono-display"
          style={{ fontSize: 'clamp(48px, 8vw, 96px)', textAlign: 'center', marginBottom: 14 }}
        >
          <span>{pad(h)}</span>:<span>{pad(m)}</span>:
          <span className="sec">{pad(s)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'rgba(236,236,236,0.65)',
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          {isRunning ? (
            <>
              <span className="dot" />
              <span>
                {activeProject?.name ?? 'Travail libre'}
                {activeEntry?.note ? ` · ${activeEntry.note}` : ''}
              </span>
            </>
          ) : (
            <span>Choisis un projet (optionnel) et démarre le chrono.</span>
          )}
        </div>

        {!isRunning && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              maxWidth: 720,
              margin: '0 auto 16px',
            }}
          >
            {/* PROJET — select ou input inline si quickProjectMode */}
            {quickProjectMode ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  type="text"
                  value={quickProjectName}
                  onChange={(e) => setQuickProjectName(e.target.value)}
                  placeholder="Nom du nouveau projet"
                  maxLength={120}
                  disabled={quickBusy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleQuickCreateProject()
                    }
                    if (e.key === 'Escape') {
                      setQuickProjectMode(false)
                      setQuickProjectName('')
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bloom-surface-2)',
                    border: '1px solid var(--orange-2)',
                    borderRadius: 12,
                    color: 'var(--bloom-text)',
                    padding: '12px 14px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleQuickCreateProject}
                  disabled={quickBusy || !quickProjectName.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 14px' }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickProjectMode(false)
                    setQuickProjectName('')
                  }}
                  className="btn btn-ghost-dark"
                  style={{ padding: '0 14px' }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value)
                    setSelectedTaskId('')
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bloom-surface-2)',
                    border: '1px solid var(--bloom-border)',
                    borderRadius: 12,
                    color: 'var(--bloom-text)',
                    padding: '12px 14px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">— Travail libre —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setQuickProjectMode(true)}
                  className="btn btn-ghost-dark"
                  style={{ padding: '0 14px', fontSize: 18, lineHeight: 1 }}
                  title="Créer un nouveau projet rapidement"
                >
                  +
                </button>
              </div>
            )}

            {/* TÂCHE — select ou input inline si quickTaskMode */}
            {quickTaskMode && selectedProjectId ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Nouvelle tâche…"
                  maxLength={200}
                  disabled={quickBusy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleQuickCreateTask()
                    }
                    if (e.key === 'Escape') {
                      setQuickTaskMode(false)
                      setQuickTaskTitle('')
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bloom-surface-2)',
                    border: '1px solid var(--orange-2)',
                    borderRadius: 12,
                    color: 'var(--bloom-text)',
                    padding: '12px 14px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleQuickCreateTask}
                  disabled={quickBusy || !quickTaskTitle.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 14px' }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickTaskMode(false)
                    setQuickTaskTitle('')
                  }}
                  className="btn btn-ghost-dark"
                  style={{ padding: '0 14px' }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  disabled={!selectedProjectId}
                  style={{
                    flex: 1,
                    background: 'var(--bloom-surface-2)',
                    border: '1px solid var(--bloom-border)',
                    borderRadius: 12,
                    color: 'var(--bloom-text)',
                    padding: '12px 14px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                    opacity: selectedProjectId ? 1 : 0.5,
                  }}
                >
                  <option value="">
                    {selectedProjectId ? '— Sans tâche —' : 'Choisis un projet'}
                  </option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setQuickTaskMode(true)}
                  disabled={!selectedProjectId}
                  className="btn btn-ghost-dark"
                  style={{
                    padding: '0 14px',
                    fontSize: 18,
                    lineHeight: 1,
                    opacity: selectedProjectId ? 1 : 0.4,
                    cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                  }}
                  title="Créer une nouvelle tâche rapidement"
                >
                  +
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Note libre (optionnel) — utile sans projet/tâche"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              style={{
                gridColumn: '1 / -1',
                background: 'var(--bloom-surface-2)',
                border: '1px solid var(--bloom-border)',
                borderRadius: 12,
                color: 'var(--bloom-text)',
                padding: '12px 14px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {isRunning ? (
            <button
              type="button"
              className="chrono-stop"
              onClick={handleStop}
              disabled={busy}
              style={{ minWidth: 240, justifyContent: 'center' }}
            >
              <span className="stop-ico" />
              {busy ? 'Arrêt…' : 'Arrêter le chrono'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={busy}
              style={{ minWidth: 240, justifyContent: 'center' }}
            >
              <svg width="12" height="12" viewBox="0 0 11 11" fill="currentColor">
                <path d="M2 1v9l7-4.5L2 1z" />
              </svg>
              {busy ? 'Démarrage…' : 'Démarrer le chrono'}
            </button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              marginTop: 14,
              textAlign: 'center',
              fontSize: 13,
              color: '#FCA5A5',
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Historique semaine */}
      <h2
        style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: 14,
        }}
      >
        Cette semaine
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {historyLoading && weekEntries.length === 0 && (
          <p style={{ color: 'rgba(236,236,236,0.55)', fontSize: 13 }}>
            Chargement de l&apos;historique…
          </p>
        )}
        {!historyLoading && weekEntries.length === 0 && (
          <p style={{ color: 'rgba(236,236,236,0.55)', fontSize: 13 }}>
            Aucune entrée cette semaine. Démarre ton premier chrono ↑
          </p>
        )}

        {grouped.map((day) => {
          if (day.entries.length === 0) return null
          return (
            <DayBlock
              key={day.iso}
              label={day.label}
              totalSec={day.totalSec}
              entries={day.entries}
              projectsById={projectsById}
              tasks={tasks}
            />
          )
        })}
      </div>
    </>
  )
}

function DayBlock({
  label,
  totalSec,
  entries,
  projectsById,
}: {
  label: string
  totalSec: number
  entries: TimeEntry[]
  projectsById: Map<string, Project>
  tasks: Task[]
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</strong>
        <span className="w-meta">{formatDuration(totalSec)}</span>
      </div>
      <div>
        {entries.map((e) => {
          const proj = e.projectId ? projectsById.get(e.projectId) : null
          const start = new Date(e.startedAt)
          const end = e.endedAt ? new Date(e.endedAt) : null
          const time = `${pad(start.getHours())}:${pad(start.getMinutes())}${end ? ` → ${pad(end.getHours())}:${pad(end.getMinutes())}` : ' …'}`
          return (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: 12,
                  color: 'rgba(236,236,236,0.55)',
                  minWidth: 110,
                }}
              >
                {time}
              </span>
              <span style={{ flex: 1, color: 'var(--ink)' }}>
                {proj?.name ?? 'Travail libre'}
                {e.note && (
                  <span
                    style={{
                      marginLeft: 6,
                      color: 'rgba(236,236,236,0.55)',
                    }}
                  >
                    · {e.note}
                  </span>
                )}
              </span>
              <span
                className="w-meta"
                style={{ fontSize: 12, color: 'rgba(236,236,236,0.75)' }}
              >
                {e.durationSeconds != null
                  ? formatDuration(e.durationSeconds)
                  : 'en cours'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
