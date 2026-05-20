'use client'

/**
 * Stats — analytics globales (temps + tâches + projets).
 *
 * 4 sections :
 *  1. KPIs hauts : tâches terminées 7j, projets actifs, total tracké semaine,
 *     dépenses du mois (team-only).
 *  2. Temps par projet (donut basé sur stats.byProject)
 *  3. Productivité par jour de la semaine (bar chart 7 jours, agrégation
 *     time entries du dernier mois groupées par day-of-week)
 *  4. Pas d'analytics "deadlines this week" pour l'instant — viendra plus tard
 *
 * Pas de lib externe — SVG inline. Tokens v0.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useProjects, useTasks } from '@/hooks'
import { getTimeStatsAction, getTimeEntriesAction } from '@/lib/actions/time'
import { getMonthlyExpensesTotalAction } from '@/lib/actions/expenses'
import type { TimeStats, Project } from '@/lib/v3-types'

const COLORS = [
  '#FF8A1A',
  '#3B82F6',
  '#22C55E',
  '#A855F7',
  '#EAB308',
  '#EF4444',
] as const

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export default function StatsPage() {
  return (
    <DashboardShell screenLabel="Stats">
      <StatsContent />
    </DashboardShell>
  )
}

function StatsContent() {
  const { teamId, isSolo } = useDashboardShell()
  const { data: projects } = useProjects({ teamId })
  const { data: tasks } = useTasks()

  const [weekStats, setWeekStats] = useState<TimeStats | null>(null)
  const [productivityByDow, setProductivityByDow] = useState<number[]>(
    Array(7).fill(0)
  )
  const [monthlyExpensesCents, setMonthlyExpensesCents] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const stats = await getTimeStatsAction('week')

      // Productivity by day-of-week (30 derniers jours)
      const from = new Date()
      from.setDate(from.getDate() - 30)
      const entriesRes = await getTimeEntriesAction({
        from: from.toISOString().slice(0, 10),
      })

      let expensesCents = 0
      if (teamId) {
        const exp = await getMonthlyExpensesTotalAction(teamId)
        if (exp.ok) expensesCents = exp.data
      }

      if (cancelled) return

      if (stats.ok) setWeekStats(stats.data)
      if (entriesRes.ok) {
        const dow = Array<number>(7).fill(0)
        for (const e of entriesRes.data) {
          if (e.durationSeconds == null) continue
          const d = new Date(e.startedAt).getDay()
          dow[d] += e.durationSeconds
        }
        setProductivityByDow(dow)
      }
      setMonthlyExpensesCents(expensesCents)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  // ─── KPI top row ───
  const tasksDoneWeek = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return tasks.filter(
      (t) => t.status === 'done' && new Date(t.updatedAt) >= start
    ).length
  }, [tasks])
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects]
  )
  const totalWeekSec = weekStats?.totalSeconds ?? 0

  // ─── Donut par projet ───
  const projectsById = useMemo<Map<string, Project>>(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  )

  const donut = useMemo(() => {
    if (!weekStats || weekStats.totalSeconds === 0)
      return { items: [], gradient: 'conic-gradient(rgba(255,255,255,0.06) 0% 100%)' }
    const sorted = [...weekStats.byProject].sort((a, b) => b.seconds - a.seconds)
    const top = sorted.slice(0, 5)
    const restSec = sorted.slice(5).reduce((s, e) => s + e.seconds, 0)
    const items = top.map((e, i) => ({
      id: e.projectId ?? '__none',
      label: e.projectId === null ? 'Sans projet' : projectsById.get(e.projectId)?.name ?? 'Projet',
      seconds: e.seconds,
      color: COLORS[i] ?? '#9B9B9F',
    }))
    if (restSec > 0)
      items.push({
        id: '__other',
        label: 'Autres',
        seconds: restSec,
        color: COLORS[5] ?? '#9B9B9F',
      })
    let acc = 0
    const segments = items
      .map((it) => {
        const start = (acc / weekStats.totalSeconds) * 100
        acc += it.seconds
        const end = (acc / weekStats.totalSeconds) * 100
        return `${it.color} ${start}% ${end}%`
      })
      .join(', ')
    return {
      items,
      gradient: `conic-gradient(${segments})`,
    }
  }, [weekStats, projectsById])

  // ─── Productivity bar chart ───
  const maxDow = Math.max(1, ...productivityByDow)

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Statistiques"
      />

      {/* ── KPI top row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Tâches terminées"
          value={tasksDoneWeek}
          sub="cette semaine"
          loading={loading && tasksDoneWeek === 0}
        />
        <StatCard
          label="Projets actifs"
          value={activeProjects}
          sub="en cours"
          loading={loading && activeProjects === 0}
        />
        <StatCard
          label="Temps tracké"
          value={formatHours(totalWeekSec)}
          sub="cette semaine"
          loading={loading && totalWeekSec === 0}
        />
        {!isSolo && (
          <StatCard
            label="Dépenses"
            value={`${(monthlyExpensesCents / 100).toLocaleString('fr-FR')} €`}
            sub="ce mois"
            loading={loading && monthlyExpensesCents === 0}
          />
        )}
      </div>

      {/* ── 2 colonnes : donut + bars ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: 14,
        }}
      >
        {/* Donut */}
        <div
          style={{
            background: 'var(--bloom-surface)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--bloom-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Temps par projet · 7 derniers jours
          </h3>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div
              role="img"
              aria-label="Répartition du temps par projet"
              style={{
                width: 132,
                height: 132,
                borderRadius: '50%',
                background: donut.gradient,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 22,
                  borderRadius: '50%',
                  background: 'var(--bloom-surface)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--bloom-text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatHours(totalWeekSec)}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--bloom-text-faint)' }}>
                    TOTAL
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donut.items.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--bloom-text-faint)' }}>
                  Aucun temps enregistré.
                </p>
              ) : (
                donut.items.map((it) => {
                  const pct = totalWeekSec === 0 ? 0 : Math.round((it.seconds / totalWeekSec) * 100)
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: it.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          color: 'var(--bloom-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {it.label}
                      </span>
                      <span
                        style={{
                          color: 'var(--bloom-text-muted)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Productivité par jour */}
        <div
          style={{
            background: 'var(--bloom-surface)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--bloom-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Productivité par jour · 30 derniers jours
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 10,
              height: 180,
              alignItems: 'flex-end',
            }}
          >
            {productivityByDow.map((sec, i) => {
              // shift to Mon..Sun order (Lundi en 1er)
              const dayIdx = (i + 1) % 7
              const actualSec = productivityByDow[dayIdx]
              const heightPct = Math.max(4, (actualSec / maxDow) * 100)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background:
                        actualSec === 0
                          ? 'var(--bloom-surface-2)'
                          : 'linear-gradient(180deg, #FF8A1A 0%, #FBBE4D 100%)',
                      borderRadius: 6,
                      transition: 'height 200ms ease',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--bloom-text-faint)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {WEEKDAY_LABELS[dayIdx]}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--bloom-text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {actualSec === 0 ? '—' : formatHours(actualSec)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: 'var(--bloom-text-faint)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--bloom-text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          opacity: loading ? 0.4 : 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            color: 'var(--bloom-text-muted)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
