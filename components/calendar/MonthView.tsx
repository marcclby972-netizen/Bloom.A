'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { Task } from '@/lib/types'
import { getMonthDays, getWeekDayLabels, toDateString, formatDateFr, parseISO, isToday, isSameDay, startOfMonth, endOfMonth } from '@/lib/date-utils'
import { store } from '@/lib/store'
import { TaskEditor } from '@/components/tasks/TaskEditor'
import { cn } from '@/lib/utils'

export function MonthView() {
  const { tasks, categories, selectedDate, setSelectedDate } = useApp()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [clickedDate, setClickedDate] = useState<string | null>(null)

  const weekStartsOn = store.getSettings().weekStartsOn as 0 | 1
  const WEEKDAYS = getWeekDayLabels(weekStartsOn)
  const date = parseISO(selectedDate)
  const days = useMemo(() => getMonthDays(date, weekStartsOn), [selectedDate, weekStartsOn])
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)

  const catMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.color)
    return m
  }, [categories])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const existing = map.get(task.date) || []
      existing.push(task)
      map.set(task.date, existing)
    }
    return map
  }, [tasks])

  const handleDayClick = (dateStr: string) => {
    setEditingTask(null)
    setClickedDate(dateStr)
    setEditorOpen(true)
  }

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task)
    setEditorOpen(true)
  }

  const handleDayDoubleClick = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: 'calc(100vh - 12rem)' }}>
        {days.map((day) => {
          const dateStr = toDateString(day)
          const dayTasks = tasksByDay.get(dateStr) || []
          const today = isToday(day)
          const inMonth = day >= monthStart && day <= monthEnd

          return (
            <div
              key={dateStr}
              className={cn(
                'border-b border-r border-border/50 p-1 cursor-pointer hover:bg-muted/20 transition-colors min-h-24',
                !inMonth && 'opacity-40'
              )}
              onClick={() => handleDayClick(dateStr)}
              onDoubleClick={() => handleDayDoubleClick(dateStr)}
            >
              <div className={cn(
                'mb-1 text-xs font-medium',
                today && 'flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background'
              )}>
                {formatDateFr(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const color = catMap.get(task.categoryId) || '#6B7280'
                  return (
                    <div
                      key={task.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer"
                      style={{ backgroundColor: `${color}20`, borderLeft: `2px solid ${color}` }}
                      onClick={(e) => handleTaskClick(task, e)}
                    >
                      {task.title}
                    </div>
                  )
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayTasks.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editingTask}
        defaultDate={clickedDate || selectedDate}
      />
    </div>
  )
}
