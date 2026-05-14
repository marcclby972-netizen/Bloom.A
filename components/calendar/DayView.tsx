'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { getHoursArray, timeToMinutes, minutesToTime } from '@/lib/date-utils'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { cn } from '@/lib/utils'

const HOUR_HEIGHT = 64
const HOURS = getHoursArray()

export function DayView() {
  const { tasks, categories, selectedDate, timer, updateTask } = useApp()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [clickedHour, setClickedHour] = useState<string | null>(null)
  const [resizingTaskId, setResizingTaskId] = useState<string | null>(null)
  const [resizePreview, setResizePreview] = useState<{ startMin: number; endMin: number } | null>(null)
  const resizeRef = useRef<{ taskId: string; mode: 'top' | 'bottom'; startY: number; startMin: number; endMin: number } | null>(null)

  // Snap to 15-minute increments
  const snapMinutes = (mins: number) => Math.round(mins / 15) * 15

  useEffect(() => {
    if (!resizingTaskId) return
    const handleMove = (e: MouseEvent) => {
      const ctx = resizeRef.current
      if (!ctx) return
      const deltaY = e.clientY - ctx.startY
      const deltaMin = (deltaY / HOUR_HEIGHT) * 60
      if (ctx.mode === 'top') {
        const newStart = snapMinutes(Math.max(0, Math.min(ctx.endMin - 15, ctx.startMin + deltaMin)))
        setResizePreview({ startMin: newStart, endMin: ctx.endMin })
      } else {
        const newEnd = snapMinutes(Math.min(24 * 60, Math.max(ctx.startMin + 15, ctx.endMin + deltaMin)))
        setResizePreview({ startMin: ctx.startMin, endMin: newEnd })
      }
    }
    const handleUp = () => {
      const ctx = resizeRef.current
      const preview = resizePreview
      if (ctx && preview) {
        updateTask(ctx.taskId, {
          startTime: minutesToTime(preview.startMin),
          endTime: minutesToTime(preview.endMin),
        })
      }
      resizeRef.current = null
      setResizingTaskId(null)
      setResizePreview(null)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [resizingTaskId, resizePreview, updateTask])

  const startResize = (e: React.MouseEvent, task: Task, mode: 'top' | 'bottom') => {
    e.stopPropagation()
    e.preventDefault()
    const startMin = timeToMinutes(task.startTime)
    const endMin = timeToMinutes(task.endTime)
    resizeRef.current = { taskId: task.id, mode, startY: e.clientY, startMin, endMin }
    setResizingTaskId(task.id)
    setResizePreview({ startMin, endMin })
  }

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate),
    [tasks, selectedDate]
  )

  const catMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.color)
    return m
  }, [categories])

  const catNameMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.name)
    return m
  }, [categories])

  const handleSlotClick = (hour: string) => {
    setEditingTask(null)
    setClickedHour(hour)
    setEditorOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
    setClickedHour(null)
    setEditorOpen(true)
  }

  const handleStartTask = (task: Task) => {
    updateTask(task.id, { status: 'in_progress' })
    timer.setTaskId(task.id)
    if (!timer.isRunning) timer.start()
  }

  const handleCompleteTask = (task: Task) => {
    updateTask(task.id, { status: 'done' })
    if (timer.taskId === task.id) {
      timer.pause()
      timer.setTaskId(null)
    }
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isToday = selectedDate === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Scroll to current hour (or 9am for past/future days) on mount + when day changes
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const targetMinutes = isToday
      ? currentMinutes
      : 8 * 60 // 8 AM for non-today days
    const scrollTop = (targetMinutes / 60) * HOUR_HEIGHT - container.clientHeight / 3
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto">
      <div className="relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
        {/* Time grid */}
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
            style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            onClick={() => handleSlotClick(hour)}
          >
            <div className="w-16 shrink-0 pr-3 pt-1 text-right text-xs text-muted-foreground">
              {hour}
            </div>
            <div className="flex-1 border-l border-border/30" />
          </div>
        ))}

        {/* Current time indicator */}
        {isToday && (
          <div
            className="absolute left-16 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: (currentMinutes / (24 * 60)) * (HOURS.length * HOUR_HEIGHT) }}
          >
            <div className="h-2.5 w-2.5 -ml-1.5 rounded-full bg-red-500" />
            <div className="h-px flex-1 bg-red-500" />
          </div>
        )}

        {/* Task blocks */}
        {dayTasks.map((task) => {
          const isResizing = resizingTaskId === task.id
          const effStartMin = isResizing && resizePreview ? resizePreview.startMin : timeToMinutes(task.startTime)
          const effEndMin = isResizing && resizePreview ? resizePreview.endMin : timeToMinutes(task.endTime)
          const top = (effStartMin / 60) * HOUR_HEIGHT
          const height = Math.max(((effEndMin - effStartMin) / 60) * HOUR_HEIGHT, 24)
          const color = catMap.get(task.categoryId) || '#6B7280'

          return (
            <div
              key={task.id}
              className={cn(
                'group/task absolute left-[4.5rem] right-3 z-10 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs transition-shadow hover:shadow-md',
                task.status === 'done' && 'opacity-60',
                isResizing && 'shadow-lg ring-2 ring-primary/40 z-30'
              )}
              style={{
                top,
                height,
                backgroundColor: `${color}12`,
                borderColor: `${color}40`,
                borderLeftWidth: 3,
                borderLeftColor: color,
              }}
              onClick={(e) => {
                if (isResizing) return
                e.stopPropagation()
                handleTaskClick(task)
              }}
            >
              {/* Top resize handle */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover/task:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, task, 'top')}
                style={{ backgroundColor: color }}
              />
              {/* Bottom resize handle */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover/task:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, task, 'bottom')}
                style={{ backgroundColor: color }}
              />
              {/* Live time preview during resize */}
              {isResizing && resizePreview && (
                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-mono shadow z-40">
                  {minutesToTime(resizePreview.startMin)} – {minutesToTime(resizePreview.endMin)}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={cn('font-medium truncate flex items-center gap-1', task.status === 'done' && 'line-through')}>
                    {task.linkedTodoId && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0" aria-label="To-do lié">
                        <rect x="1" y="1" width="8" height="8" rx="1.5" />
                        <path d="M3 5l1.5 1.5L7 4" />
                      </svg>
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {task.startTime} - {task.endTime}
                    {catNameMap.has(task.categoryId) && (
                      <span className="ml-1.5">· {catNameMap.get(task.categoryId)}</span>
                    )}
                  </div>
                </div>
                {height >= 40 && (
                  <div className="flex shrink-0 gap-1">
                    {task.status !== 'done' && task.status !== 'in_progress' && (
                      <button
                        className="rounded p-0.5 hover:bg-black/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartTask(task)
                        }}
                        title="Démarrer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        className="rounded p-0.5 hover:bg-black/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteTask(task)
                        }}
                        title="Terminer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {task.tags.length > 0 && height >= 56 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <span key={tag} className="rounded bg-black/5 px-1 py-0.5 text-[10px]">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editingTask}
        defaultDate={selectedDate}
        defaultStartTime={clickedHour || undefined}
      />
    </div>
  )
}
