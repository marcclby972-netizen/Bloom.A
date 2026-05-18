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
import { computeDecisionStatusPure } from '@/lib/rules/decision-status'
import type {
  GovernanceRule, GovernanceRuleType, ValidationMode,
  Decision, DecisionKind, DecisionComputedStatus, Vote, VoteValue,
  TeamRole,
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

/**
 * Thin wrapper : fetches everything from DB then delegates to the
 * pure fn in lib/rules/decision-status.ts (unit-tested independently).
 */
export async function computeDecisionStatus(
  decisionId: string
): Promise<DecisionComputedStatus> {
  await requireUser()
  const supabase = await createClient()

  const { decision, votes } = await getDecision(decisionId)

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
  const eligible = (members ?? []).map((m) => ({
    userId: m.user_id as string,
    role: m.role as TeamRole,
  }))

  const rules = await getGovernanceRules(decision.teamId)

  return computeDecisionStatusPure({ decision, votes, eligible, rules })
}

// Note : la logique pure de selectApplicableRule + makeStatus vit dans
// `@/lib/rules/decision-status.ts` (testable sans Supabase).
