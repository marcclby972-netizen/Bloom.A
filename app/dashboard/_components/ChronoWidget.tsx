'use client'

/**
 * Widget "Chrono actif" — affichage live des HH:MM:SS de l'entry en cours,
 * label projet/tâche, bouton "Arrêter le chrono" → `useTimer().stop`.
 *
 * Si aucun timer actif → état vide avec CTA "Démarrer un chrono".
 */

import Link from 'next/link'
import type { Project, Task } from '@/lib/v3-types'
import { useTimer } from '@/hooks'

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

export function ChronoWidget({
  projectsById,
  tasksById,
}: {
  projectsById: Map<string, Project>
  tasksById: Map<string, Task>
}) {
  const { activeEntry, isRunning, elapsedSeconds, stop, loading } = useTimer()

  const h = Math.floor(elapsedSeconds / 3600)
  const m = Math.floor((elapsedSeconds % 3600) / 60)
  const s = elapsedSeconds % 60

  const project =
    activeEntry?.projectId != null ? projectsById.get(activeEntry.projectId) : null
  const task = activeEntry?.taskId != null ? tasksById.get(activeEntry.taskId) : null

  const statusLabel = isRunning
    ? task
      ? `${project?.name ?? 'Projet'} · ${task.title}`
      : project
        ? project.name
        : 'Travail libre'
    : 'Aucun chrono en cours'

  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M7 5.5v2.5l1.6 1.2M7 2v1.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Chrono actif
        </div>
        <span
          className="tag"
          style={
            isRunning
              ? { background: 'rgba(34,197,94,0.14)', color: '#15803D' }
              : { background: 'rgba(0,0,0,0.06)', color: 'rgba(17,17,17,0.55)' }
          }
        >
          {isRunning ? 'En cours' : loading ? 'Chargement' : 'Arrêté'}
        </span>
      </div>

      <div className="chrono-display">
        <span>{pad(h)}</span>:<span>{pad(m)}</span>:
        <span className="sec">{pad(s)}</span>
      </div>

      <div className="chrono-status">
        <span className="dot" />
        {statusLabel}
      </div>

      {isRunning ? (
        <button
          type="button"
          className="chrono-stop"
          onClick={() => void stop().catch(() => {})}
        >
          <span className="stop-ico" />
          Arrêter le chrono
        </button>
      ) : (
        <Link
          href="/chrono"
          className="chrono-stop"
          style={{ background: 'var(--ink)', color: '#fff', textDecoration: 'none' }}
        >
          <svg width="10" height="10" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true">
            <path d="M2 1v9l7-4.5L2 1z" />
          </svg>
          Démarrer un chrono
        </Link>
      )}
    </div>
  )
}
