'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { getHoursArray, timeToMinutes } from '@/lib/date-utils'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { cn } from '@/lib/utils'

const HOUR_HEIGHT = 64
const HOURS = getHoursArray()

export function DayView() {
  const { tasks, categories, selectedDate, timer, updateTask } = useApp()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [clickedHour, setClickedHour] = useState<string | null>(null)

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

  return (
    <div className="flex-1 overflow-auto">
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
          const startMin = timeToMinutes(task.startTime)
          const endMin = timeToMinutes(task.endTime)
          const top = (startMin / 60) * HOUR_HEIGHT
          const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24)
          const color = catMap.get(task.categoryId) || '#6B7280'

          return (
            <div
              key={task.id}
              className={cn(
                'absolute left-[4.5rem] right-3 z-10 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs transition-shadow hover:shadow-md',
                task.status === 'done' && 'opacity-60'
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
                e.stopPropagation()
                handleTaskClick(task)
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={cn('font-medium truncate', task.status === 'done' && 'line-through')}>
                    {task.title}
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
