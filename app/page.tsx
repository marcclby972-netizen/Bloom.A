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

  const weekStart = toDateString(subDays(today, 6))
  const weekTimeByCategory = useMemo(
    () => store.getTotalTimeByCategory(weekStart, todayStr),
    [weekStart, todayStr]
  )
  const totalWeekMinutes = Math.round(
    Object.values(weekTimeByCategory).reduce((s, v) => s + v, 0) / 60
  )

  const pipelineStats = useMemo(() => {
    const stats: Record<string, number> = {}
    for (const s of CONTACT_STATUSES) {
      stats[s.value] = contacts.filter((c) => c.status === s.value).length
    }
    return stats
  }, [contacts])

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
    for (const p of projects) {
      const t = p.revenueType
      if (!t || t === 'one-time') continue
      const mrr = t === 'monthly' ? (p.revenue || 0)
        : t === 'quarterly' ? (p.revenue || 0) / 3
        : t === 'annual' ? (p.revenue || 0) / 12
        : 0
      if (mrr > 0) totalMRR += mrr
    }

    return { totalRevenue, totalAdSpend, netProfit, byProject, totalMRR, totalARR: totalMRR * 12 }
  }, [projects, posts])

  const maxProjectRevenue = revenueStats.byProject[0]?.revenue || 1

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 sm:px-10 lg:px-16 pt-6 pb-20 max-w-7xl mx-auto w-full">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="text-center pt-10 pb-16">
          <p className="text-sm text-muted-foreground tracking-wide mb-4">
            {formatDateFr(today, 'EEEE d MMMM yyyy')}
          </p>
          <h1 className="h-display">
            Bon retour. <span className="h-accent">Voici ta journée.</span>
          </h1>
          {overdueTodos.length > 0 && (
            <Link
              href="/todos"
              className="inline-flex items-center gap-2 mt-6 pill bg-amber-100 text-amber-900 hover:bg-amber-200"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {overdueTodos.length} tâche{overdueTodos.length > 1 ? 's' : ''} en retard →
            </Link>
          )}
        </header>

        {/* ── Numbered KPI grid (Teplin style) ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <NumberedCard num="/01" href="/calendrier" icon={<IconCheck />} title="Tâches" kpi={String(todayTasks.length)}>
            {doneTasks} fait{doneTasks > 1 ? 's' : ''} · {todayTasks.length - doneTasks} restant
          </NumberedCard>
          <NumberedCard num="/02" href="/stats" icon={<IconClock />} title="Cette semaine" kpi={formatTime(totalWeekMinutes * 60)}>
            {Math.round(totalWeekMinutes / 7)} min/jour en moyenne
          </NumberedCard>
          <NumberedCard num="/03" href="/contacts" icon={<IconUsers />} title="Contacts" kpi={String(contacts.length)}>
            {pipelineStats['client'] || 0} clients · {pipelineStats['prospect'] || 0} prospects
          </NumberedCard>
          <NumberedCard num="/04" href="/todos" icon={<IconList />} title="To-Do actifs" kpi={String(totalActiveTodos)}>
            {overdueTodos.length > 0
              ? <span className="text-amber-600 font-medium">{overdueTodos.length} en retard</span>
              : 'À jour'}
          </NumberedCard>
        </div>

        {/* ── Revenus — section éditoriale ──────────────────────── */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <h2 className="h-section">
              Tes <span className="h-accent">revenus</span> ce mois
            </h2>
            <Link href="/projects" className="pill text-xs">
              Voir tous les projets →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Total revenue — featured card with subtle accent */}
            <div className="soft-card p-7 lg:col-span-2">
              <p className="card-num mb-4">/ TOTAL</p>
              <div className="flex items-end gap-3 mb-2">
                <div className="kpi-display">{revenueStats.totalRevenue.toLocaleString('fr-FR')} €</div>
                {revenueStats.netProfit !== 0 && (
                  <span className={cn(
                    'mb-2 text-sm font-medium tabular-nums',
                    revenueStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {revenueStats.netProfit >= 0 ? '+' : ''}{revenueStats.netProfit.toLocaleString('fr-FR')} € net
                  </span>
                )}
              </div>
              <p className="kpi-display-label">
                {revenueStats.byProject.length} projet{revenueStats.byProject.length > 1 ? 's' : ''} actif{revenueStats.byProject.length > 1 ? 's' : ''}
                {revenueStats.totalAdSpend > 0 && ` · ${revenueStats.totalAdSpend.toFixed(0)} € dépensés en ads`}
              </p>

              {/* Top projects bars */}
              {revenueStats.byProject.length > 0 && (
                <div className="mt-7 space-y-3">
                  {revenueStats.byProject.slice(0, 4).map(({ project, revenue }) => {
                    const pct = (revenue / maxProjectRevenue) * 100
                    return (
                      <div key={project.id} className="space-y-1.5">
                        <div className="flex items-center gap-3 text-sm">
                          {project.color && (
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                          )}
                          <span className="truncate flex-1 font-medium">{project.name}</span>
                          <span className="font-semibold tabular-nums shrink-0 text-foreground">
                            {revenue.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: project.color || 'currentColor' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* MRR card */}
            <div className="soft-card p-7 flex flex-col">
              <p className="card-num mb-4">/ MRR</p>
              <div className="kpi-display">{revenueStats.totalMRR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
              <p className="kpi-display-label">
                {revenueStats.totalMRR > 0
                  ? <>ARR <strong className="text-foreground tabular-nums">{revenueStats.totalARR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong></>
                  : 'Aucun revenu récurrent encore'}
              </p>

              {revenueStats.totalMRR > 0 && (
                <div className="mt-auto pt-6 text-xs text-muted-foreground">
                  À MRR constant, projection 12 mois ≈
                  <div className="text-foreground font-semibold tabular-nums text-base mt-1">
                    {(revenueStats.totalMRR * 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 3 colonnes Pipeline · Temps · Tâches ──────────────── */}
        <section className="mb-16">
          <h2 className="h-section mb-8">
            Vue <span className="h-accent">d&apos;ensemble</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SoftListCard num="/01" title="Pipeline" href="/pipeline">
              {CONTACT_STATUSES.filter((s) => s.value !== 'inactive').map((s) => (
                <li key={s.value} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </span>
                  <span className="tabular-nums font-semibold text-foreground">{pipelineStats[s.value] || 0}</span>
                </li>
              ))}
            </SoftListCard>

            <SoftListCard num="/02" title="Temps · 7 jours" href="/stats">
              {topCategories.length > 0 ? (
                topCategories.map((d) => (
                  <li key={d.cat!.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.cat!.color }} />
                        <span className="truncate">{d.cat!.name}</span>
                      </span>
                      <span className="tabular-nums text-xs font-medium">{d.minutes} min</span>
                    </div>
                    <div className="h-[2px] bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((d.minutes / (topCategories[0]?.minutes || 1)) * 100, 100)}%`,
                          backgroundColor: d.cat!.color,
                        }}
                      />
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic">Aucun temps enregistré</li>
              )}
            </SoftListCard>

            <SoftListCard num="/03" title="Tâches du jour" href="/calendrier">
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      task.status === 'done' ? 'bg-emerald-500'
                      : task.status === 'in_progress' ? 'bg-accent'
                      : 'bg-muted-foreground/40'
                    )} />
                    <span className={cn('truncate flex-1', task.status === 'done' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums shrink-0">{task.startTime}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic">Aucune tâche aujourd&apos;hui</li>
              )}
            </SoftListCard>
          </div>
        </section>

        {/* ── Posts + Projets ───────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="h-section mb-8">
            <span className="h-accent">Activité</span> récente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SoftListCard num="/01" title="Derniers posts" href="/marketing">
              {posts.length > 0 ? (
                posts.slice(0, 4).map((post) => {
                  const plat = PLATFORMS.find((p) => p.value === post.platform)
                  const eng = post.metrics.likes + post.metrics.comments + post.metrics.shares
                  return (
                    <li key={post.id} className="flex items-center gap-3 text-sm">
                      <span
                        className="h-7 w-7 rounded-md text-white text-[9px] font-semibold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: plat?.color }}
                      >
                        {plat?.label.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate flex-1">{post.title}</span>
                      <span className="text-muted-foreground text-xs tabular-nums shrink-0">{eng.toLocaleString()}</span>
                    </li>
                  )
                })
              ) : (
                <li className="text-xs text-muted-foreground italic">Aucun post</li>
              )}
            </SoftListCard>

            <SoftListCard num="/02" title="Projets" href="/projects">
              {projects.length > 0 ? (
                projects.slice(0, 5).map((p) => {
                  const status = PROJECT_STATUSES.find((s) => s.value === p.status)
                  return (
                    <li key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color || status?.color }} />
                      <span className="truncate flex-1">{p.name}</span>
                      <span className="tag-pill shrink-0">{status?.label}</span>
                    </li>
                  )
                })
              ) : (
                <li className="text-xs text-muted-foreground italic">Aucun projet</li>
              )}
            </SoftListCard>
          </div>
        </section>

        {/* Optional Google Calendar widget */}
        <GoogleCalendarWidget />
      </div>
    </div>
  )
}

// ── Subcomponents ────────────────────────────────────────────────

/**
 * Numbered KPI card — Teplin style with /01 number, dark icon square,
 * title, KPI display, and small hint at bottom.
 */
function NumberedCard({
  num, icon, title, kpi, children, href,
}: {
  num: string
  icon: React.ReactNode
  title: string
  kpi: string
  children?: React.ReactNode
  href?: string
}) {
  const inner = (
    <div className="soft-card soft-card-hover p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <span className="card-num">{num}</span>
        <span className="icon-square" aria-hidden>{icon}</span>
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1.5">{title}</p>
      <div className="kpi-display">{kpi}</div>
      {children && <p className="kpi-display-label mt-auto pt-3">{children}</p>}
    </div>
  )
  if (href) return <Link href={href} className="block group">{inner}</Link>
  return inner
}

/**
 * Soft card containing a list — used for Pipeline, Temps, Posts, Projets.
 */
function SoftListCard({
  num, title, href, children,
}: {
  num: string
  title: string
  href?: string
  children: React.ReactNode
}) {
  const inner = (
    <div className="soft-card soft-card-hover p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="card-num">{num}</p>
          <h3 className="text-base font-semibold mt-0.5">{title}</h3>
        </div>
        {href && (
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            →
          </span>
        )}
      </div>
      <ul className="space-y-3">{children}</ul>
    </div>
  )
  if (href) return <Link href={href} className="block group">{inner}</Link>
  return inner
}

// ── Icons ───────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5l2 2 4-4" />
      <path d="M4 13.5l2 2 4-4" />
      <path d="M14 7h4" />
      <path d="M14 14h4" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5v5l3 2" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M3.5 17c0-3 2.9-5.5 6.5-5.5s6.5 2.5 6.5 5.5" />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h2M3 10h2M3 15h2" />
      <path d="M8 5h9M8 10h9M8 15h9" />
    </svg>
  )
}
