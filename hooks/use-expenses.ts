'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getExpensesAction,
  createExpenseAction,
  cancelExpenseAction,
  deleteExpenseAction,
} from '@/lib/actions/expenses'
import type { Expense, ServiceError } from '@/lib/v3-types'
import type { CreateExpenseInput } from '@/lib/services/expenses'

export function useExpenses(teamId: string | null) {
  const [data, setData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ServiceError | null>(null)

  const refetch = useCallback(async () => {
    if (!teamId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const r = await getExpensesAction({ teamId })
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
    async (input: Omit<CreateExpenseInput, 'teamId'>) => {
      if (!teamId) throw new Error('Pas d’équipe active')
      const r = await createExpenseAction({ ...input, teamId })
      if (r.ok) {
        await refetch()
        return r.data
      }
      setError(r.error)
      throw new Error(r.error.message)
    },
    [teamId, refetch]
  )

  const cancel = useCallback(
    async (id: string) => {
      const r = await cancelExpenseAction(id)
      if (r.ok) await refetch()
      else throw new Error(r.error.message)
    },
    [refetch]
  )

  const remove = useCallback(
    async (id: string) => {
      const r = await deleteExpenseAction(id)
      if (r.ok) await refetch()
      else throw new Error(r.error.message)
    },
    [refetch]
  )

  return { data, loading, error, refetch, create, cancel, remove }
}
