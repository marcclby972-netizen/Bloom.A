'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { CONTACT_STATUSES, PLATFORMS, PROJECT_STATUSES } from '@/lib/types'
import { toDateString, formatDateFr, subDays, formatTime } from '@/lib/date-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { GoogleCalendarWidget } from '@/components/dashboard/GoogleCalendarWidget'

export default function DashboardPage() {
  const { tasks, contacts, posts, projects, categories, timeEntries, selectedDate, vocalProjects, todos } = useApp()
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
  const totalEngagement = posts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments + p.metrics.shares, 0)

  const activeProjects = projects.filter((p) => p.status === 'in_progress').length
  const ideaProjects = projects.filter((p) => p.status === 'idea').length

  const todayTodos = todos.filter((t) => !t.done && t.date === todayStr).length
  const totalActiveTodos = todos.filter((t) => !t.done).length
  const doneTodos = todos.filter((t) => t.done).length
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

  const recentPosts = posts.slice(0, 3)

  // ── Revenue stats ──
  const revenueStats = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0)
    const totalAdSpend = posts.reduce((sum, p) => sum + (p.metrics.spend || 0), 0)
    const netProfit = totalRevenue - totalAdSpend
    const byProject = projects
      .map((p) => ({ project: p, revenue: p.revenue || 0 }))
      .filter((r) => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    // MRR/ARR (recurring revenue only)
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

    // Ads vs revenue cross-data (per project)
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

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Image src="/bloom-logo.png" alt="Bloom" width={24} height={24} className="rounded" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">{formatDateFr(today, 'EEEE d MMMM yyyy')}</span>
        </div>
        <div className="h-px gradient-line" />
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Row 0: Revenue highlight — always visible */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Revenus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M2 9.5l3-3 2 2 4-5" />
                    <path d="M7 3.5h4v4" />
                  </svg>
                  Revenu total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{revenueStats.totalRevenue.toLocaleString('fr-FR')} €</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {revenueStats.byProject.length} projet{revenueStats.byProject.length > 1 ? 's' : ''} générant des revenus
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Dépenses ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{revenueStats.totalAdSpend.toFixed(0)} €</div>
                <div className="text-xs text-muted-foreground mt-1">Cumul des posts payants</div>
              </CardContent>
            </Card>
            <Card className={cn(revenueStats.netProfit >= 0 ? 'border-green-300 bg-green-50/40 dark:bg-green-950/10' : 'border-red-300 bg-red-50/40 dark:bg-red-950/10')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Bénéfice net</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('text-2xl font-bold tabular-nums', revenueStats.netProfit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                  {revenueStats.netProfit >= 0 ? '+' : ''}{revenueStats.netProfit.toLocaleString('fr-FR')} €
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Revenu - dépenses {revenueStats.totalAdSpend > 0 && `· ROI ${(((revenueStats.totalRevenue - revenueStats.totalAdSpend) / revenueStats.totalAdSpend) * 100).toFixed(0)}%`}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MRR / ARR + projection chart — always visible */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Revenu récurrent</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">MRR</CardTitle>
                <span className="text-[10px] text-muted-foreground">Revenu mensuel récurrent</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{revenueStats.totalMRR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {revenueStats.mrrByProject.length === 0
                    ? 'Aucun projet récurrent. Ajoute un type /mois sur un projet.'
                    : `${revenueStats.mrrByProject.length} projet${revenueStats.mrrByProject.length > 1 ? 's' : ''} récurrent${revenueStats.mrrByProject.length > 1 ? 's' : ''}`}
                </div>
                {revenueStats.mrrByProject.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {revenueStats.mrrByProject.slice(0, 4).map(({ project, mrr }) => (
                      <Link key={project.id} href="/projects" className="flex items-center gap-2 text-xs hover:bg-muted/50 -mx-1 px-1 rounded">
                        {project.color && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />}
                        <span className="truncate flex-1">{project.name}</span>
                        <span className="font-medium tabular-nums shrink-0">{mrr.toFixed(0)} €/mo</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">ARR</CardTitle>
                <span className="text-[10px] text-muted-foreground">Annual Recurring Revenue</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">{revenueStats.totalARR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
                <div className="text-xs text-muted-foreground mt-1">Projection sur 12 mois</div>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <div>Mensuel : <strong className="text-foreground">{revenueStats.totalMRR.toFixed(0)} €</strong></div>
                  <div>Quotidien : <strong className="text-foreground">{(revenueStats.totalMRR / 30).toFixed(2)} €</strong></div>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Projection 12 mois</CardTitle>
                <span className="text-[10px] text-muted-foreground">À MRR constant</span>
              </CardHeader>
              <CardContent>
                <MRRProjectionChart mrr={revenueStats.totalMRR} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ads vs Revenue cross-chart — always visible */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Performance ads vs revenu</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ad spend vs revenu par projet</CardTitle>
              <span className="text-[10px] text-muted-foreground">
                Croise les dépenses publicitaires (posts liés au projet) avec le revenu généré
              </span>
            </CardHeader>
            <CardContent>
              {revenueStats.adsVsRevenue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Aucun projet avec activité financière.</p>
                  <p className="text-xs mt-1">Crée un projet, ajoute-lui un revenu, et lie des posts marketing pour voir cette analyse.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {revenueStats.adsVsRevenue.map(({ project, adSpend, revenue, roi }) => (
                      <div key={project.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {project.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />}
                          <span className="truncate flex-1 font-medium">{project.name}</span>
                          {roi !== null && (
                            <span className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded',
                              roi >= 0 ? 'text-green-700 bg-green-100 dark:bg-green-950/40 dark:text-green-400' : 'text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400'
                            )}>
                              ROI {roi.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-[10px] text-muted-foreground shrink-0">Ad spend</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-red-400 dark:bg-red-500" style={{ width: `${(adSpend / maxCrossValue) * 100}%` }} />
                          </div>
                          <span className="font-medium tabular-nums shrink-0 w-16 text-right">{adSpend.toFixed(0)} €</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-[10px] text-muted-foreground shrink-0">Revenu</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${(revenue / maxCrossValue) * 100}%` }} />
                          </div>
                          <span className="font-medium tabular-nums shrink-0 w-16 text-right">{revenue.toFixed(0)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Dépenses ads</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Revenu</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 1: Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Tâches aujourd&apos;hui</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {doneTasks} terminée{doneTasks > 1 ? 's' : ''} · {inProgressTasks} en cours
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Temps cette semaine</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(totalWeekMinutes * 60)}</div>
              <div className="text-xs text-muted-foreground mt-1">{Math.round(totalWeekMinutes / 7)} min/jour en moy.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Contacts</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{pipelineStats['client'] || 0} clients · {pipelineStats['prospect'] || 0} prospects</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Posts marketing</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{totalImpressions.toLocaleString()} impressions</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Projets</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{activeProjects} en cours · {ideaProjects} idées</div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Pipeline mini */}
          <Link href="/pipeline" className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader><CardTitle className="text-sm">Pipeline CRM</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {CONTACT_STATUSES.filter((s) => s.value !== 'inactive').map((s) => (
                    <div key={s.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span>{s.label}</span>
                      </div>
                      <span className="text-sm font-medium">{pipelineStats[s.value] || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Temps par catégorie */}
          <Link href="/stats" className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader><CardTitle className="text-sm">Temps par catégorie (7j)</CardTitle></CardHeader>
              <CardContent>
                {topCategories.length > 0 ? (
                  <div className="space-y-2">
                    {topCategories.map((d) => (
                      <div key={d.cat!.id} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.cat!.color }} />
                        <span className="text-xs flex-1 truncate">{d.cat!.name}</span>
                        <span className="text-xs font-medium tabular-nums">{d.minutes} min</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min((d.minutes / (topCategories[0]?.minutes || 1)) * 100, 100)}%`, backgroundColor: d.cat!.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">Aucun temps enregistré</div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Today tasks */}
          <Link href="/calendrier" className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader><CardTitle className="text-sm">Tâches du jour</CardTitle></CardHeader>
              <CardContent>
                {todayTasks.length > 0 ? (
                  <div className="space-y-1.5">
                    {todayTasks.slice(0, 5).map((task) => {
                      const cat = categories.find((c) => c.id === task.categoryId)
                      return (
                        <div key={task.id} className="flex items-center gap-2 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                          <span className={`truncate flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                          <span className="text-muted-foreground shrink-0">{task.startTime}</span>
                        </div>
                      )
                    })}
                    {todayTasks.length > 5 && <div className="text-xs text-muted-foreground">+{todayTasks.length - 5} autres</div>}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">Aucune tâche aujourd&apos;hui</div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Optional: Google Calendar widget (only shown when connected) */}
        <GoogleCalendarWidget />

        {/* Revenue per project — only shown if any project has revenue */}
        {revenueStats.byProject.length > 0 && (
          <Link href="/projects" className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Revenus par projet</CardTitle>
                <span className="text-[10px] text-muted-foreground">{revenueStats.byProject.length} actif{revenueStats.byProject.length > 1 ? 's' : ''}</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {revenueStats.byProject.slice(0, 6).map(({ project, revenue }) => {
                    const pct = (revenue / maxProjectRevenue) * 100
                    const projectShare = revenueStats.totalRevenue > 0 ? (revenue / revenueStats.totalRevenue) * 100 : 0
                    return (
                      <div key={project.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {project.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />}
                          <span className="truncate flex-1">{project.name}</span>
                          <span className="font-medium tabular-nums shrink-0">{revenue.toLocaleString('fr-FR')} €</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 w-10 text-right">{projectShare.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: project.color || 'oklch(0.55 0.17 50)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {revenueStats.byProject.length > 6 && (
                    <div className="text-[10px] text-muted-foreground pt-1">+{revenueStats.byProject.length - 6} autres projets</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Row 3: More details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Recent posts */}
          <Link href="/marketing" className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader><CardTitle className="text-sm">Derniers posts</CardTitle></CardHeader>
              <CardContent>
                {recentPosts.length > 0 ? (
                  <div className="space-y-2">
                    {recentPosts.map((post) => {
                      const plat = PLATFORMS.find((p) => p.value === post.platform)
                      const eng = post.metrics.likes + post.metrics.comments + post.metrics.shares
                      return (
                        <div key={post.id} className="flex items-center gap-2 text-xs">
                          <span className="h-5 w-5 rounded text-white text-[8px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: plat?.color }}>{plat?.label.slice(0, 2).toUpperCase()}</span>
                          <span className="truncate flex-1">{post.title}</span>
                          <span className="text-muted-foreground shrink-0">{eng.toLocaleString()} eng.</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">Aucun post</div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Projects */}
          <Link href="/projects" className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader><CardTitle className="text-sm">Projets</CardTitle></CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-2">
                    {projects.slice(0, 4).map((p) => {
                      const status = PROJECT_STATUSES.find((s) => s.value === p.status)
                      return (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: status?.color }} />
                          <span className="truncate flex-1">{p.name}</span>
                          <span className="text-muted-foreground shrink-0">{status?.label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">Aucun projet</div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* To-Do */}
          <Link href="/todos" className="block">
            <Card className={cn(
              "transition-colors h-full",
              overdueTodos.length > 0
                ? "border-red-300 hover:border-red-400 bg-red-50/30 dark:bg-red-950/10"
                : "hover:border-primary/50"
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">To-Do</CardTitle>
                {overdueTodos.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="4" cy="4" r="3" />
                      <path d="M4 2.5v2M4 5.5v.01" />
                    </svg>
                    {overdueTodos.length} en retard
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {totalActiveTodos > 0 ? (
                  <div className="space-y-2">
                    {[...overdueTodos, ...todos.filter((t) => !t.done && !(t.date !== null && t.date < todayStr))].slice(0, 4).map((todo) => {
                      const isLate = !todo.done && todo.date !== null && todo.date < todayStr
                      return (
                        <div key={todo.id} className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{
                            backgroundColor: todo.priority === 'high' ? '#EF4444' : todo.priority === 'medium' ? '#F59E0B' : '#6B7280'
                          }} />
                          <span className={cn(
                            "truncate flex-1",
                            isLate && "text-red-600 dark:text-red-400 font-medium"
                          )}>{todo.title}</span>
                          <span className={cn(
                            "shrink-0 text-[10px]",
                            isLate ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground"
                          )}>
                            {isLate ? "Retard" : todo.date === todayStr ? "Auj." : todo.date ? todo.date.slice(5) : 'Plus tard'}
                          </span>
                        </div>
                      )
                    })}
                    {totalActiveTodos > 4 && <div className="text-xs text-muted-foreground">+{totalActiveTodos - 4} autres</div>}
                  </div>
                ) : doneTodos > 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">Tout est fait ! ({doneTodos} termine{doneTodos > 1 ? 's' : ''})</div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">Aucune tache</div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Stripe-style area chart for MRR projection over 12 months.
 * Uses pure SVG with a smooth area fill.
 */
function MRRProjectionChart({ mrr }: { mrr: number }) {
  // Generate 12 monthly data points. We assume constant MRR (no growth assumption).
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(new Date().setMonth(new Date().getMonth() + i)).toLocaleDateString('fr-FR', { month: 'short' }),
    value: mrr,
  }))
  const cumulative = months.map((m, i) => ({ ...m, total: m.value * (i + 1) }))
  const maxTotal = cumulative[cumulative.length - 1].total || 1
  const W = 280
  const H = 100
  const padX = 4
  const padY = 8
  const usableW = W - padX * 2
  const usableH = H - padY * 2

  if (mrr === 0) {
    return (
      <div className="flex items-center justify-center h-[100px] text-[10px] text-muted-foreground italic text-center px-2">
        Définis un revenu mensuel sur au moins un projet pour voir la projection.
      </div>
    )
  }

  // Build path
  const points = cumulative.map((p, i) => ({
    x: padX + (i / (cumulative.length - 1)) * usableW,
    y: padY + (1 - p.total / maxTotal) * usableH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padY + usableH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padY + usableH).toFixed(2)} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mrr-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.17 50)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.55 0.17 50)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mrr-gradient)" />
        <path d={linePath} fill="none" stroke="oklch(0.55 0.17 50)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => i % 3 === 0 && (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="oklch(0.55 0.17 50)" />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-1 px-1">
        <span>{months[0].label}</span>
        <span>{months[5].label}</span>
        <span>{months[11].label}</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        Cumul fin d&apos;année : <strong className="text-foreground tabular-nums">{(mrr * 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong>
      </div>
    </div>
  )
}
