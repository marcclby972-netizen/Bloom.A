'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getProjectsAction, createProjectAction, updateProjectAction,
  archiveProjectAction, deleteProjectAction,
} from '@/lib/actions/projects'
import type { Project, ServiceError } from '@/lib/v3-types'
import type { CreateProjectInput } from '@/lib/services/projects'

/**
 * List + manage projects for a given scope.
 *
 * @param scope.teamId
 *   - `undefined` → all visible projects (solo + every team I'm in)
 *   - `null`      → solo projects only (owned by me)
 *   - `string`    → projects of a specific team
 */
export function useProjects(scope: { teamId?: string | null } = {}) {
  const [data, setData] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const teamIdKey = scope.teamId === undefined ? '__all__' : scope.teamId ?? '__solo__'

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getProjectsAction(scope)
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamIdKey])

  useEffect(() => {
    void refetch()
  }, [refetch])

  // ── Mutations with optimistic updates ───

  const create = useCallback(async (input: CreateProjectInput) => {
    const r = await createProjectAction(input)
    if (r.ok) {
      setData((prev) => [r.data, ...prev])
      return r.data
    } else {
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [])

  const update = useCallback(
    async (id: string, patch: Partial<CreateProjectInput>) => {
      const r = await updateProjectAction(id, patch)
      if (r.ok) {
        setData((prev) => prev.map((p) => (p.id === id ? r.data : p)))
        return r.data
      } else {
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    []
  )

  const archive = useCallback(async (id: string) => {
    const previous = data
    setData((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)))
    const r = await archiveProjectAction(id)
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
    return r.data
  }, [data])

  const remove = useCallback(async (id: string) => {
    const previous = data
    setData((prev) => prev.filter((p) => p.id !== id))
    const r = await deleteProjectAction(id)
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [data])

  return { data, loading, error, refetch, create, update, archive, remove }
}
