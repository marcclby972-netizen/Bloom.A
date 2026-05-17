'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getTasksForProjectAction, getTasksForUserAction,
  createTaskAction, updateTaskAction, updateTaskStatusAction, deleteTaskAction,
} from '@/lib/actions/tasks'
import type { Task, TaskStatus, ServiceError } from '@/lib/v3-types'
import type { CreateTaskInput } from '@/lib/services/tasks'

/**
 * List + manage tasks.
 *
 * @param scope.projectId  if set → tasks for that project
 *                         if undefined → tasks assigned to current user across projects
 */
export function useTasks(scope: { projectId?: string } = {}) {
  const [data, setData] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = scope.projectId
      ? await getTasksForProjectAction(scope.projectId)
      : await getTasksForUserAction()
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [scope.projectId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(async (input: CreateTaskInput) => {
    const r = await createTaskAction(input)
    if (r.ok) {
      setData((prev) => [r.data, ...prev])
      return r.data
    } else {
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [])

  const update = useCallback(
    async (id: string, patch: Partial<CreateTaskInput>) => {
      const r = await updateTaskAction(id, patch)
      if (r.ok) {
        setData((prev) => prev.map((t) => (t.id === id ? r.data : t)))
        return r.data
      } else {
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    []
  )

  const setStatus = useCallback(async (id: string, status: TaskStatus) => {
    // Optimistic
    const previous = data
    setData((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    const r = await updateTaskStatusAction(id, status)
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
    setData((prev) => prev.map((t) => (t.id === id ? r.data : t)))
    return r.data
  }, [data])

  const remove = useCallback(async (id: string) => {
    const previous = data
    setData((prev) => prev.filter((t) => t.id !== id))
    const r = await deleteTaskAction(id)
    if (!r.ok) {
      setData(previous)
      setError(r.error)
      throw new Error(r.error.message)
    }
  }, [data])

  return { data, loading, error, refetch, create, update, setStatus, remove }
}
