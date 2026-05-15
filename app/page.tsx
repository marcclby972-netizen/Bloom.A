'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { CONTACT_STATUSES, PLATFORMS, PROJECT_STATUSES } from '@/lib/types'
import { toDateString, formatDateFr, subDays, formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { GoogleCalendarWidget } from '@/components/dashboard/GoogleCalendarWidget'

export default function DashboardPage() {
  const { tasks, contacts, posts, projects, categories, todos } = useApp()
  const today = new Date()

  const todayStr = toDateString(today)
  const todayTasks = tasks.filter((t) => t.date === todayStr)
  const doneTasks = todayTasks.filter((t) => t.status === 'done').length
  const inProgressTasks = todayTasks.filter((t) => t.status === 'in_progress').length

  const weekStart = toDateString(subDays(today, 6))
  const weekTimeByCategory = useMemo(() => store.getTotalTimeByCategory(weekStart, todayStr), [weekStart, todayStr])
  const totalWeekMinutes = Math.round(Object.values(weekTimeByCategory).reduce((s, v) => s + v, 0) / 60)

  const pipelineStats = useMemo(() => {
    const stats: Record<string, number> = {}
    for (const s of CONTACT_STATUSES) {
      stats[s.value] = contacts.filter((c) => c.status === s.value).length
    }
    return stats
  }, [contacts])

  const totalImpressions = posts.reduce((s, p) => s + p.metrics.impressions, 0)

  const activeProjects = projects.filter((p) => p.status === 'in_progress').length

  const totalActiveTodos = todos.filter((t) => !t.done).length
  const overdueTodos = useMemo(
    () => todos.filter((t) => !t.done && t.date !== null && t.date < todayStr),
    [todos, todayStr]
  )

  const topCategories = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    return Object.entries(weekTimeByCategory)
      .map(([catId, seconds]) => ({ cat: catMap.get(catId), minutes: Math.round(seconds / 60) }))
      .filter((d) => d.cat)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
  }, [weekTimeByCategory, categories])

  const recentPosts = posts.slice(0, 4)

  // ── Revenue stats ──
  const revenueStats = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0)
    const totalAdSpend = posts.reduce((sum, p) => sum + (p.metrics.spend || 0), 0)
    const netProfit = totalRevenue - totalAdSpend
    const byProject = projects
      .map((p) => ({ project: p, revenue: p.revenue || 0 }))
      .filter((r) => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    let totalMRR = 0
    const mrrByProject: { project: typeof projects[number]; mrr: number }[] = []
    for (const p of projects) {
      const t = p.revenueType
      if (!t || t === 'one-time') continue
      const mrr = t === 'monthly' ? (p.revenue || 0)
        : t === 'quarterly' ? (p.revenue || 0) / 3
        : t === 'annual' ? (p.revenue || 0) / 12
        : 0
      if (mrr > 0) {
        totalMRR += mrr
        mrrByProject.push({ project: p, mrr })
      }
    }
    mrrByProject.sort((a, b) => b.mrr - a.mrr)
    const totalARR = totalMRR * 12

    const adsVsRevenue = projects.map((p) => {
      const projectPosts = posts.filter((post) => post.projectId === p.id || (p.linkedPostIds || []).includes(post.id))
      const adSpend = projectPosts.reduce((s, post) => s + (post.metrics.spend || 0), 0)
      const revenue = p.revenue || 0
      return { project: p, adSpend, revenue, roi: adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : null }
    }).filter((r) => r.adSpend > 0 || r.revenue > 0).sort((a, b) => (b.revenue + b.adSpend) - (a.revenue + a.adSpend))

    return { totalRevenue, totalAdSpend, netProfit, byProject, totalMRR, totalARR, mrrByProject, adsVsRevenue }
  }, [projects, posts])

  const maxProjectRevenue = revenueStats.byProject[0]?.revenue || 1
  const maxCrossValue = Math.max(...revenueStats.adsVsRevenue.flatMap((r) => [r.adSpend, r.revenue]), 1)
  const roiGlobal = revenueStats.totalAdSpend > 0
    ? ((revenueStats.totalRevenue - revenueStats.totalAdSpend) / revenueStats.totalAdSpend) * 100
    : null

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* ── Hero header ────────────────────────────────────────────── */}
      <header className="px-6 sm:px-10 lg:px-14 pt-10 sm:pt-14 pb-8 sm:pb-12">
        <p className="text-xs text-muted-foreground tracking-wide">
          {formatDateFr(today, 'EEEE d MMMM')} · semaine {Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7)}
        </p>
        <h1 className="page-title mt-2">Bon retour.</h1>
        {overdueTodos.length > 0 && (
          <p className="text-sm text-amber-500 mt-3">
            {overdueTodos.length} tâche{overdueTodos.length > 1 ? 's' : ''} en retard ·{' '}
            <Link href="/todos" className="underline underline-offset-4 hover:text-amber-400">voir</Link>
          </p>
        )}
      </header>

      <div className="px-6 sm:px-10 lg:px-14 pb-14 space-y-12 sm:space-y-16">

        {/* ── Aujourd'hui : 4 KPI dénudés ─────────────────────────── */}
        <Section title="Aujourd'hui">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 mt-6">
            <KpiInline
              num={todayTasks.length}
              label="Tâches"
              hint={`${doneTasks} fait${doneTasks > 1 ? 's' : ''} · ${inProgressTasks} en cours`}
              href="/calendrier"
            />
            <KpiInline
              num={formatTime(totalWeekMinutes * 60)}
              label="Temps cette semaine"
              hint={`${Math.round(totalWeekMinutes / 7)} min/jour`}
              href="/stats"
            />
            <KpiInline
              num={contacts.length}
              label="Contacts"
              hint={`${pipelineStats['client'] || 0} clients · ${pipelineStats['prospect'] || 0} prospects`}
              href="/contacts"
            />
            <KpiInline
              num={totalActiveTodos}
              label="To-do actifs"
              hint={overdueTodos.length > 0 ? `${overdueTodos.length} en retard` : 'À jour'}
              hintTone={overdueTodos.length > 0 ? 'warn' : 'normal'}
              href="/todos"
            />
          </div>
        </Section>

        {/* ── Revenus : 3 KPI principaux + MRR/ARR ────────────────── */}
        <Section title="Revenus" right={
          roiGlobal !== null && (
            <span className={cn(
              'text-xs tabular-nums',
              roiGlobal >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              ROI global {roiGlobal >= 0 ? '+' : ''}{roiGlobal.toFixed(0)}%
            </span>
          )
        }>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 mt-6">
            <KpiInline
              num={`${revenueStats.totalRevenue.toLocaleString('fr-FR')} €`}
              label="Revenu total"
              accent
              hint={`${revenueStats.byProject.length} projet${revenueStats.byProject.length > 1 ? 's' : ''} actif${revenueStats.byProject.length > 1 ? 's' : ''}`}
            />
            <KpiInline
              num={`${revenueStats.totalAdSpend.toFixed(0)} €`}
              label="Dépenses ads"
              hint="Cumul posts payants"
            />
            <KpiInline
              num={`${revenueStats.netProfit >= 0 ? '+' : ''}${revenueStats.netProfit.toLocaleString('fr-FR')} €`}
              label="Bénéfice net"
              hint="Revenu − dépenses"
              tone={revenueStats.netProfit >= 0 ? 'positive' : 'negative'}
            />
            <KpiInline
              num={`${revenueStats.totalMRR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`}
              label="MRR"
              hint={`ARR ${revenueStats.totalARR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`}
              accent
            />
          </div>

          {/* MRR projection — slim, no card */}
          {revenueStats.totalMRR > 0 && (
            <div className="mt-10 pt-6 border-t hairline">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Projection 12 mois à MRR constant</span>
                <span className="tabular-nums">
                  Cumul fin d&apos;année · <strong className="text-foreground">{(revenueStats.totalMRR * 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
                </span>
              </div>
              <MRRProjectionChart mrr={revenueStats.totalMRR} />
            </div>
          )}
        </Section>

        {/* ── Performance ads vs revenu — list rows ────────────────── */}
        {revenueStats.adsVsRevenue.length > 0 && (
          <Section title="Performance projet">
            <ul className="mt-6 divide-y hairline">
              {revenueStats.adsVsRevenue.map(({ project, adSpend, revenue, roi }) => (
                <li key={project.id} className="row-hover py-4 -mx-2 px-2 rounded-md">
                  <div className="flex items-center gap-3 mb-2">
                    {project.color && (
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <span className="text-sm font-medium flex-1 truncate">{project.name}</span>
                    {roi !== null && (
                      <span className={cn(
                        'text-xs tabular-nums shrink-0',
                        roi >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <DualBar label="Ads" value={adSpend} max={maxCrossValue} tone="muted" />
                    <DualBar label="Revenu" value={revenue} max={maxCrossValue} tone="primary" />
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Revenus par projet (si données) ──────────────────────── */}
        {revenueStats.byProject.length > 0 && (
          <Section title="Revenus par projet" right={
            <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voir tout →
            </Link>
          }>
            <ul className="mt-6 space-y-3">
              {revenueStats.byProject.slice(0, 6).map(({ project, revenue }) => {
                const pct = (revenue / maxProjectRevenue) * 100
                const share = revenueStats.totalRevenue > 0 ? (revenue / revenueStats.totalRevenue) * 100 : 0
                return (
                  <li key={project.id} className="space-y-1.5">
                    <div className="flex items-center gap-3 text-sm">
                      {project.color && (
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      )}
                      <span className="truncate flex-1">{project.name}</span>
                      <span className="tabular-nums text-muted-foreground text-xs">{share.toFixed(0)}%</span>
                      <span className="font-medium tabular-nums shrink-0 w-24 text-right">
                        {revenue.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="h-[3px] bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: project.color || 'var(--primary)',
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  </li>
                )
              })}
              {revenueStats.byProject.length > 6 && (
                <li className="text-xs text-muted-foreground pt-1">
                  +{revenueStats.byProject.length - 6} autres
                </li>
              )}
            </ul>
          </Section>
        )}

        {/* ── 3 colonnes : Pipeline · Temps · Tâches du jour ──────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
          {/* Pipeline */}
          <Section title="Pipeline" right={<MiniLink href="/pipeline" />}>
            <ul className="mt-5 space-y-3">
              {CONTACT_STATUSES.filter((s) => s.value !== 'inactive').map((s) => (
                <li key={s.value} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </span>
                  <span className="tabular-nums font-medium">{pipelineStats[s.value] || 0}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Temps par catégorie */}
          <Section title="Temps · 7 jours" right={<MiniLink href="/stats" />}>
            {topCategories.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {topCategories.map((d) => (
                  <li key={d.cat!.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.cat!.color }} />
                        <span className="truncate">{d.cat!.name}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground text-xs">{d.minutes} min</span>
                    </div>
                    <div className="h-[2px] bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((d.minutes / (topCategories[0]?.minutes || 1)) * 100, 100)}%`,
                          backgroundColor: d.cat!.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint>Aucun temps enregistré</EmptyHint>
            )}
          </Section>

          {/* Tâches du jour */}
          <Section title="Tâches du jour" right={<MiniLink href="/calendrier" />}>
            {todayTasks.length > 0 ? (
              <ul className="mt-5 space-y-2.5">
                {todayTasks.slice(0, 6).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      task.status === 'done' ? 'bg-emerald-500'
                      : task.status === 'in_progress' ? 'bg-primary'
                      : 'bg-muted-foreground/40'
                    )} />
                    <span className={cn('truncate flex-1', task.status === 'done' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums shrink-0">{task.startTime}</span>
                  </li>
                ))}
                {todayTasks.length > 6 && (
                  <li className="text-xs text-muted-foreground">+{todayTasks.length - 6}</li>
                )}
              </ul>
            ) : (
              <EmptyHint>Aucune tâche</EmptyHint>
            )}
          </Section>
        </div>

        {/* ── 2 colonnes : Posts · Projets ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          <Section title="Derniers posts" right={<MiniLink href="/marketing" />}>
            {recentPosts.length > 0 ? (
              <ul className="mt-5 divide-y hairline">
                {recentPosts.map((post) => {
                  const plat = PLATFORMS.find((p) => p.value === post.platform)
                  const eng = post.metrics.likes + post.metrics.comments + post.metrics.shares
                  return (
                    <li key={post.id} className="row-hover py-3 -mx-2 px-2 rounded-md">
                      <div className="flex items-center gap-3 text-sm">
                        <span
                          className="h-6 w-6 rounded text-white text-[9px] font-semibold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: plat?.color }}
                        >
                          {plat?.label.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate flex-1">{post.title}</span>
                        <span className="text-muted-foreground text-xs tabular-nums shrink-0">
                          {eng.toLocaleString()} eng.
                        </span>
                      </div>
                    </li>
                  )
                })}
                <li className="text-xs text-muted-foreground pt-2">
                  Total impressions · <strong className="text-foreground tabular-nums">{totalImpressions.toLocaleString()}</strong>
                </li>
              </ul>
            ) : (
              <EmptyHint>Aucun post</EmptyHint>
            )}
          </Section>

          <Section title="Projets" right={<MiniLink href="/projects" />}>
            {projects.length > 0 ? (
              <ul className="mt-5 divide-y hairline">
                {projects.slice(0, 5).map((p) => {
                  const status = PROJECT_STATUSES.find((s) => s.value === p.status)
                  return (
                    <li key={p.id} className="row-hover py-3 -mx-2 px-2 rounded-md">
                      <div className="flex items-center gap-3 text-sm">
                        {p.color ? (
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        ) : (
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: status?.color }} />
                        )}
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{status?.label}</span>
                      </div>
                    </li>
                  )
                })}
                <li className="text-xs text-muted-foreground pt-2">
                  {activeProjects} en cours · {projects.length} au total
                </li>
              </ul>
            ) : (
              <EmptyHint>Aucun projet</EmptyHint>
            )}
          </Section>
        </div>

        {/* Optional Google Calendar widget */}
        <GoogleCalendarWidget />
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────────

function Section({
  title, right, children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <header className="flex items-center justify-between gap-3">
        <span className="section-title">{title}</span>
        {right && <span className="shrink-0">{right}</span>}
      </header>
      {children}
    </section>
  )
}

function KpiInline({
  num, label, hint, hintTone, accent, tone, href,
}: {
  num: React.ReactNode
  label: string
  hint?: React.ReactNode
  hintTone?: 'normal' | 'warn'
  accent?: boolean
  tone?: 'positive' | 'negative'
  href?: string
}) {
  const inner = (
    <>
      <div className={cn(
        'kpi-num transition-colors',
        accent && 'text-primary',
        tone === 'positive' && 'text-emerald-400',
        tone === 'negative' && 'text-red-400',
      )}>
        {num}
      </div>
      <div className="kpi-label mt-2">{label}</div>
      {hint && (
        <div className={cn(
          'text-[11px] mt-1',
          hintTone === 'warn' ? 'text-amber-500' : 'text-muted-foreground/80'
        )}>
          {hint}
        </div>
      )}
    </>
  )
  if (href) {
    return <Link href={href} className="block group cursor-pointer">{inner}</Link>
  }
  return <div className="block group">{inner}</div>
}

function DualBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'primary' | 'muted' }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="tabular-nums text-xs font-medium">{value.toFixed(0)} €</span>
      </div>
      <div className="h-[3px] bg-muted/40 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'primary' ? 'bg-primary opacity-90' : 'bg-muted-foreground/50'
          )}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

function MiniLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      Voir →
    </Link>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 text-xs text-muted-foreground italic">
      {children}
    </div>
  )
}

/**
 * MRR projection chart — slim soft area + line, full width, no card box.
 */
function MRRProjectionChart({ mrr }: { mrr: number }) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(new Date().setMonth(new Date().getMonth() + i)).toLocaleDateString('fr-FR', { month: 'short' }),
    value: mrr,
  }))
  const cumulative = months.map((m, i) => ({ ...m, total: m.value * (i + 1) }))
  const maxTotal = cumulative[cumulative.length - 1].total || 1
  const W = 800
  const H = 80
  const padX = 0
  const padY = 8
  const usableW = W - padX * 2
  const usableH = H - padY * 2

  const points = cumulative.map((p, i) => ({
    x: padX + (i / (cumulative.length - 1)) * usableW,
    y: padY + (1 - p.total / maxTotal) * usableH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padY + usableH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padY + usableH).toFixed(2)} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mrr-gradient-soft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mrr-gradient-soft)" />
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-1">
        {months.filter((_, i) => i % 2 === 0).map((m, i) => (
          <span key={i}>{m.label}</span>
        ))}
      </div>
    </div>
  )
}
