'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getActiveTimerAction, startTimerAction, stopTimerAction,
} from '@/lib/actions/time'
import type { TimeEntry, ServiceError } from '@/lib/v3-types'

/**
 * Local tick + server sync timer hook.
 *
 * Behavior:
 *  - On mount, fetches the active timer (if any) and starts ticking.
 *  - `start({ projectId?, taskId? })` → optimistic local update +
 *    server insert. If a timer was already running, server stops it first
 *    automatically (idempotence on same project+task).
 *  - `stop()` → optimistic local stop + server update.
 *  - `elapsedSeconds` updates every second while running (no server call).
 *
 * Returns:
 *  - `activeEntry`: current entry or null
 *  - `isRunning`: derived from activeEntry.endedAt
 *  - `elapsedSeconds`: live counter, computed from startedAt
 *  - `start(input)`, `stop()`: mutations
 *  - `loading`, `error`, `refetch`
 */
export function useTimer() {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  // Tick interval ref (so we can clear/restart on entry change)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRunning = activeEntry !== null && activeEntry.endedAt === null

  // ── Tick management ───────────────────────────────────────────

  const startTicking = useCallback((startedAt: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const startedMs = new Date(startedAt).getTime()
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
      setElapsedSeconds(seconds)
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
  }, [])

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => stopTicking, [stopTicking])

  // ── Initial fetch ─────────────────────────────────────────────

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getActiveTimerAction()
    if (r.ok) {
      if (r.data) {
        setActiveEntry(r.data)
        startTicking(r.data.startedAt)
      } else {
        setActiveEntry(null)
        setElapsedSeconds(0)
        stopTicking()
      }
      setError(null)
    } else {
      setError(r.error)
      setActiveEntry(null)
      stopTicking()
    }
    setLoading(false)
  }, [startTicking, stopTicking])

  useEffect(() => {
    void refetch()
  }, [refetch])

  // ── Mutations ─────────────────────────────────────────────────

  const start = useCallback(
    async (input: { projectId?: string | null; taskId?: string | null; note?: string } = {}) => {
      // Optimistic : create a placeholder entry locally with startedAt = now
      const optimisticEntry: TimeEntry = {
        id: '__pending__',
        userId: '',
        projectId: input.projectId ?? null,
        taskId: input.taskId ?? null,
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationSeconds: null,
        note: input.note ?? '',
        createdAt: new Date().toISOString(),
      }
      setActiveEntry(optimisticEntry)
      startTicking(optimisticEntry.startedAt)

      const r = await startTimerAction(input)
      if (r.ok) {
        setActiveEntry(r.data)
        startTicking(r.data.startedAt)
        setError(null)
        return r.data
      } else {
        // Roll back optimistic
        await refetch()
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    [startTicking, refetch]
  )

  const stop = useCallback(async () => {
    const previousEntry = activeEntry

    // Optimistic local stop
    setActiveEntry(null)
    setElapsedSeconds(0)
    stopTicking()

    const r = await stopTimerAction()
    if (r.ok) {
      setError(null)
      return r.data
    } else {
      // Restore on failure
      if (previousEntry) {
        setActiveEntry(previousEntry)
        startTicking(previousEntry.startedAt)
      }
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [activeEntry, startTicking, stopTicking])

  return {
    activeEntry,
    isRunning,
    elapsedSeconds,
    loading,
    error,
    refetch,
    start,
    stop,
  }
}

// ─── Utility: format seconds into HH:MM:SS or MM:SS ────────────

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
