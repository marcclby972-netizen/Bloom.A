'use server'

import * as svc from '@/lib/services/contributions'
import { withResult } from './_result'

export async function getTeamContributionsAction(opts: {
  teamId: string
  from?: string
  to?: string
}) {
  return withResult(svc.getTeamContributions(opts))
}
