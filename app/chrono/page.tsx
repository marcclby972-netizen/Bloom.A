'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { formatTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

/**
 * Dedicated full-screen chrono page.
 *
 * Centralized, distraction-free timer view. Reads/writes the shared timer
 * from app context, so it stays in sync with the floating TimerWidget on
 * other pages. When the user starts here, the floating widget keeps running
 * across navigation.
 */
export default function ChronoPage() {
  const { timer, tasks, categories, createTimeEntry } = useApp()
  const [mounted, setMounted] = useState(false)

  // Countdown form
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('25') // pomodoro default
  const [seconds, setSeconds] = useState('0')

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">Chargement…</div>
  }

  const isRunning = timer.isRunning
  const mode = timer.mode
  const elapsed = timer.elapsed
  const display = timer.displayTime
  const taskId = timer.taskId
  const currentTask = taskId ? tasks.find((t) => t.id === taskId) : null
  const currentCat = currentTask ? categories.find((c) => c.id === currentTask.categoryId) : null

  const totalCountdown = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0)
  const countdownProgress =
    mode === 'countdown' && timer.countdownDuration > 0
      ? 1 - display / timer.countdownDuration
      : 0

  const handleSetCountdown = () => {
    if (totalCountdown > 0) {
      timer.setCountdownDuration(totalCountdown)
    }
  }

  const handleStop = () => {
    if (taskId && elapsed > 0) {
      createTimeEntry({
        taskId,
        startedAt: Date.now() - elapsed * 1000,
        endedAt: Date.now(),
        duration: elapsed,
        mode,
        countdownDuration: mode === 'countdown' ? timer.countdownDuration : undefined,
      })
    }
    timer.reset()
  }

  // ── Big circular progress ring (visual only, used in countdown) ──
  const RING_SIZE = 320
  const STROKE = 6
  const RADIUS = (RING_SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const dashOffset = mode === 'countdown'
    ? CIRC * (1 - countdownProgress)
    : 0

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 sm:px-10 lg:px-16 pt-6 pb-20 max-w-4xl mx-auto w-full">

        {/* Mode toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 rounded-full bg-secondary">
            <button
              onClick={() => timer.setMode('stopwatch')}
              className={cn(
                'h-9 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase',
                mode === 'stopwatch' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Chronomètre
            </button>
            <button
              onClick={() => timer.setMode('countdown')}
              className={cn(
                'h-9 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase',
                mode === 'countdown' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Compte à rebours
            </button>
          </div>
        </div>

        {/* Big circular display */}
        <div className="flex items-center justify-center my-12">
          <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
            {/* background ring */}
            <svg width={RING_SIZE} height={RING_SIZE} className="absolute inset-0 -rotate-90">
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth={STROKE}
              />
              {mode === 'countdown' && (
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={isRunning ? 'var(--accent)' : 'var(--foreground)'}
                  strokeWidth={STROKE}
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              )}
            </svg>

            {/* Time */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn(
                'font-light tabular-nums tracking-tight',
                'text-[clamp(3.5rem,9vw,5.5rem)] leading-none'
              )}>
                {formatTime(display)}
              </div>
              {currentTask && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-[12px]">
                  {currentCat && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentCat.color }} />
                  )}
                  <span className="truncate max-w-[180px]">{currentTask.title}</span>
                </div>
              )}
              {isRunning && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En cours
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown duration setter (only in countdown mode + not running) */}
        {mode === 'countdown' && !isRunning && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <DurationInput value={hours} onChange={setHours} suffix="h" max={23} />
            <DurationInput value={minutes} onChange={setMinutes} suffix="min" max={59} />
            <DurationInput value={seconds} onChange={setSeconds} suffix="s" max={59} />
            <button
              onClick={handleSetCountdown}
              disabled={totalCountdown === 0}
              className="ml-2 pill pill-dark text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Définir
            </button>
          </div>
        )}

        {/* Quick presets for countdown */}
        {mode === 'countdown' && !isRunning && (
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {[
              { label: 'Pomodoro 25 min', s: 25 * 60 },
              { label: 'Court 10 min', s: 10 * 60 },
              { label: 'Long 50 min', s: 50 * 60 },
              { label: '1 heure', s: 60 * 60 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => timer.setCountdownDuration(p.s)}
                className="pill text-[11px]"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <button
              onClick={() => timer.start()}
              disabled={mode === 'countdown' && timer.countdownDuration === 0}
              className="h-16 w-16 rounded-full bg-foreground text-background inline-flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
              aria-label="Démarrer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => timer.pause()}
              className="h-16 w-16 rounded-full bg-foreground text-background inline-flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
              aria-label="Pause"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={elapsed === 0 && !isRunning}
            className="h-12 px-5 rounded-full bg-secondary text-foreground inline-flex items-center gap-2 hover:bg-secondary/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop & sauvegarder
          </button>
        </div>

        {/* Helper hint */}
        <p className="text-center text-xs text-muted-foreground mt-12">
          {mode === 'stopwatch'
            ? 'Le chronomètre tourne en continu et reste actif quand tu changes de page.'
            : 'À 0, une notification est envoyée si tu l’as autorisée dans tes paramètres.'}
        </p>
      </div>
    </div>
  )
}

function DurationInput({
  value, onChange, suffix, max,
}: {
  value: string
  onChange: (v: string) => void
  suffix: string
  max: number
}) {
  return (
    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary">
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 bg-transparent text-center font-medium tabular-nums focus:outline-none text-sm"
      />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{suffix}</span>
    </label>
  )
}
