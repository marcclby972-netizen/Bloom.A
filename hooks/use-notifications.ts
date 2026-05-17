'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getNotificationsAction, markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/lib/actions/notifications'
import type { Notification, ServiceError } from '@/lib/v3-types'

/**
 * List + manage notifications for the current user.
 *
 * @param opts.pollMs   polling interval in ms (default 60000 = 60s). Set 0 to disable.
 * @param opts.unreadOnly  only fetch unread (default false)
 * @param opts.limit       max entries (default 50)
 */
export function useNotifications(opts: {
  pollMs?: number
  unreadOnly?: boolean
  limit?: number
} = {}) {
  const { pollMs = 60_000, unreadOnly = false, limit = 50 } = opts

  const [data, setData] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    const r = await getNotificationsAction({ unreadOnly, limit })
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [unreadOnly, limit])

  // Initial fetch + polling
  useEffect(() => {
    void refetch()
    if (pollMs <= 0) return
    const id = setInterval(() => {
      void refetch()
    }, pollMs)
    return () => clearInterval(id)
  }, [refetch, pollMs])

  const unreadCount = data.filter((n) => n.readAt === null).length

  const markRead = useCallback(async (id: string) => {
    // Optimistic
    const previous = data
    const nowIso = new Date().toISOString()
    setData((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? nowIso } : n))
    )
    const r = await markNotificationAsReadAction(id)
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [data])

  const markAllRead = useCallback(async () => {
    const previous = data
    const nowIso = new Date().toISOString()
    setData((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })))
    const r = await markAllNotificationsAsReadAction()
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [data])

  return {
    data,
    unreadCount,
    loading,
    error,
    refetch,
    markRead,
    markAllRead,
  }
}
