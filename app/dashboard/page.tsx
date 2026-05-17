'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { CONTACT_STATUSES, PROJECT_STATUSES } from '@/lib/types'
import { toDateString, formatDateFr, subDays, formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

/**
 * Dashboard cockpit — voir /guideline.md §6.
 *
 * Layout actuel : top bar (salutation + Personnaliser) + grille 12 cols
 * de widgets. La vraie sidebar 72px à gauche viendra dans un commit dédié
 * (refactor AppShell partagé avec toutes les pages app).
 *
 * Widgets MVP : Agenda · Tâches · Chrono · Charge équipe · Décisions ·
 * Équilibre associés · Alertes Iris · + Ajouter un widget.
 *
 * Les widgets équipe/décisions/équilibre/alertes utilisent encore des
 * données mock — la DB Supabase pour les organisations n'est pas wirée
 * côté web (voir migration 20260517_organizations.sql).
 */
export default function DashboardPage() {
  const { tasks, contacts, projects, todos, categories } = useApp()
  const today = new Date()

  // Mounted gate — useApp() lit localStorage, indispo en SSR.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const todayStr = toDateString(today)
  const greeting = useMemo(() => {
    const h = today.getHours()
    if (h < 6) return 'Bonne nuit'
    if (h < 13) return 'Bonjour'
    if (h < 18) return "Bon après-midi"
    return 'Bonsoir'
  }, [today])

  if (!mounted) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="px-6 sm:px-10 lg:px-14 pt-6 pb-20 max-w-[1400px] mx-auto w-full">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 sm:px-10 lg:px-14 pt-6 pb-20 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <div className="overline">BloomCo · vue d&apos;ensemble</div>
            <h1 className="h-section mt-1.5">
              {greeting}, Marc
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-on-dark-muted)' }}>
              {formatDateFr(today, 'EEEE d MMMM yyyy')}
            </p>
          </div>
          <button className="btn-ghost" style={{ height: '2.5rem', padding: '0 1rem', fontSize: '0.8125rem' }}>
            + Personnaliser
          </button>
        </header>

        {/* Widget grid — 12 cols on lg */}
        <div className="grid grid-cols-12 gap-4 lg:gap-5 auto-rows-min stagger-children">
          <WidgetAgenda tasks={tasks} categories={categories} />
          <WidgetTasks tasks={tasks} todos={todos} todayStr={todayStr} />
          <WidgetChrono />

          <WidgetTeamLoad />
          <WidgetDecisions />

          <WidgetEquityBalance />
          <WidgetIris />

          <WidgetContacts contacts={contacts} />
          <WidgetProjects projects={projects} />

          <AddWidgetButton />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-72 rounded-md animate-pulse" style={{ background: 'var(--bg-surface-elev)' }} />
      <div className="grid grid-cols-12 gap-4">
        {[4, 4, 4, 6, 6, 6, 6, 12].map((cols, i) => (
          <div
            key={i}
            className="card-deep h-[200px] animate-pulse"
            style={{ gridColumn: `span ${cols} / span ${cols}` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Widget shell
// ─────────────────────────────────────────────────────────────

function Widget({
  title, badge, cols, children, footer,
}: {
  title: string
  badge?: React.ReactNode
  cols: number  // 1..12
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section
      className="card-deep card-deep-hover p-5 flex flex-col"
      style={{ gridColumn: `span ${cols} / span ${cols}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="h-subsection text-base font-semibold">{title}</h2>
          {badge}
        </div>
        <button
          aria-label="Options"
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/5"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ color: 'var(--ink-on-dark-subtle)' }}>
            <circle cx="3" cy="7" r="1" />
            <circle cx="7" cy="7" r="1" />
            <circle cx="11" cy="7" r="1" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      {footer && (
        <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
          {footer}
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Personal widgets (wired to useApp)
// ─────────────────────────────────────────────────────────────

type Task = ReturnType<typeof useApp>['tasks'][number]
type TodoItem = ReturnType<typeof useApp>['todos'][number]
type Category = ReturnType<typeof useApp>['categories'][number]
type Contact = ReturnType<typeof useApp>['contacts'][number]
type Project = ReturnType<typeof useApp>['projects'][number]

function WidgetAgenda({ tasks, categories }: { tasks: Task[]; categories: Category[] }) {
  const todayStr = toDateString(new Date())
  const dayTasks = tasks
    .filter((t) => t.date === todayStr)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    .slice(0, 5)
  const catMap = new Map(categories.map((c) => [c.id, c]))
  return (
    <Widget
      title="Agenda du jour"
      cols={4}
      footer={
        <Link href="/calendrier" className="hover:opacity-80" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Voir le calendrier →
        </Link>
      }
    >
      {dayTasks.length === 0 ? (
        <EmptyState icon="📅" label="Aucun créneau" />
      ) : (
        <ul className="space-y-2.5">
          {dayTasks.map((t) => {
            const cat = catMap.get(t.categoryId)
            return (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs tabular-nums shrink-0 w-12" style={{ color: 'var(--ink-on-dark-subtle)' }}>
                  {t.startTime || '—'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat?.color || 'var(--accent-solid)' }} />
                <span className="truncate flex-1" style={{ color: 'var(--ink-on-dark-primary)' }}>
                  {t.title}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Widget>
  )
}

function WidgetTasks({ tasks, todos, todayStr }: { tasks: Task[]; todos: TodoItem[]; todayStr: string }) {
  const todayTasks = tasks.filter((t) => t.date === todayStr)
  const done = todayTasks.filter((t) => t.status === 'done').length
  const activeTodos = todos.filter((t) => !t.done).length

  return (
    <Widget
      title="Tâches du jour"
      cols={4}
      footer={
        <Link href="/todos" className="hover:opacity-80" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Voir la to-do →
        </Link>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="kpi-display" style={{ color: 'var(--ink-on-dark-primary)' }}>
          {done}<span style={{ color: 'var(--ink-on-dark-subtle)' }}>/{todayTasks.length}</span>
        </span>
      </div>
      <p className="text-sm mt-2" style={{ color: 'var(--ink-on-dark-muted)' }}>
        {done === todayTasks.length && todayTasks.length > 0 ? 'Tout est fait ✓' : `${todayTasks.length - done} restantes`}
      </p>
      <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: todayTasks.length > 0 ? `${(done / todayTasks.length) * 100}%` : '0%',
            background: 'var(--accent-gradient)',
          }}
        />
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--ink-on-dark-subtle)' }}>
        + {activeTodos} todo{activeTodos > 1 ? 's' : ''} actif{activeTodos > 1 ? 's' : ''}
      </p>
    </Widget>
  )
}

function WidgetChrono() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <Widget title="Chrono global" cols={4}>
      <div className="flex flex-col items-center justify-center py-2">
        <div
          className="kpi-display tabular-nums"
          style={{ color: running ? 'var(--accent-solid)' : 'var(--ink-on-dark-primary)' }}
        >
          {fmt(seconds)}
        </div>
        <div className="flex gap-2 mt-4">
          {!running ? (
            <button onClick={() => setRunning(true)} className="btn-cta" style={{ height: '2.25rem', padding: '0 1rem', fontSize: '0.8125rem' }}>
              ▶ Démarrer
            </button>
          ) : (
            <>
              <button onClick={() => setRunning(false)} className="btn-ghost" style={{ height: '2.25rem', padding: '0 1rem', fontSize: '0.8125rem' }}>
                ⏸ Pause
              </button>
              <button
                onClick={() => { setRunning(false); setSeconds(0) }}
                className="btn-ghost"
                style={{ height: '2.25rem', padding: '0 1rem', fontSize: '0.8125rem' }}
              >
                ◼ Stop
              </button>
            </>
          )}
        </div>
        {!running && seconds === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--ink-on-dark-subtle)' }}>
            Aucun projet sélectionné
          </p>
        )}
      </div>
    </Widget>
  )
}

// ─────────────────────────────────────────────────────────────
// Team widgets (mock until orgs are wired)
// ─────────────────────────────────────────────────────────────

function WidgetTeamLoad() {
  const members = [
    { name: 'Marc', hours: 34, color: '#E37520' },
    { name: 'Alex', hours: 18, color: '#FBBE4D' },
  ]
  const total = members.reduce((s, m) => s + m.hours, 0)
  return (
    <Widget
      title="Charge équipe"
      badge={<span className="tag-micro" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--ink-on-dark-muted)' }}>7 jours</span>}
      cols={6}
    >
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.name}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span style={{ color: 'var(--ink-on-dark-primary)' }}>{m.name}</span>
              <span className="tabular-nums" style={{ color: 'var(--ink-on-dark-muted)' }}>
                {m.hours} h <span style={{ color: 'var(--ink-on-dark-subtle)' }}>· {Math.round((m.hours / total) * 100)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${(m.hours / total) * 100}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs" style={{ color: 'var(--ink-on-dark-subtle)' }}>
        Données mock — connecte l&apos;organisation pour le réel.
      </div>
    </Widget>
  )
}

function WidgetDecisions() {
  const decisions = [
    { title: 'Achat Macbook Pro', amount: '2 400 €', tag: 'critique', votes: '1/2' },
    { title: 'Distribution mensuelle', amount: '—', tag: 'règle', votes: '0/2' },
    { title: 'Notion Team upgrade', amount: '180 €', tag: 'normal', votes: '2/2' },
  ]
  return (
    <Widget
      title="Décisions à voter"
      badge={
        <span className="tag-micro tag-micro-accent" style={{ height: '1.25rem', padding: '0 0.5rem', fontSize: '0.625rem' }}>
          3
        </span>
      }
      cols={6}
      footer={<span style={{ color: 'var(--ink-on-dark-muted)' }}>Voir toutes les décisions →</span>}
    >
      <ul className="space-y-2.5">
        {decisions.map((d) => (
          <li key={d.title} className="flex items-center justify-between gap-3 text-sm py-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate" style={{ color: 'var(--ink-on-dark-primary)' }}>{d.title}</span>
                {d.tag === 'critique' && (
                  <span className="tag-micro tag-micro-accent shrink-0" style={{ height: '1.125rem', padding: '0 0.4rem', fontSize: '0.5625rem' }}>
                    CRITIQUE
                  </span>
                )}
              </div>
              <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--ink-on-dark-subtle)' }}>
                {d.amount} · {d.votes} votes
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

function WidgetEquityBalance() {
  const members = [
    { name: 'Marc', pct: 70, color: '#E37520' },
    { name: 'Alex', pct: 30, color: '#FBBE4D' },
  ]
  const imbalance = Math.abs(members[0].pct - members[1].pct) > 20
  return (
    <Widget
      title="Équilibre associés"
      cols={6}
      footer={
        <span style={{ color: 'var(--ink-on-dark-muted)' }}>
          Contributions ce mois ·{' '}
          <span className="iris-pulse inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: 'var(--accent-solid)' }} />
          Iris suit
        </span>
      }
    >
      {/* Stacked bar */}
      <div className="flex h-10 rounded-md overflow-hidden mb-4">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-center text-xs font-semibold"
            style={{
              width: `${m.pct}%`,
              background: m.color,
              color: '#111',
            }}
          >
            {m.pct}%
          </div>
        ))}
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            <span style={{ color: 'var(--ink-on-dark-primary)' }}>{m.name}</span>
            <span className="ml-auto tabular-nums" style={{ color: 'var(--ink-on-dark-muted)' }}>
              {m.pct === 70 ? '98 h' : '42 h'}
            </span>
          </div>
        ))}
      </div>

      {imbalance && (
        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2.5"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <span className="text-[#FCD34D] text-sm shrink-0">⚠</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#FCD34D' }}>
              Déséquilibre &gt; 20%
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--ink-on-dark-muted)' }}>
              Pensez à organiser un point d&apos;équipe.
            </div>
          </div>
        </div>
      )}
    </Widget>
  )
}

function WidgetIris() {
  return (
    <Widget
      title="Alertes Iris"
      badge={<span className="iris-pulse w-2 h-2 rounded-full" style={{ background: 'var(--accent-solid)' }} />}
      cols={6}
      footer={<span style={{ color: 'var(--ink-on-dark-muted)' }}>Ouvrir Iris →</span>}
    >
      <div className="space-y-3">
        <AlertItem
          severity="warning"
          text="Marc a fait 70% des heures sur 4 semaines."
          when="il y a 2 h"
        />
        <AlertItem
          severity="info"
          text="3 décisions en attente depuis plus de 48 h."
          when="hier"
        />
        <AlertItem
          severity="info"
          text="Résumé hebdo prêt — 12 contributions analysées."
          when="lundi"
        />
      </div>
    </Widget>
  )
}

function AlertItem({ severity, text, when }: { severity: 'info' | 'warning' | 'critical'; text: string; when: string }) {
  const colors = {
    info: { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD' },
    warning: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D' },
    critical: { bg: 'rgba(239,68,68,0.12)', text: '#FCA5A5' },
  } as const
  const c = colors[severity]
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text }} />
      <div className="flex-1 min-w-0">
        <p style={{ color: 'var(--ink-on-dark-primary)' }}>{text}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ink-on-dark-subtle)' }}>{when}</p>
      </div>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
        style={{ background: c.bg, color: c.text }}
      >
        {severity === 'critical' ? 'crit' : severity}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Bonus widgets (existing data wired)
// ─────────────────────────────────────────────────────────────

function WidgetContacts({ contacts }: { contacts: Contact[] }) {
  const stats: Record<string, number> = {}
  for (const s of CONTACT_STATUSES) {
    stats[s.value] = contacts.filter((c) => c.status === s.value).length
  }
  return (
    <Widget
      title="Pipeline"
      cols={6}
      footer={
        <Link href="/pipeline" className="hover:opacity-80" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Voir le pipeline →
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {CONTACT_STATUSES.filter((s) => s.value !== 'inactive').map((s) => (
          <div
            key={s.value}
            className="p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs" style={{ color: 'var(--ink-on-dark-muted)' }}>{s.label}</span>
            </div>
            <div className="text-xl font-semibold tabular-nums" style={{ color: 'var(--ink-on-dark-primary)' }}>
              {stats[s.value] || 0}
            </div>
          </div>
        ))}
      </div>
    </Widget>
  )
}

function WidgetProjects({ projects }: { projects: Project[] }) {
  const items = projects.slice(0, 5)
  return (
    <Widget
      title="Projets"
      cols={6}
      footer={
        <Link href="/projects" className="hover:opacity-80" style={{ color: 'var(--ink-on-dark-muted)' }}>
          Voir les projets →
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState icon="📦" label="Aucun projet" />
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border-on-dark-deep)' }}>
          {items.map((p) => {
            const status = PROJECT_STATUSES.find((s) => s.value === p.status)
            return (
              <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color || status?.color || 'var(--accent-solid)' }} />
                <span className="truncate flex-1" style={{ color: 'var(--ink-on-dark-primary)' }}>{p.name}</span>
                <span className="text-xs" style={{ color: 'var(--ink-on-dark-subtle)' }}>{status?.label || p.status}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Widget>
  )
}

// ─────────────────────────────────────────────────────────────
// Add widget tile
// ─────────────────────────────────────────────────────────────

function AddWidgetButton() {
  return (
    <button
      className={cn(
        'col-span-12 lg:col-span-12 rounded-[var(--radius-lg)]',
        'flex items-center justify-center gap-2 h-16 text-sm font-medium transition-all',
      )}
      style={{
        border: '1px dashed var(--border-on-dark-deep)',
        color: 'var(--ink-on-dark-muted)',
        background: 'transparent',
      }}
    >
      <span style={{ color: 'var(--accent-solid)' }}>+</span>
      Ajouter un widget
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-3xl mb-2 opacity-50">{icon}</div>
      <p className="text-sm" style={{ color: 'var(--ink-on-dark-subtle)' }}>{label}</p>
    </div>
  )
}
