'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { toDateString, formatDateFr, subDays, splitTime } from '@/lib/date-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts'

type Period = '7d' | '14d' | '30d'

export default function StatsPage() {
  const { categories, tasks, timeEntries } = useApp()
  const [period, setPeriod] = useState<Period>('7d')

  const today = new Date()
  const daysCount = period === '7d' ? 7 : period === '14d' ? 14 : 30
  const startDate = toDateString(subDays(today, daysCount - 1))
  const endDate = toDateString(today)

  const catMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>()
    for (const c of categories) m.set(c.id, { name: c.name, color: c.color })
    return m
  }, [categories])

  const timeByCategory = useMemo(() => {
    const raw = store.getTotalTimeByCategory(startDate, endDate)
    return Object.entries(raw)
      .map(([catId, seconds]) => ({
        name: catMap.get(catId)?.name || 'Autre',
        color: catMap.get(catId)?.color || '#6B7280',
        value: Math.round(seconds / 60),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [startDate, endDate, catMap])

  const timeByDay = useMemo(() => {
    const raw = store.getTotalTimeByDate(startDate, endDate)
    const days: { date: string; label: string; minutes: number }[] = []
    for (let i = 0; i < daysCount; i++) {
      const d = subDays(today, daysCount - 1 - i)
      const ds = toDateString(d)
      days.push({
        date: ds,
        label: formatDateFr(d, 'dd/MM'),
        minutes: Math.round((raw[ds] || 0) / 60),
      })
    }
    return days
  }, [startDate, endDate, daysCount])

  const tasksByStatus = useMemo(() => {
    const periodTasks = tasks.filter((t) => t.date >= startDate && t.date <= endDate)
    const done = periodTasks.filter((t) => t.status === 'done').length
    const inProgress = periodTasks.filter((t) => t.status === 'in_progress').length
    const planned = periodTasks.filter((t) => t.status === 'planned').length
    return { done, inProgress, planned, total: periodTasks.length }
  }, [tasks, startDate, endDate])

  const totalMinutes = timeByCategory.reduce((s, d) => s + d.value, 0)
  const avgMinutesPerDay = daysCount > 0 ? Math.round(totalMinutes / daysCount) : 0

  const weekComparison = useMemo(() => {
    const thisWeekStart = toDateString(subDays(today, 6))
    const thisWeekEnd = endDate
    const lastWeekStart = toDateString(subDays(today, 13))
    const lastWeekEnd = toDateString(subDays(today, 7))

    const thisWeek = store.getTotalTimeByCategory(thisWeekStart, thisWeekEnd)
    const lastWeek = store.getTotalTimeByCategory(lastWeekStart, lastWeekEnd)

    const allCats = new Set([...Object.keys(thisWeek), ...Object.keys(lastWeek)])
    return Array.from(allCats).map((catId) => ({
      name: catMap.get(catId)?.name || 'Autre',
      color: catMap.get(catId)?.color || '#6B7280',
      thisSemaine: Math.round((thisWeek[catId] || 0) / 60),
      lastSemaine: Math.round((lastWeek[catId] || 0) / 60),
    }))
  }, [endDate, catMap])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Statistiques</h2>
        <div className="flex gap-1">
          {(['7d', '14d', '30d'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 jours' : p === '14d' ? '14 jours' : '30 jours'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Temps total</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeDisplay seconds={totalMinutes * 60} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Moyenne/jour</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeDisplay seconds={avgMinutesPerDay * 60} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Taches terminees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.done}<span className="text-sm text-muted-foreground font-normal">/{tasksByStatus.total}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Taux completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasksByStatus.total > 0 ? Math.round((tasksByStatus.done / tasksByStatus.total) * 100) : 0}
              <span className="text-sm text-muted-foreground font-normal ml-0.5">%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Temps par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {timeByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={timeByCategory}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={0}
                    >
                      {timeByCategory.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {timeByCategory.map((d) => {
                    const t = splitTime(d.value * 60)
                    return (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-medium">{d.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {t.h > 0 && <>{t.h}<span className="text-[10px] opacity-60">h</span> </>}
                          {t.m}<span className="text-[10px] opacity-60">m</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tendance quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" unit="min" />
                <RechartsTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                  formatter={(value) => [`${value} min`, 'Temps']}
                />
                <Line type="monotone" dataKey="minutes" stroke="oklch(0.55 0.17 50)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Comparaison semaine en cours vs précédente</CardTitle>
          </CardHeader>
          <CardContent>
            {weekComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" unit="min" />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                    formatter={(value) => [`${value} min`]}
                  />
                  <Bar dataKey="lastSemaine" name="Semaine précédente" fill="#d1d5db" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="thisSemaine" name="Cette semaine" fill="oklch(0.55 0.17 50)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TimeDisplay({ seconds }: { seconds: number }) {
  const t = splitTime(seconds)
  return (
    <div className="flex items-baseline gap-0.5 tabular-nums">
      {t.h > 0 && (
        <>
          <span className="text-2xl font-bold">{String(t.h).padStart(2, '0')}</span>
          <span className="text-xs font-medium text-primary/70 mr-1">h</span>
        </>
      )}
      <span className="text-2xl font-bold">{String(t.m).padStart(2, '0')}</span>
      <span className="text-xs font-medium text-primary/70 mr-1">m</span>
      <span className="text-lg font-semibold text-muted-foreground">{String(t.s).padStart(2, '0')}</span>
      <span className="text-[10px] font-medium text-muted-foreground/70">s</span>
    </div>
  )
}
