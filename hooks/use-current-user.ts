'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrentUserAction, updateUserProfileAction } from '@/lib/actions/users'
import type { User, UserSettings, ServiceError } from '@/lib/v3-types'

/**
 * Returns the current authenticated user with role + settings.
 * On unauthenticated → data = null, error = { code: 'unauthorized', ... }.
 */
export function useCurrentUser() {
  const [data, setData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const r = await getCurrentUserAction()
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setData(null)
      setError(r.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const updateProfile = useCallback(
    async (patch: { name?: string; settings?: Partial<UserSettings> }) => {
      const r = await updateUserProfileAction(patch)
      if (r.ok) {
        setData(r.data)
        setError(null)
        return r.data
      } else {
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    []
  )

  return { data, loading, error, refetch, updateProfile }
}
