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
