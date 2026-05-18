'use client'

/**
 * Widget "Répartition temps" — donut + légende, distribution du temps par
 * projet sur les 7 derniers jours (`getTimeStatsAction('week').byProject`).
 *
 * Le donut CSS du HTML reference utilise `conic-gradient(...)` via la classe
 * `.donut` — on l'override en inline pour refléter la distribution réelle.
 */

import { useEffect, useState } from 'react'
import { getTimeStatsAction } from '@/lib/actions/time'
import type { Project, TimeStats } from '@/lib/v3-types'

const COLORS = [
  '#E37520',
  '#FBBE4D',
  '#2B4F6F',
  '#6B3FA0',
  '#C13C5C',
  '#3B6E47',
] as const

export function TimeBreakdownWidget({
  projectsById,
}: {
  projectsById: Map<string, Project>
}) {
  const [stats, setStats] = useState<TimeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void getTimeStatsAction('week').then((r) => {
      if (cancelled) return
      if (r.ok) setStats(r.data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const total = stats?.totalSeconds ?? 0
  // Top 5 projets + bucket "Autres"
  const sorted = (stats?.byProject ?? [])
    .slice()
    .sort((a, b) => b.seconds - a.seconds)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5).reduce((sum, e) => sum + e.seconds, 0)

  const items: Array<{ id: string; label: string; seconds: number; color: string }> =
    top.map((e, i) => ({
      id: e.projectId ?? 'unaffected',
      label:
        e.projectId === null
          ? 'Sans projet'
          : projectsById.get(e.projectId)?.name ?? 'Projet inconnu',
      seconds: e.seconds,
      color: COLORS[i] ?? '#999',
    }))
  if (rest > 0) {
    items.push({
      id: '__other',
      label: 'Autres',
      seconds: rest,
      color: COLORS[5] ?? '#999',
    })
  }

  // Build conic-gradient string
  let acc = 0
  const segments = items
    .map((it) => {
      const start = total === 0 ? 0 : (acc / total) * 100
      acc += it.seconds
      const end = total === 0 ? 0 : (acc / total) * 100
      return `${it.color} ${start}% ${end}%`
    })
    .join(', ')
  const donutBg =
    total === 0
      ? 'conic-gradient(rgba(0,0,0,0.06) 0% 100%)'
      : `conic-gradient(${segments})`

  return (
    <div className="widget w-span-4">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 2v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Répartition temps
        </div>
        <span className="w-meta">7 derniers jours</span>
      </div>
      <div className="donut-wrap">
        <div
          className="donut"
          style={{ background: donutBg }}
          aria-label="Répartition du temps par projet"
        />
        <div className="donut-leg">
          {loading && items.length === 0 && (
            <div className="item" style={{ opacity: 0.5 }}>
              Chargement…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="item" style={{ opacity: 0.6 }}>
              Aucun temps enregistré cette semaine.
            </div>
          )}
          {items.map((it) => {
            const pct = total === 0 ? 0 : Math.round((it.seconds / total) * 100)
            return (
              <div className="item" key={it.id}>
                <span className="sw" style={{ background: it.color }} /> {it.label}{' '}
                <span className="pct">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
