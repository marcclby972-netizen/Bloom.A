'use server'

import * as svc from '@/lib/services/teams'
import { withResult } from './_result'
import type { TeamRole } from '@/lib/v3-types'

export async function getUserTeamsAction() {
  return withResult(svc.getUserTeams())
}

export async function createTeamAction(input: { name: string }) {
  return withResult(svc.createTeam(input))
}

export async function inviteMemberAction(input: {
  teamId: string
  email: string
  role?: TeamRole
}) {
  return withResult(svc.inviteMember(input))
}

export async function getTeamMembersAction(teamId: string) {
  return withResult(svc.getTeamMembers(teamId))
}
