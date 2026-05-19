'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getEventsAction,
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from '@/lib/actions/events'
import type { Event, ServiceError } from '@/lib/v3-types'
import type { CreateEventInput, UpdateEventInput } from '@/lib/services/events'

/**
 * useEvents — liste les évènements d'une plage [from, to[ et permet
 * de créer/modifier/supprimer.
 *
 * Recharge automatiquement quand from/to/teamId/projectId changent.
 * Toutes les mutations refetch (pas d'optimistic pour éviter les
 * incohérences sur le placement dans la grille).
 */
export function useEvents(opts: {
  from: string
  to: string
  teamId?: string | null
  projectId?: string
}) {
  const [data, setData] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getEventsAction(opts)
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.from, opts.to, opts.teamId, opts.projectId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(
    async (input: CreateEventInput): Promise<Event> => {
      const r = await createEventAction(input)
      if (r.ok) {
        await refetch()
        return r.data
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    [refetch]
  )

  const update = useCallback(
    async (id: string, patch: UpdateEventInput): Promise<Event> => {
      const r = await updateEventAction(id, patch)
      if (r.ok) {
        await refetch()
        return r.data
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    [refetch]
  )

  const remove = useCallback(
    async (id: string): Promise<void> => {
      const r = await deleteEventAction(id)
      if (r.ok) {
        await refetch()
        return
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    [refetch]
  )

  return { data, loading, error, refetch, create, update, remove }
}
