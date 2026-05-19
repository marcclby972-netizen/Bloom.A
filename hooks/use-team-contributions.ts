'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTeamContributionsAction } from '@/lib/actions/contributions'
import type {
  TeamContributionsResult,
  ServiceError,
} from '@/lib/v3-types'

export function useTeamContributions(
  teamId: string | null,
  opts: { from?: string; to?: string } = {}
) {
  const [data, setData] = useState<TeamContributionsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    if (!teamId) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const r = await getTeamContributionsAction({
      teamId,
      from: opts.from,
      to: opts.to,
    })
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [teamId, opts.from, opts.to])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
