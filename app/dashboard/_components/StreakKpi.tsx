'use client'

/**
 * StreakKpi — nombre de jours consécutifs avec au moins une entry chrono.
 *
 * Calcul : on lit les time_entries des 30 derniers jours, on extrait les
 * dates ISO (jour) où il y a eu au moins une session, puis on compte le
 * streak depuis aujourd'hui en arrière.
 *
 * Affiche 7 dots (semaine glissante) en bas : plein si tracké, vide sinon.
 */

import { useEffect, useState } from 'react'
import { KpiCard } from './KpiCard'
import { getTimeEntriesAction } from '@/lib/actions/time'

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function StreakKpi() {
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const from = new Date()
      from.setDate(from.getDate() - 30)
      const r = await getTimeEntriesAction({ from: isoDay(from) })
      if (cancelled) return
      if (r.ok) {
        const days = new Set<string>()
        for (const e of r.data) {
          days.add(isoDay(new Date(e.startedAt)))
        }
        setActiveDays(days)
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Compte le streak depuis aujourd'hui
  let streak = 0
  const cursor = new Date()
  while (activeDays.has(isoDay(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
    if (streak > 30) break // safety
  }

  // 7 derniers jours pour le sparkline
  const last7: Array<{ iso: string; active: boolean }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7.push({ iso: isoDay(d), active: activeDays.has(isoDay(d)) })
  }

  return (
    <KpiCard>
      <div className="streak-block">
        <div className="streak-num">{loading ? '…' : streak}</div>
        <div className="streak-label">jours</div>
        <div className="streak-sub">
          {streak === 0 ? "Commence aujourd'hui" : streak === 1 ? '1 jour de suite' : `${streak} jours de suite`}
        </div>
        <div className="streak-dots">
          {last7.map((d) => (
            <span
              key={d.iso}
              className={`streak-dot ${d.active ? 'on' : ''}`}
              title={d.iso}
            />
          ))}
        </div>
      </div>
    </KpiCard>
  )
}
