'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { getWeekDays, toDateString, formatDateFr, parseISO, isToday, timeToMinutes } from '@/lib/date-utils'
import { store } from '@/lib/store'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { cn } from '@/lib/utils'

const HOUR_HEIGHT = 48
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

export function WeekView() {
  const { tasks, categories, selectedDate } = useApp()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [clickedDate, setClickedDate] = useState<string | null>(null)
  const [clickedHour, setClickedHour] = useState<string | null>(null)

  const weekStartsOn = store.getSettings().weekStartsOn as 0 | 1
  const days = useMemo(() => getWeekDays(parseISO(selectedDate), weekStartsOn), [selectedDate, weekStartsOn])

  const catMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.color)
    return m
  }, [categories])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const day of days) {
      const dateStr = toDateString(day)
      map.set(dateStr, tasks.filter((t) => t.date === dateStr))
    }
    return map
  }, [tasks, days])

  const handleSlotClick = (dateStr: string, hour: string) => {
    setEditingTask(null)
    setClickedDate(dateStr)
    setClickedHour(hour)
    setEditorOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
    setEditorOpen(true)
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="sticky top-0 z-20 flex border-b border-border bg-background">
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const dateStr = toDateString(day)
          const today = isToday(day)
          return (
            <div
              key={dateStr}
              className={cn(
                'flex-1 border-l border-border/50 px-2 py-2 text-center text-xs',
                today && 'bg-foreground/5'
              )}
            >
              <div className="text-muted-foreground uppercase">{formatDateFr(day, 'EEE')}</div>
              <div className={cn('mt-0.5 text-lg font-semibold', today && 'text-foreground')}>
                {formatDateFr(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="relative" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex border-b border-border/30"
            style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          >
            <div className="w-14 shrink-0 pr-2 pt-0.5 text-right text-[10px] text-muted-foreground">
              {hour}
            </div>
            {days.map((day) => {
              const dateStr = toDateString(day)
              return (
                <div
                  key={dateStr}
                  className="flex-1 border-l border-border/30 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => handleSlotClick(dateStr, hour)}
                />
              )
            })}
          </div>
        ))}

        {/* Task blocks */}
        {days.map((day, dayIdx) => {
          const dateStr = toDateString(day)
          const dayTasks = tasksByDay.get(dateStr) || []
          const colWidth = `calc((100% - 3.5rem) / 7)`
          const colLeft = `calc(3.5rem + (100% - 3.5rem) / 7 * ${dayIdx})`

          return dayTasks.map((task) => {
            const startMin = timeToMinutes(task.startTime)
            const endMin = timeToMinutes(task.endTime)
            const top = (startMin / 60) * HOUR_HEIGHT
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20)
            const color = catMap.get(task.categoryId) || '#6B7280'

            return (
              <div
                key={task.id}
                className="absolute z-10 cursor-pointer rounded px-1 py-0.5 text-[10px] leading-tight transition-shadow hover:shadow-md mx-0.5"
                style={{
                  top,
                  height,
                  left: colLeft,
                  width: colWidth,
                  backgroundColor: `${color}20`,
                  borderLeft: `2px solid ${color}`,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTaskClick(task)
                }}
              >
                <div className="truncate font-medium">{task.title}</div>
                {height >= 30 && (
                  <div className="text-muted-foreground truncate">{task.startTime}</div>
                )}
              </div>
            )
          })
        })}
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editingTask}
        defaultDate={clickedDate || selectedDate}
        defaultStartTime={clickedHour || undefined}
      />
    </div>
  )
}
