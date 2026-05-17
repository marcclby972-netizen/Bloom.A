'use server'

import * as svc from '@/lib/services/time'
import { withResult } from './_result'
import { requireUser } from '@/lib/supabase/auth-helpers'
import type { TimePeriod } from '@/lib/v3-types'

export async function getActiveTimerAction() {
  const sbUser = await requireUser()
  return withResult(svc.getActiveTimer(sbUser.id))
}

export async function startTimerAction(input: {
  projectId?: string | null
  taskId?: string | null
  note?: string
}) {
  const sbUser = await requireUser()
  return withResult(svc.startTimer({ ...input, userId: sbUser.id }))
}

export async function stopTimerAction() {
  const sbUser = await requireUser()
  return withResult(svc.stopTimer(sbUser.id))
}

export async function getTimeEntriesAction(opts: {
  from?: string
  to?: string
  projectId?: string
} = {}) {
  const sbUser = await requireUser()
  return withResult(svc.getTimeEntriesForUser(sbUser.id, opts))
}

export async function getTimeStatsAction(period: TimePeriod = 'week') {
  const sbUser = await requireUser()
  return withResult(svc.getTimeStatsForUser(sbUser.id, { period }))
}
