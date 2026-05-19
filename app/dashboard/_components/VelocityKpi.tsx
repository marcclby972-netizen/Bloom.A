'use client'

/**
 * VelocityKpi — vélocité tâches : nombre de tâches terminées cette semaine.
 *
 * Calcul : on lit toutes les tâches assignées au user, on garde celles
 * `status === 'done'` dont `updatedAt` est dans la semaine en cours (lundi
 * → maintenant).
 *
 * On affiche aussi la diff vs semaine précédente quand dispo.
 */

import { useMemo } from 'react'
import { KpiCard, KpiSeeMore } from './KpiCard'
import { useTasks } from '@/hooks'

function startOfWeek(d = new Date()): Date {
  const w = new Date(d)
  const day = w.getDay()
  const diff = day === 0 ? -6 : 1 - day
  w.setDate(w.getDate() + diff)
  w.setHours(0, 0, 0, 0)
  return w
}

export function VelocityKpi() {
  const { data: tasks, loading } = useTasks()

  const { thisWeek, prevWeek } = useMemo(() => {
    const start = startOfWeek().getTime()
    const prevStart = start - 7 * 86400_000
    let thisWeek = 0
    let prevWeek = 0
    for (const t of tasks) {
      if (t.status !== 'done') continue
      const updated = new Date(t.updatedAt).getTime()
      if (updated >= start) thisWeek++
      else if (updated >= prevStart) prevWeek++
    }
    return { thisWeek, prevWeek }
  }, [tasks])

  const diff = thisWeek - prevWeek

  return (
    <KpiCard
      title="Vélocité tâches"
      rightAction={
        <span style={{ fontSize: 11, color: 'var(--bloom-text-faint)' }}>
          {loading ? '…' : `${thisWeek} cette semaine`}
        </span>
      }
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div className="kpi-value">{thisWeek}</div>
        {!loading && prevWeek > 0 && (
          <span
            className={`kpi-trend ${diff >= 0 ? 'up' : 'down'}`}
            style={{ fontSize: 12 }}
          >
            {diff >= 0 ? '+' : ''}
            {diff}
          </span>
        )}
      </div>
      <div className="kpi-sub" style={{ marginTop: 8 }}>
        {thisWeek === 0
          ? 'Aucune tâche terminée cette semaine'
          : `${thisWeek} tâche${thisWeek > 1 ? 's' : ''} terminée${thisWeek > 1 ? 's' : ''}`}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <KpiSeeMore href="/tasks" />
      </div>
    </KpiCard>
  )
}
