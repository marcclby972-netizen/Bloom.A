'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { TODO_PRIORITIES } from '@/lib/types'
import type { TodoPriority } from '@/lib/types'
import { toDateString, formatDateFr } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type FilterTab = 'today' | 'upcoming' | 'later' | 'done'

export default function TodosPage() {
  const { todos, createTodo, updateTodo, deleteTodo } = useApp()
  const [activeTab, setActiveTab] = useState<FilterTab>('today')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TodoPriority>('medium')
  const [newDate, setNewDate] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const today = toDateString(new Date())

  const tabs: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'today',
      label: "Aujourd'hui",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 4v3l2 1.5" />
        </svg>
      ),
    },
    {
      id: 'upcoming',
      label: 'Planifie',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
          <path d="M1.5 5.5h11" />
          <path d="M4.5 1v2.5M9.5 1v2.5" />
        </svg>
      ),
    },
    {
      id: 'later',
      label: 'Plus tard',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M7 1.5v4l3 3" />
          <circle cx="7" cy="7" r="5.5" strokeDasharray="3 2" />
        </svg>
      ),
    },
    {
      id: 'done',
      label: 'Termine',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M4.5 7l2 2 3.5-4" />
        </svg>
      ),
    },
  ]

  const filteredTodos = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return todos.filter((t) => !t.done && t.date === today)
      case 'upcoming':
        return todos.filter((t) => !t.done && t.date !== null && t.date > today)
      case 'later':
        return todos.filter((t) => !t.done && t.date === null)
      case 'done':
        return todos.filter((t) => t.done)
      default:
        return []
    }
  }, [todos, activeTab, today])

  const counts = useMemo(() => ({
    today: todos.filter((t) => !t.done && t.date === today).length,
    upcoming: todos.filter((t) => !t.done && t.date !== null && t.date > today).length,
    later: todos.filter((t) => !t.done && t.date === null).length,
    done: todos.filter((t) => t.done).length,
  }), [todos, today])

  const handleAdd = () => {
    if (!newTitle.trim()) return
    const date = activeTab === 'later' ? null : (activeTab === 'upcoming' && newDate ? newDate : today)
    createTodo({
      title: newTitle.trim(),
      done: false,
      date,
      priority: newPriority,
    })
    setNewTitle('')
    setNewPriority('medium')
    setNewDate(null)
    setShowDatePicker(false)
  }

  const handleToggle = (id: string, done: boolean) => {
    updateTodo(id, { done: !done })
  }

  const handleSchedule = (id: string, date: string | null) => {
    updateTodo(id, { date })
  }

  const handlePriorityChange = (id: string, priority: TodoPriority) => {
    updateTodo(id, { priority })
  }

  const startEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title)
  }

  const confirmEdit = (id: string) => {
    if (editTitle.trim()) {
      updateTodo(id, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle('')
  }

  const totalActive = counts.today + counts.upcoming + counts.later

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="2" y="2" width="14" height="14" rx="3" />
                <path d="M5.5 9l2.5 2.5 4.5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">To-Do</h1>
              <p className="text-xs text-muted-foreground">{totalActive} tache{totalActive > 1 ? 's' : ''} en cours</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">{formatDateFr(new Date(), 'EEEE d MMMM')}</span>
        </div>
        <div className="h-px gradient-line" />
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-6 py-3 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={cn(
                'ml-0.5 text-[10px] tabular-nums px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'
              )}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Quick add */}
          {activeTab !== 'done' && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleAdd() }}
              className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 shadow-sm"
            >
              <div className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 shrink-0 ml-1" />
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  activeTab === 'today' ? "Ajouter une tache pour aujourd'hui..."
                    : activeTab === 'upcoming' ? 'Ajouter une tache planifiee...'
                      : 'Ajouter pour plus tard...'
                }
                className="border-0 shadow-none focus-visible:ring-0 text-sm px-0 h-8"
              />

              {/* Priority selector */}
              <div className="flex items-center gap-0.5 shrink-0">
                {TODO_PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setNewPriority(p.value)}
                    className={cn(
                      'h-6 w-6 rounded-md flex items-center justify-center transition-colors',
                      newPriority === p.value ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                    title={p.label}
                  >
                    <PriorityDot priority={p.value} size={newPriority === p.value ? 8 : 6} />
                  </button>
                ))}
              </div>

              {/* Date picker for upcoming tab */}
              {activeTab === 'upcoming' && (
                <>
                  <div className="h-5 w-px bg-border shrink-0" />
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <rect x="1" y="2" width="10" height="9" rx="1.5" />
                        <path d="M1 4.5h10" />
                        <path d="M3.5 0.5v2M8.5 0.5v2" />
                      </svg>
                      {newDate || 'Date'}
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-full mt-1 right-0 z-20 bg-background border border-border rounded-lg shadow-lg p-2">
                        <input
                          type="date"
                          value={newDate || ''}
                          min={today}
                          onChange={(e) => { setNewDate(e.target.value || null); setShowDatePicker(false) }}
                          className="text-xs border border-input rounded px-2 py-1"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" size="sm" disabled={!newTitle.trim()} className="shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 2v10M2 7h10" />
                </svg>
              </Button>
            </form>
          )}

          {/* Todo list */}
          {filteredTodos.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="space-y-1.5">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-all hover:shadow-sm',
                    todo.done && 'opacity-60'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(todo.id, todo.done)}
                    className={cn(
                      'h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors',
                      todo.done
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 hover:border-primary/60'
                    )}
                  >
                    {todo.done && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5l2.5 2.5 4.5-5" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => confirmEdit(todo.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(todo.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="w-full text-sm bg-transparent border-b border-primary outline-none py-0.5"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={cn('text-sm cursor-pointer', todo.done && 'line-through text-muted-foreground')}
                        onDoubleClick={() => startEdit(todo.id, todo.title)}
                      >
                        {todo.title}
                      </span>
                    )}
                    {todo.date && !todo.done && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground">
                          <rect x="1" y="1.5" width="8" height="7.5" rx="1" />
                          <path d="M1 3.5h8" />
                        </svg>
                        <span className={cn(
                          'text-[10px]',
                          todo.date === today ? 'text-primary font-medium' : 'text-muted-foreground'
                        )}>
                          {todo.date === today ? "Aujourd'hui" : formatDateFr(new Date(todo.date + 'T12:00:00'), 'EEE d MMM')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority dot */}
                  <PriorityDot priority={todo.priority} size={6} />

                  {/* Actions (visible on hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Priority cycle */}
                    <button
                      onClick={() => {
                        const order: TodoPriority[] = ['low', 'medium', 'high']
                        const next = order[(order.indexOf(todo.priority) + 1) % 3]
                        handlePriorityChange(todo.id, next)
                      }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      title="Changer priorite"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <path d="M6 1v10" />
                        <path d="M3 3.5L6 1l3 2.5" />
                      </svg>
                    </button>

                    {/* Schedule */}
                    <ScheduleButton
                      todoId={todo.id}
                      currentDate={todo.date}
                      today={today}
                      onSchedule={handleSchedule}
                    />

                    {/* Delete */}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5 5.5v3M7 5.5v3" />
                        <path d="M2.5 3l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Subcomponents ──

function PriorityDot({ priority, size = 6 }: { priority: TodoPriority; size?: number }) {
  const p = TODO_PRIORITIES.find((pp) => pp.value === priority)
  return <span className="shrink-0 rounded-full" style={{ width: size, height: size, backgroundColor: p?.color }} />
}

function ScheduleButton({ todoId, currentDate, today, onSchedule }: {
  todoId: string
  currentDate: string | null
  today: string
  onSchedule: (id: string, date: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateString(tomorrow)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = toDateString(nextWeek)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        title="Programmer"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <rect x="1" y="2" width="10" height="9" rx="1.5" />
          <path d="M1 4.5h10" />
          <path d="M3.5 0.5v2M8.5 0.5v2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-background border border-border rounded-lg shadow-lg p-1 w-44">
          <button
            onClick={() => { onSchedule(todoId, today); setOpen(false) }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left',
              currentDate === today && 'bg-muted font-medium'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => { onSchedule(todoId, tomorrowStr); setOpen(false) }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left',
              currentDate === tomorrowStr && 'bg-muted font-medium'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Demain
          </button>
          <button
            onClick={() => { onSchedule(todoId, nextWeekStr); setOpen(false) }}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left',
              currentDate === nextWeekStr && 'bg-muted font-medium'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Semaine prochaine
          </button>
          <div className="h-px bg-border my-1" />
          <div className="px-2 py-1">
            <input
              type="date"
              value={currentDate || ''}
              onChange={(e) => { onSchedule(todoId, e.target.value || null); setOpen(false) }}
              className="text-xs border border-input rounded px-2 py-1 w-full"
            />
          </div>
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => { onSchedule(todoId, null); setOpen(false) }}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            Plus tard (sans date)
          </button>
        </div>
      )}
    </div>
  )
}

function EmptyState({ tab }: { tab: FilterTab }) {
  const content = {
    today: { icon: <SunIcon />, title: "Rien pour aujourd'hui", sub: 'Ajoute une tache ou programme-en une pour maintenant' },
    upcoming: { icon: <CalendarIcon />, title: 'Rien de planifie', sub: 'Programme des taches pour les prochains jours' },
    later: { icon: <InboxIcon />, title: 'Inbox vide', sub: 'Les taches sans date arrivent ici' },
    done: { icon: <CheckCircleIcon />, title: 'Rien de termine', sub: 'Les taches completees apparaitront ici' },
  }
  const c = content[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {c.icon}
      </div>
      <p className="text-sm font-medium">{c.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.4 5.4l1 1M13.6 13.6l1 1M14.6 5.4l-1 1M6.4 13.6l-1 1" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="15" height="14" rx="2" />
      <path d="M2.5 7.5h15" />
      <path d="M6 1.5v3M14 1.5v3" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h3.5l1.5 3h4l1.5-3H17" />
      <path d="M3 10V5a2 2 0 012-2h10a2 2 0 012 2v5l-2.5 6H5.5L3 10z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.5 10l2.5 2.5 5-5.5" />
    </svg>
  )
}
