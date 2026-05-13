'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { TimerState } from './types'
import { sendNotification, playAlertSound } from './notifications'
import { store } from './store'

const TIMER_KEY = 'bloom_timer_state'

function loadTimerState(): TimerState {
  if (typeof window === 'undefined') {
    return { isRunning: false, mode: 'stopwatch', elapsed: 0, countdownDuration: 1800, taskId: null }
  }
  const raw = localStorage.getItem(TIMER_KEY)
  if (!raw) {
    return { isRunning: false, mode: 'stopwatch', elapsed: 0, countdownDuration: 1800, taskId: null }
  }
  try {
    return JSON.parse(raw)
  } catch {
    return { isRunning: false, mode: 'stopwatch', elapsed: 0, countdownDuration: 1800, taskId: null }
  }
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(loadTimerState)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const elapsedAtStartRef = useRef<number>(0)

  const persist = useCallback((s: TimerState) => {
    localStorage.setItem(TIMER_KEY, JSON.stringify(s))
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = null
  }, [])

  const tick = useCallback(() => {
    if (!startTimeRef.current) return
    const now = Date.now()
    const newElapsed = elapsedAtStartRef.current + Math.floor((now - startTimeRef.current) / 1000)

    setState((prev) => {
      if (prev.mode === 'countdown' && newElapsed >= prev.countdownDuration) {
        stop()
        const notifSettings = store.getSettings().notifications
        if (notifSettings.timerEnd) {
          sendNotification('Timer terminé !', 'Votre countdown est terminé.')
        }
        if (notifSettings.sound) {
          playAlertSound()
        }
        const done = { ...prev, elapsed: prev.countdownDuration, isRunning: false }
        persist(done)
        return done
      }
      const updated = { ...prev, elapsed: newElapsed }
      persist(updated)
      return updated
    })
  }, [stop, persist])

  const start = useCallback(() => {
    if (intervalRef.current) return
    startTimeRef.current = Date.now()
    setState((prev) => {
      elapsedAtStartRef.current = prev.elapsed
      const updated = { ...prev, isRunning: true }
      persist(updated)
      return updated
    })
    intervalRef.current = setInterval(tick, 1000)
  }, [tick, persist])

  const pause = useCallback(() => {
    stop()
    setState((prev) => {
      const updated = { ...prev, isRunning: false }
      persist(updated)
      return updated
    })
  }, [stop, persist])

  const reset = useCallback(() => {
    stop()
    setState((prev) => {
      const updated = { ...prev, elapsed: 0, isRunning: false }
      persist(updated)
      return updated
    })
  }, [stop, persist])

  const setMode = useCallback((mode: 'stopwatch' | 'countdown') => {
    stop()
    setState((prev) => {
      const updated = { ...prev, mode, elapsed: 0, isRunning: false }
      persist(updated)
      return updated
    })
  }, [stop, persist])

  const setCountdownDuration = useCallback((seconds: number) => {
    setState((prev) => {
      const updated = { ...prev, countdownDuration: seconds }
      persist(updated)
      return updated
    })
  }, [persist])

  const setTaskId = useCallback((taskId: string | null) => {
    setState((prev) => {
      const updated = { ...prev, taskId }
      persist(updated)
      return updated
    })
  }, [persist])

  const displayTime = state.mode === 'countdown'
    ? Math.max(0, state.countdownDuration - state.elapsed)
    : state.elapsed

  useEffect(() => {
    const saved = loadTimerState()
    if (saved.isRunning) {
      startTimeRef.current = Date.now()
      elapsedAtStartRef.current = saved.elapsed
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tick])

  return {
    ...state,
    displayTime,
    start,
    pause,
    reset,
    setMode,
    setCountdownDuration,
    setTaskId,
  }
}
