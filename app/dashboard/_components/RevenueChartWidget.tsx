'use client'

/**
 * RevenueChartWidget — chart line full-width façon Iko°OS.
 *
 * Données : on agrège les expenses approuvées par mois (en mode équipe)
 * OU on affiche un placeholder zéro en solo (pas de modèle de "revenu"
 * dans v3 v1 — ça viendra avec un module finance dédié).
 *
 * Toggle période : Mois / Année / Tout (limité à display pour l'instant).
 *
 * Le chart est un SVG simple (pas de lib) — line + area + grid + axe.
 */

import { useEffect, useMemo, useState } from 'react'
import { getExpensesAction } from '@/lib/actions/expenses'
import type { Expense } from '@/lib/v3-types'

type Period = 'month' | 'year' | 'all'

const PERIOD_LABEL: Record<Period, string> = {
  month: 'Mois',
  year: 'Année',
  all: 'Tout',
}

function isoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTHS_SHORT = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
] as const

export function RevenueChartWidget({ teamId }: { teamId: string | null }) {
  const [period, setPeriod] = useState<Period>('month')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!teamId) {
        setExpenses([])
        setLoading(false)
        return
      }
      const from = new Date()
      from.setFullYear(from.getFullYear() - 1)
      const r = await getExpensesAction({
        teamId,
        from: from.toISOString().slice(0, 10),
      })
      if (cancelled) return
      if (r.ok) setExpenses(r.data.filter((e) => e.status === 'approved'))
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  const series = useMemo(() => {
    // Agrège par mois
    const byMonth = new Map<string, number>()
    for (const e of expenses) {
      const k = isoMonth(new Date(e.spentAt))
      byMonth.set(k, (byMonth.get(k) ?? 0) + e.amountCents)
    }
    // Buckets : 6 derniers mois (month) / 12 (year) / all
    const count = period === 'month' ? 6 : period === 'year' ? 12 : 12
    const today = new Date()
    const buckets: Array<{ label: string; cents: number }> = []
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      const k = isoMonth(d)
      buckets.push({
        label: MONTHS_SHORT[d.getMonth()],
        cents: byMonth.get(k) ?? 0,
      })
    }
    return buckets
  }, [expenses, period])

  const max = Math.max(1000_00, ...series.map((s) => s.cents))
  const total = series.reduce((sum, s) => sum + s.cents, 0)

  // SVG path
  const W = 1000
  const H = 240
  const PAD = { top: 24, right: 16, bottom: 32, left: 16 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0
  const points = series.map((s, i) => {
    const x = PAD.left + i * stepX
    const y = PAD.top + innerH * (1 - s.cents / max)
    return { x, y, label: s.label, cents: s.cents }
  })
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L${points[0].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`
      : ''

  return (
    <div className="kpi-card kpi-card-chart">
      <div className="kpi-head">
        <div>
          <span className="kpi-label">Dépenses approuvées</span>
        </div>
        <div className="kpi-chart-actions">
          <span
            style={{
              fontSize: 11,
              color: 'var(--bloom-text-faint)',
              marginRight: 12,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {(total / 100).toLocaleString('fr-FR')} € · {series.length} mois
          </span>
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`kpi-pill ${period === p ? 'on' : ''}`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-chart-svg-wrap">
        {!teamId && (
          <div className="kpi-chart-empty">
            Le module finances arrive bientôt en mode solo.
          </div>
        )}
        {teamId && loading && (
          <div className="kpi-chart-empty">Chargement…</div>
        )}
        {teamId && !loading && total === 0 && (
          <div className="kpi-chart-empty">
            Aucune dépense approuvée sur la période.
          </div>
        )}
        {teamId && !loading && total > 0 && (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: 240, display: 'block' }}
          >
            <defs>
              <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E37520" stopOpacity="0.35" />
                <stop offset="1" stopColor="#FBBE4D" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((r) => (
              <line
                key={r}
                x1={PAD.left}
                x2={W - PAD.right}
                y1={PAD.top + innerH * r}
                y2={PAD.top + innerH * r}
                stroke="var(--bloom-border)"
                strokeDasharray="3 4"
              />
            ))}
            <path d={areaPath} fill="url(#rev-area)" />
            <path
              d={linePath}
              fill="none"
              stroke="#E37520"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p) => (
              <circle
                key={p.label + p.x}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#FBBE4D"
                stroke="var(--bloom-bg)"
                strokeWidth="1.5"
              />
            ))}
            {/* X labels */}
            {points.map((p) => (
              <text
                key={'lbl-' + p.label + p.x}
                x={p.x}
                y={H - 10}
                fontSize="11"
                fill="var(--bloom-text-muted)"
                fontFamily="var(--font)"
                textAnchor="middle"
              >
                {p.label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
