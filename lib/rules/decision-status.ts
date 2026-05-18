/**
 * Pure decision-status computation — no DB access.
 *
 * Pulled out of `lib/services/governance.ts:computeDecisionStatus` so the
 * algorithm can be unit-tested in isolation without mocking Supabase.
 *
 * Inputs (all the data you'd fetch anyway):
 *  - decision : the row
 *  - votes    : all decision_votes for it
 *  - eligible : active memberships of the team (with role for single_owner)
 *  - rules    : active governance_rules for the team
 *  - now      : ms timestamp used for deadline comparison (defaults Date.now)
 *
 * Output: DecisionComputedStatus { status, tally, reason }
 */

import type {
  Decision, Vote, GovernanceRule, DecisionKind,
  GovernanceRuleType, ValidationMode, DecisionComputedStatus,
  TeamRole,
} from '@/lib/v3-types'

export type EligibleMember = {
  userId: string
  role: TeamRole
}

export function computeDecisionStatusPure(input: {
  decision: Decision
  votes: Vote[]
  eligible: EligibleMember[]
  rules: GovernanceRule[]
  now?: number
}): DecisionComputedStatus {
  const { decision, votes, eligible, rules } = input
  const now = input.now ?? Date.now()

  // 1. Tally votes
  const tally = { for: 0, against: 0, abstain: 0 }
  for (const v of votes) tally[v.value]++

  // 2. Pick the most relevant active rule for this kind + amount
  const activeRules = rules.filter((r) => r.active)
  const applicable = selectApplicableRule(activeRules, decision.kind, decision.amountCents)
  const validationMode: ValidationMode = applicable?.validationMode ?? 'majority_vote'

  const totalEligible = eligible.length
  if (totalEligible === 0) {
    return {
      status: 'rejected',
      tally: { ...tally, requiredFor: 1, totalEligible: 0 },
      reason: 'Pas de membres actifs habilités à voter.',
    }
  }

  // 3. Compute required "for" count
  let requiredFor: number
  switch (validationMode) {
    case 'single_owner':
      requiredFor = 1
      break
    case 'majority_vote':
      requiredFor = Math.floor(totalEligible / 2) + 1
      break
    case 'unanimous':
      requiredFor = totalEligible
      break
  }

  // 4. Effective "for" count (single_owner only counts founders)
  const founderIds = new Set(eligible.filter((m) => m.role === 'founder').map((m) => m.userId))
  const effectiveFor =
    validationMode === 'single_owner'
      ? votes.filter((v) => v.value === 'for' && founderIds.has(v.userId)).length
      : tally.for

  // 5. Deadline check (before approval check — deadline trumps if not yet approved)
  if (decision.deadline) {
    const deadlineMs = new Date(decision.deadline).getTime()
    if (Number.isFinite(deadlineMs) && deadlineMs < now && decision.status !== 'approved') {
      return {
        status: 'expired',
        tally: { ...tally, requiredFor, totalEligible },
        reason: `Deadline dépassée avant l'atteinte du seuil (${effectiveFor}/${requiredFor}).`,
      }
    }
  }

  // 6. Approved if threshold reached
  if (effectiveFor >= requiredFor) {
    return {
      status: 'approved',
      tally: { ...tally, requiredFor, totalEligible },
      reason: `Seuil atteint (${effectiveFor}/${requiredFor}) en mode ${validationMode}.`,
    }
  }

  // 7. Unanimous + any against → rejected
  if (validationMode === 'unanimous' && tally.against > 0) {
    return {
      status: 'rejected',
      tally: { ...tally, requiredFor, totalEligible },
      reason: `Unanimité requise mais ${tally.against} vote(s) contre.`,
    }
  }

  // 8. Still pending
  return {
    status: 'pending',
    tally: { ...tally, requiredFor, totalEligible },
    reason: `${effectiveFor}/${requiredFor} votes "pour" en mode ${validationMode}.`,
  }
}

/**
 * Choose the most relevant rule for a decision.
 * - For 'expense' with amount → spending_threshold whose threshold is closest below the amount
 * - Otherwise → first rule matching the kind, fallback first rule
 */
export function selectApplicableRule(
  rules: GovernanceRule[],
  kind: DecisionKind,
  amountCents: number | null
): GovernanceRule | null {
  if (rules.length === 0) return null

  if (kind === 'expense' && amountCents != null && amountCents > 0) {
    const spendRules = rules
      .filter((r) => r.type === 'spending_threshold' && r.thresholdAmountCents != null)
      .filter((r) => (r.thresholdAmountCents ?? 0) <= amountCents)
      .sort((a, b) => (b.thresholdAmountCents ?? 0) - (a.thresholdAmountCents ?? 0))
    if (spendRules[0]) return spendRules[0]
  }

  const kindMap: Record<DecisionKind, GovernanceRuleType> = {
    expense: 'spending_threshold',
    rule_change: 'other',
    distribution: 'distribution',
    equity_change: 'equity_change',
    other: 'other',
  }
  const t = kindMap[kind]
  return rules.find((r) => r.type === t) ?? rules[0] ?? null
}
