'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getDecisionsAction, createDecisionAction, voteOnDecisionAction,
  computeDecisionStatusAction,
} from '@/lib/actions/governance'
import type {
  Decision, ServiceError, VoteValue, DecisionComputedStatus,
} from '@/lib/v3-types'
import type { CreateDecisionInput } from '@/lib/services/governance'

/**
 * List + manage decisions for a team.
 *
 * Pass `teamId = null` to disable (e.g. solo mode — no decisions).
 */
export function useDecisions(teamId: string | null) {
  const [data, setData] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    if (!teamId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const r = await getDecisionsAction(teamId)
    if (r.ok) {
      setData(r.data)
      setError(null)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const create = useCallback(
    async (input: Omit<CreateDecisionInput, 'teamId'>) => {
      if (!teamId) throw new Error('Pas d\'équipe active')
      const r = await createDecisionAction({ ...input, teamId })
      if (r.ok) {
        setData((prev) => [r.data, ...prev])
        return r.data
      } else {
        setError(r.error)
        throw new Error(r.error.message)
      }
    },
    [teamId]
  )

  const vote = useCallback(async (decisionId: string, value: VoteValue) => {
    const r = await voteOnDecisionAction(decisionId, value)
    if (!r.ok) {
      setError(r.error)
      throw new Error(r.error.message)
    }
    return r.data
  }, [])

  const computeStatus = useCallback(
    async (decisionId: string): Promise<DecisionComputedStatus> => {
      const r = await computeDecisionStatusAction(decisionId)
      if (r.ok) return r.data
      setError(r.error)
      throw new Error(r.error.message)
    },
    []
  )

  return { data, loading, error, refetch, create, vote, computeStatus }
}
