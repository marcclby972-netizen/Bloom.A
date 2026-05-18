'use client'

/**
 * Widget "Temps cette semaine" — KPI total + chart bar quotidien (7 jours).
 *
 * Données : `getTimeStatsAction('week')` → byDay [{ date, seconds }, …]
 * Le hook est inline ici (pas de réutilisation ailleurs).
 *
 * Le "+12%" de trend est computé vs la semaine précédente via un second
 * fetch (`from` / `to` explicites). Si vide, trend masquée.
 */

import { useEffect, useState } from 'react'
import { getTimeStatsAction, getTimeEntriesAction } from '@/lib/actions/time'
import type { TimeStats } from '@/lib/v3-types'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

function startOfWeekIso(d = new Date()): Date {
  const w = new Date(d)
  const day = w.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  w.setDate(w.getDate() + diff)
  w.setHours(0, 0, 0, 0)
  return w
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatHM(seconds: number): string {
  if (seconds === 0) return '0'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

function weekNumber(d = new Date()): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
  )
}

export function TimeWeekWidget() {
  const [stats, setStats] = useState<TimeStats | null>(null)
  const [prevTotalSec, setPrevTotalSec] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const r = await getTimeStatsAction('week')
      if (!cancelled && r.ok) setStats(r.data)

      // Semaine précédente pour le trend
      const start = startOfWeekIso()
      const prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 7)
      const prevEnd = new Date(start)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prev = await getTimeEntriesAction({
        from: isoDate(prevStart),
        to: isoDate(prevEnd),
      })
      if (!cancelled && prev.ok) {
        const totalSec = prev.data.reduce(
          (sum, e) => sum + (e.durationSeconds ?? 0),
          0
        )
        setPrevTotalSec(totalSec)
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Build 7-day buckets (Lun … Dim)
  const start = startOfWeekIso()
  const buckets = DAY_LABELS.map((label, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const iso = isoDate(d)
    const seconds = stats?.byDay.find((b) => b.date === iso)?.seconds ?? 0
    const isToday = isoDate(new Date()) === iso
    return { label, iso, seconds, isToday }
  })
  const max = Math.max(1, ...buckets.map((b) => b.seconds))
  const totalSec = stats?.totalSeconds ?? 0
  const trendPct =
    prevTotalSec != null && prevTotalSec > 0
      ? Math.round(((totalSec - prevTotalSec) / prevTotalSec) * 100)
      : null

  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M2 11h10M3 8.5L5 6l2 2 4-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Temps cette semaine
        </div>
        <span className="w-meta">Sem. {weekNumber()}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="kpi-big">{formatHM(totalSec)}</span>
        {trendPct !== null && (
          <span className={`kpi-trend ${trendPct >= 0 ? 'up' : 'down'}`}>
            {trendPct >= 0 ? '+' : ''}
            {trendPct}%
          </span>
        )}
        {loading && !stats && (
          <span className="w-meta" style={{ marginLeft: 'auto' }}>
            chargement…
          </span>
        )}
      </div>
      <div className="time-chart">
        {buckets.map((b) => (
          <div className="time-bar-col" key={b.iso}>
            <div
              className={`time-bar ${b.isToday ? 'today' : ''}`}
              style={{ height: `${Math.max(4, (b.seconds / max) * 100)}%` }}
            />
            <div className="h">{b.seconds === 0 ? '—' : formatHM(b.seconds)}</div>
            <div className="lbl">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
