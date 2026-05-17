'use server'

import * as svc from '@/lib/services/governance'
import type {
  CreateGovernanceRuleInput, CreateDecisionInput,
} from '@/lib/services/governance'
import { withResult } from './_result'
import { requireUser } from '@/lib/supabase/auth-helpers'
import type { VoteValue } from '@/lib/v3-types'

// ── Rules ──

export async function getGovernanceRulesAction(teamId: string) {
  return withResult(svc.getGovernanceRules(teamId))
}

export async function createGovernanceRuleAction(input: CreateGovernanceRuleInput) {
  return withResult(svc.createGovernanceRule(input))
}

// ── Decisions ──

export async function getDecisionsAction(teamId: string) {
  return withResult(svc.getDecisions(teamId))
}

export async function getDecisionAction(id: string) {
  return withResult(svc.getDecision(id))
}

export async function createDecisionAction(input: CreateDecisionInput) {
  return withResult(svc.createDecision(input))
}

export async function voteOnDecisionAction(decisionId: string, value: VoteValue) {
  const sbUser = await requireUser()
  return withResult(svc.voteOnDecision(decisionId, sbUser.id, value))
}

export async function computeDecisionStatusAction(decisionId: string) {
  return withResult(svc.computeDecisionStatus(decisionId))
}
