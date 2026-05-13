'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function TimerWidget() {
  const { timer, tasks, selectedDate, createTimeEntry, categories } = useApp()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [countdownHours, setCountdownHours] = useState('0')
  const [countdownMinutes, setCountdownMinutes] = useState('30')

  useEffect(() => setMounted(true), [])

  // Use stable defaults until mounted to avoid hydration mismatch
  const taskId = mounted ? timer.taskId : null
  const isRunning = mounted ? timer.isRunning : false
  const elapsed = mounted ? timer.elapsed : 0
  const displayTime = mounted ? timer.displayTime : 0
  const timerMode = mounted ? timer.mode : 'stopwatch'
  const countdownDuration = mounted ? timer.countdownDuration : 0

  const currentTask = taskId ? tasks.find((t) => t.id === taskId) : null
  const currentCategory = currentTask
    ? categories.find((c) => c.id === currentTask.categoryId)
    : null

  const dayTasks = tasks.filter((t) => t.date === selectedDate && t.status !== 'done')

  const handleStop = () => {
    if (timer.taskId && timer.elapsed > 0) {
      createTimeEntry({
        taskId: timer.taskId,
        startedAt: Date.now() - timer.elapsed * 1000,
        endedAt: Date.now(),
        duration: timer.elapsed,
        mode: timer.mode,
        countdownDuration: timer.mode === 'countdown' ? timer.countdownDuration : undefined,
      })
    }
    timer.reset()
  }

  const handleSetCountdown = () => {
    const h = parseInt(countdownHours, 10) || 0
    const m = parseInt(countdownMinutes, 10) || 0
    const total = h * 3600 + m * 60
    if (total > 0) {
      timer.setCountdownDuration(total)
    }
  }

  const isFlashing = timerMode === 'countdown' && displayTime === 0 && elapsed > 0
  const progress = timerMode === 'countdown' && countdownDuration > 0
    ? Math.min(elapsed / countdownDuration, 1)
    : 0

  return (
    <div className="border-t border-border bg-background shrink-0 relative">
      <div className="absolute top-0 left-0 right-0 h-px gradient-line" />
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Timer display */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'font-mono text-lg font-semibold tabular-nums tracking-wider transition-colors select-none',
            isFlashing && 'animate-pulse text-red-500',
            isRunning && 'text-primary'
          )}
        >
          {formatTime(displayTime)}
        </button>

        {/* Progress ring for countdown */}
        {timerMode === 'countdown' && countdownDuration > 0 && (
          <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 -ml-1">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/40" />
            <circle
              cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
              className="text-primary"
              strokeDasharray={`${progress * 50.27} 50.27`}
              strokeLinecap="round"
              transform="rotate(-90 10 10)"
            />
          </svg>
        )}

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button
              onClick={timer.start}
              disabled={!taskId}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                taskId
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              title="Démarrer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 1.8a.8.8 0 0 1 1.2-.7l8 5.2a.8.8 0 0 1 0 1.4l-8 5.2a.8.8 0 0 1-1.2-.7V1.8Z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={timer.pause}
              className="h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all"
              title="Pause"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1.5" y="1" width="3" height="10" rx="1" />
                <rect x="7.5" y="1" width="3" height="10" rx="1" />
              </svg>
            </button>
          )}
          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-all',
              elapsed > 0
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            title="Arrêter et enregistrer"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <rect x="0" y="0" width="10" height="10" rx="2" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Current task */}
        <Popover>
          <PopoverTrigger
            render={
              <button className="flex items-center gap-2 text-xs hover:bg-muted px-2 py-1.5 rounded-md transition-colors max-w-[200px]" />
            }
          >
            {currentCategory && (
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: currentCategory.color }} />
            )}
            <span className="truncate">{currentTask ? currentTask.title : 'Choisir une tâche...'}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted-foreground">
              <path d="M2.5 4 5 6.5 7.5 4" />
            </svg>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start" side="top">
            {dayTasks.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground">Aucune tâche aujourd&apos;hui</div>
            ) : (
              dayTasks.map((task) => {
                const cat = categories.find((c) => c.id === task.categoryId)
                return (
                  <button
                    key={task.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors',
                      taskId === task.id && 'bg-muted'
                    )}
                    onClick={() => timer.setTaskId(task.id)}
                  >
                    {cat && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto text-muted-foreground">{task.startTime}</span>
                  </button>
                )
              })
            )}
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode toggle + expand */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => timer.setMode('stopwatch')}
            className={cn(
              'text-[10px] font-medium px-2 py-1 rounded transition-colors',
              timerMode === 'stopwatch' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            CHRONO
          </button>
          <button
            onClick={() => timer.setMode('countdown')}
            className={cn(
              'text-[10px] font-medium px-2 py-1 rounded transition-colors',
              timerMode === 'countdown' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            COMPTE
          </button>
        </div>

        {timerMode === 'countdown' && (
          <>
            <div className="h-5 w-px bg-border" />
            {/* Quick presets */}
            <div className="flex items-center gap-1">
              {[
                { label: '5m', seconds: 300 },
                { label: '15m', seconds: 900 },
                { label: '25m', seconds: 1500 },
                { label: '45m', seconds: 2700 },
                { label: '1h', seconds: 3600 },
                { label: '2h', seconds: 7200 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => timer.setCountdownDuration(preset.seconds)}
                  className={cn(
                    'text-[10px] font-medium px-2 py-1 rounded transition-colors',
                    countdownDuration === preset.seconds
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Custom input */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={countdownHours}
                onChange={(e) => setCountdownHours(e.target.value)}
                className="h-6 text-xs w-8 px-1 text-center"
                min={0}
                max={23}
              />
              <span className="text-[10px] text-muted-foreground">h</span>
              <Input
                type="number"
                value={countdownMinutes}
                onChange={(e) => setCountdownMinutes(e.target.value)}
                className="h-6 text-xs w-8 px-1 text-center"
                min={0}
                max={59}
              />
              <span className="text-[10px] text-muted-foreground">m</span>
              <button
                onClick={handleSetCountdown}
                className="text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded transition-colors"
              >
                OK
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
