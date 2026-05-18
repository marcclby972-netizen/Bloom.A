'use client'

/**
 * Chrono v3 — minimaliste.
 * - useTimer pour state + tick + actions
 * - useProjects pour le select projet
 * - getTimeEntriesAction au mount pour la liste de la semaine
 */

import { useEffect, useState } from 'react'
import {
  useTimer, useProjects, useCurrentTeam, formatElapsed,
} from '@/hooks'
import { getTimeEntriesAction } from '@/lib/actions/time'
import type { TimeEntry } from '@/lib/v3-types'

export default function ChronoPage() {
  const team = useCurrentTeam()
  const projects = useProjects({ teamId: team.teamId ?? null })
  const timer = useTimer()

  const [projectId, setProjectId] = useState<string>('')
  const [note, setNote] = useState('')
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  // Fetch this week's entries on mount + when timer changes
  useEffect(() => {
    const load = async () => {
      const from = new Date()
      from.setDate(from.getDate() - 7)
      const r = await getTimeEntriesAction({ from: from.toISOString() })
      if (r.ok) setWeekEntries(r.data)
      setLoadingEntries(false)
    }
    void load()
  }, [timer.activeEntry?.id])

  const handleStart = async () => {
    await timer.start({
      projectId: projectId || null,
      note: note.trim() || undefined,
    })
    setNote('')
  }

  return (
    <main style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1>Chrono</h1>

      {/* Active display */}
      <section style={{ marginTop: 16 }}>
        {timer.loading && <p>…</p>}
        {!timer.loading && timer.isRunning && (
          <div>
            <p style={{ fontSize: 48, fontFamily: 'monospace' }}>
              {formatElapsed(timer.elapsedSeconds)}
            </p>
            <button onClick={() => void timer.stop()}>Stop</button>
          </div>
        )}
        {!timer.loading && !timer.isRunning && (
          <div>
            <p>Aucun timer actif.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
              <label>
                Projet (optionnel) :{' '}
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">— aucun —</option>
                  {projects.data
                    .filter((p) => p.status === 'active')
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </label>
              <input
                placeholder="note (optionnelle)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button onClick={() => void handleStart()}>Démarrer</button>
            </div>
          </div>
        )}
        {timer.error && <p style={{ color: 'crimson' }}>{timer.error.message}</p>}
      </section>

      {/* Week entries */}
      <section style={{ marginTop: 32 }}>
        <h2>7 derniers jours</h2>
        {loadingEntries && <p>…</p>}
        {!loadingEntries && weekEntries.length === 0 && <p>Aucune entrée.</p>}
        <ul>
          {weekEntries.map((e) => {
            const project = projects.data.find((p) => p.id === e.projectId)
            const duration = e.durationSeconds
              ? formatElapsed(e.durationSeconds)
              : '(en cours)'
            return (
              <li key={e.id}>
                <code>{e.startedAt.slice(0, 16).replace('T', ' ')}</code>
                {' · '}
                {duration}
                {' · '}
                {project?.name ?? '(sans projet)'}
                {e.note && ` · ${e.note}`}
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
