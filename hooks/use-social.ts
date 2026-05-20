'use client'

/**
 * useSocialDrafts + useSocialTargets — gestion brouillons + objectifs
 * de publication par plateforme. Optimistic updates côté drafts pour
 * réactivité.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getDraftsAction,
  createDraftAction,
  updateDraftAction,
  deleteDraftAction,
  markPublishedAction,
  getTargetsAction,
  upsertTargetAction,
} from '@/lib/actions/social'
import type {
  SocialDraft,
  SocialDraftStatus,
  SocialPlatform,
  SocialTarget,
  ServiceError,
} from '@/lib/v3-types'
import type { CreateSocialDraftInput } from '@/lib/services/social'

export function useSocialDrafts() {
  const [data, setData] = useState<SocialDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getDraftsAction({})
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(
    async (input: CreateSocialDraftInput) => {
      const r = await createDraftAction(input)
      if (r.ok) {
        setData((prev) => [r.data, ...prev])
        return r.data
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    []
  )

  const update = useCallback(
    async (
      id: string,
      patch: Partial<Omit<CreateSocialDraftInput, 'teamId'>> & {
        status?: SocialDraftStatus
      }
    ) => {
      // Optimistic
      const previous = data
      setData((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.content !== undefined
                  ? { content: patch.content }
                  : {}),
                ...(patch.status !== undefined ? { status: patch.status } : {}),
                ...(patch.scheduledAt !== undefined
                  ? { scheduledAt: patch.scheduledAt }
                  : {}),
              }
            : d
        )
      )
      const r = await updateDraftAction(id, patch)
      if (!r.ok) {
        setData(previous)
        setError(r.error)
        throw new Error(r.error.message)
      }
      setData((prev) => prev.map((d) => (d.id === id ? r.data : d)))
      return r.data
    },
    [data]
  )

  const remove = useCallback(
    async (id: string) => {
      const previous = data
      setData((prev) => prev.filter((d) => d.id !== id))
      const r = await deleteDraftAction(id)
      if (!r.ok) {
        setData(previous)
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    [data]
  )

  const markPublished = useCallback(
    async (id: string) => {
      const r = await markPublishedAction(id)
      if (r.ok) {
        setData((prev) => prev.map((d) => (d.id === id ? r.data : d)))
        return r.data
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    []
  )

  // Indexé par plateforme pour streak / calendar views
  const publishedByPlatform = useMemo<Map<SocialPlatform, Date[]>>(() => {
    const m = new Map<SocialPlatform, Date[]>()
    for (const d of data) {
      if (!d.publishedAt) continue
      const arr = m.get(d.platform) ?? []
      arr.push(new Date(d.publishedAt))
      m.set(d.platform, arr)
    }
    return m
  }, [data])

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    markPublished,
    publishedByPlatform,
  }
}

export function useSocialTargets() {
  const [data, setData] = useState<SocialTarget[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getTargetsAction()
    if (r.ok) setData(r.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const upsert = useCallback(
    async (input: {
      platform: SocialPlatform
      targetPerDay: number
      targetPerWeek: number
    }) => {
      const r = await upsertTargetAction(input)
      if (!r.ok) throw new Error(r.error.message)
      setData((prev) => {
        const existing = prev.find((t) => t.platform === input.platform)
        if (existing) {
          return prev.map((t) => (t.platform === input.platform ? r.data : t))
        }
        return [...prev, r.data]
      })
      return r.data
    },
    []
  )

  // Map<platform, { perDay }> pour computeStreak
  const targetsByPlatform = useMemo<Map<SocialPlatform, { perDay: number }>>(
    () => {
      const m = new Map<SocialPlatform, { perDay: number }>()
      for (const t of data) m.set(t.platform, { perDay: t.targetPerDay })
      return m
    },
    [data]
  )

  return { data, loading, refetch, upsert, targetsByPlatform }
}
