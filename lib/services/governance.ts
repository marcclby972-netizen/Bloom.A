/**
 * Governance service — règles + décisions + votes.
 *
 * Tables :
 *  - `governance_rules` (v3) : règles de validation par type + montant
 *  - `decisions` (legacy mais OK) : décisions en attente / votées
 *  - `decision_votes` : 1 vote par membre par décision
 *
 * Logique métier clé : `computeDecisionStatus()` qui calcule le statut
 * d'une décision en fonction de la règle applicable + des votes existants
 * + de la deadline.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type {
  GovernanceRule, GovernanceRuleType, ValidationMode,
  Decision, DecisionKind, DecisionComputedStatus, Vote, VoteValue,
} from '@/lib/v3-types'
import type {
  DbGovernanceRule, DbDecision, DbVote,
} from '@/lib/v3-types/db'
import {
  fromDbGovernanceRule, fromDbDecision, fromDbVote, voteValueToDb,
} from './_mappers'

// ─────────────────────────────────────────────────────────────
// Governance rules
// ─────────────────────────────────────────────────────────────

export async function getGovernanceRules(teamId: string): Promise<GovernanceRule[]> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('governance_rules')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des règles échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbGovernanceRule(r as DbGovernanceRule))
}

export type CreateGovernanceRuleInput = {
  teamId: string
  type: GovernanceRuleType
  thresholdAmountCents?: number | null
  validationMode: ValidationMode
  active?: boolean
}

export async function createGovernanceRule(
  input: CreateGovernanceRuleInput
): Promise<GovernanceRule> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  if (input.type === 'spending_threshold' && (input.thresholdAmountCents ?? null) === null) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Une règle de seuil de dépense doit avoir un montant',
    })
  }

  const { data, error } = await supabase
    .from('governance_rules')
    .insert({
      team_id: input.teamId,
      type: input.type,
      threshold_amount_cents: input.thresholdAmountCents ?? null,
      validation_mode: input.validationMode,
      active: input.active ?? true,
      created_by: sbUser.id,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de la règle échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbGovernanceRule(data as DbGovernanceRule)
}

// ─────────────────────────────────────────────────────────────
// Decisions
// ─────────────────────────────────────────────────────────────

export async function getDecisions(teamId: string): Promise<Decision[]> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('organization_id', teamId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des décisions échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbDecision(r as DbDecision))
}

export async function getDecision(id: string): Promise<{ decision: Decision; votes: Vote[] }> {
  await requireUser()
  const supabase = await createClient()

  const { data: d, error: dErr } = await supabase
    .from('decisions').select('*').eq('id', id).maybeSingle()
  if (dErr || !d) {
    throw new ServiceFailure({
      code: 'not_found',
      message: 'Décision introuvable',
      details: dErr ? { supabaseError: dErr.message } : undefined,
    })
  }
  const { data: vs, error: vErr } = await supabase
    .from('decision_votes').select('*').eq('decision_id', id)
  if (vErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des votes échouée',
      details: { supabaseError: vErr.message },
    })
  }
  return {
    decision: fromDbDecision(d as DbDecision),
    votes: (vs ?? []).map((r) => fromDbVote(r as DbVote)),
  }
}

export type CreateDecisionInput = {
  teamId: string
  kind: DecisionKind
  title: string
  description?: string
  amountCents?: number | null
  deadline?: string | null              // ISO timestamp (not stored yet — schema TODO)
}

export async function createDecision(input: CreateDecisionInput): Promise<Decision> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const title = input.title.trim()
  if (!title || title.length > 200) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le titre doit faire entre 1 et 200 caractères',
    })
  }

  const { data, error } = await supabase
    .from('decisions')
    .insert({
      organization_id: input.teamId,
      kind: input.kind,
      title,
      description: input.description ?? null,
      amount_cents: input.amountCents ?? null,
      created_by: sbUser.id,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de la décision échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbDecision(data as DbDecision)
}

/**
 * Vote on a decision. Inserts or updates the vote (1 vote per user per decision).
 */
export async function voteOnDecision(
  decisionId: string,
  userId: string,
  value: VoteValue
): Promise<Vote> {
  const sbUser = await requireUser()
  if (userId !== sbUser.id) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux voter qu\'en ton nom',
    })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decision_votes')
    .upsert(
      {
        decision_id: decisionId,
        user_id: sbUser.id,
        vote: voteValueToDb(value),
      },
      { onConflict: 'decision_id,user_id' }
    )
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Vote échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbVote(data as DbVote)
}

// ─────────────────────────────────────────────────────────────
// computeDecisionStatus — logique métier centrale
//
// Algorithme :
//  1. Récupère la décision, les votes, les membres actifs, les règles
//     applicables (en fonction du kind + amount).
//  2. Choisit la règle la plus stricte qui s'applique.
//  3. Calcule le tally (for / against / abstain).
//  4. Selon le validation_mode :
//      - single_owner : 1 'for' d'un founder suffit
//      - majority_vote : >50% des éligibles ont voté 'for'
//      - unanimous : 100% des éligibles ont voté 'for'
//  5. Si la décision a une deadline dépassée → 'expired'.
//  6. Retourne le status calculé + tally + raison.
//
// Note : ce service NE persiste PAS le status — c'est à l'appelant de
// faire un updateDecisionStatus si pertinent (pour éviter race conditions).
// ─────────────────────────────────────────────────────────────

export async function computeDecisionStatus(
  decisionId: string
): Promise<DecisionComputedStatus> {
  await requireUser()
  const supabase = await createClient()

  // 1. Décision + votes
  const { decision, votes } = await getDecision(decisionId)

  // 2. Membres actifs (éligibles) + founders pour single_owner
  const { data: members, error: mErr } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', decision.teamId)
    .eq('status', 'active')
  if (mErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des membres pour calcul échouée',
      details: { supabaseError: mErr.message },
    })
  }
  const eligible = members ?? []
  const founderIds = new Set(eligible.filter((m) => m.role === 'founder').map((m) => m.user_id as string))

  // 3. Règles applicables
  const rules = (await getGovernanceRules(decision.teamId)).filter((r) => r.active)
  const applicable = selectApplicableRule(rules, decision.kind, decision.amountCents)

  // 4. Tally
  const tally = { for: 0, against: 0, abstain: 0 }
  for (const v of votes) tally[v.value]++

  // 5. Decide based on validation mode
  const totalEligible = eligible.length
  let validationMode: ValidationMode = applicable?.validationMode ?? 'majority_vote'
  // Fallback : si pas de règle ET pas de membres → ça ne peut pas passer
  if (totalEligible === 0) {
    return makeStatus('rejected', { ...tally, requiredFor: 1, totalEligible: 0 },
      'Pas de membres actifs habilités à voter.')
  }

  let requiredFor = 0
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

  // For single_owner, only count 'for' votes from founders
  const effectiveFor =
    validationMode === 'single_owner'
      ? votes.filter((v) => v.value === 'for' && founderIds.has(v.userId)).length
      : tally.for

  // Deadline check
  if (decision.deadline) {
    const deadlineMs = new Date(decision.deadline).getTime()
    if (Number.isFinite(deadlineMs) && deadlineMs < Date.now() && decision.status !== 'approved') {
      return makeStatus('expired',
        { ...tally, requiredFor, totalEligible },
        `Deadline dépassée avant l'atteinte du seuil (${effectiveFor}/${requiredFor}).`)
    }
  }

  // If rejection is mathematically impossible to overturn → 'approved' early
  if (effectiveFor >= requiredFor) {
    return makeStatus('approved',
      { ...tally, requiredFor, totalEligible },
      `Seuil atteint (${effectiveFor}/${requiredFor}) en mode ${validationMode}.`)
  }

  // If remaining "against" votes can no longer be overturned in unanimous mode
  if (validationMode === 'unanimous' && tally.against > 0) {
    return makeStatus('rejected',
      { ...tally, requiredFor, totalEligible },
      `Unanimité requise mais ${tally.against} vote(s) contre.`)
  }

  // Pending : pas encore décidé
  return makeStatus('pending',
    { ...tally, requiredFor, totalEligible },
    `${effectiveFor}/${requiredFor} votes "pour" en mode ${validationMode}.`)
}

// ── helpers internes ───────────────────────────────────────────

/**
 * Choose the most relevant rule for a decision.
 * - For 'expense' with amount → spending_threshold rule whose threshold is closest below the amount
 * - Otherwise → first rule matching the kind, fallback majority_vote
 */
function selectApplicableRule(
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

function makeStatus(
  status: DecisionComputedStatus['status'],
  tally: DecisionComputedStatus['tally'],
  reason: string
): DecisionComputedStatus {
  return { status, tally, reason }
}
