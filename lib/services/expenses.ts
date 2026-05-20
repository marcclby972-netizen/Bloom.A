/**
 * Expenses service — création + listing + auto-vote.
 *
 * Logique d'auto-vote :
 *  1. Lire les `governance_rules` actives de la team
 *  2. Trouver la règle `spending_threshold` la plus restrictive (seuil le
 *     plus BAS qui est ≤ montant de la dépense) — exactement comme dans
 *     decision-status.ts `selectApplicableRule`.
 *  3. Si une règle s'applique → créer une décision `kind=expense` liée,
 *     status='pending', et l'expense reste en 'pending'.
 *  4. Sinon → status='approved' direct (l'expense est créée comme valide).
 *
 * Cohérence avec governance.ts : on réutilise les mêmes règles et le
 * mode de validation y est encodé.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import { assertPlanFeature } from './_plan'
import type { Expense, GovernanceRule } from '@/lib/v3-types'
import type { DbExpense, DbGovernanceRule } from '@/lib/v3-types/db'
import { fromDbGovernanceRule } from './_mappers'

export type CreateExpenseInput = {
  teamId: string
  amountCents: number
  description: string
  category?: string | null
  receiptUrl?: string | null
  spentAt?: string                     // 'YYYY-MM-DD'. Default = today
  currency?: string                    // Default 'EUR'
}

function fromDbExpense(row: DbExpense): Expense {
  return {
    id: row.id,
    teamId: row.team_id,
    createdBy: row.created_by,
    amountCents: row.amount_cents,
    currency: row.currency,
    category: row.category,
    description: row.description,
    receiptUrl: row.receipt_url,
    status: row.status,
    decisionId: row.decision_id,
    spentAt: row.spent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Sélectionne la règle spending_threshold la plus restrictive applicable. */
function pickApplicableRule(
  rules: GovernanceRule[],
  amountCents: number
): GovernanceRule | null {
  const applicable = rules.filter(
    (r) =>
      r.active &&
      r.type === 'spending_threshold' &&
      r.thresholdAmountCents !== null &&
      amountCents > r.thresholdAmountCents
  )
  if (applicable.length === 0) return null
  // Most restrictive = highest threshold ≤ amount
  return applicable.reduce((best, r) =>
    (r.thresholdAmountCents ?? 0) > (best.thresholdAmountCents ?? 0) ? r : best
  )
}

export async function getExpenses(opts: {
  teamId: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  from?: string                        // ISO date
  to?: string
}): Promise<Expense[]> {
  await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('expenses_v3')
    .select('*')
    .eq('team_id', opts.teamId)
    .order('spent_at', { ascending: false })

  if (opts.status) q = q.eq('status', opts.status)
  if (opts.from) q = q.gte('spent_at', opts.from)
  if (opts.to) q = q.lte('spent_at', opts.to)

  const { data, error } = await q
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des dépenses échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbExpense(r as DbExpense))
}

export async function createExpense(input: CreateExpenseInput): Promise<{
  expense: Expense
  triggeredVote: boolean
}> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  // Enforcement plan : dépenses = plan Team
  await assertPlanFeature(sbUser, 'expenses', 'Les dépenses nécessitent le plan Team.')

  // ─── 1. Validation ───
  if (input.amountCents <= 0) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le montant doit être positif',
    })
  }
  if (!input.description.trim()) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'La description est requise',
    })
  }
  if (input.description.length > 500) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Description trop longue (500 max)',
    })
  }

  // ─── 2. Vérifier que le user est membre actif ───
  const { data: membership } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', input.teamId)
    .eq('user_id', sbUser.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!membership) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu n’es pas membre actif de cette équipe',
    })
  }

  // ─── 3. Lire les règles de gouvernance ───
  const { data: rulesRaw } = await supabase
    .from('governance_rules')
    .select('*')
    .eq('team_id', input.teamId)
    .eq('active', true)
  const rules = (rulesRaw ?? []).map((r) =>
    fromDbGovernanceRule(r as DbGovernanceRule)
  )

  const applicableRule = pickApplicableRule(rules, input.amountCents)
  const triggeredVote = applicableRule !== null

  // ─── 4. Créer la décision liée si nécessaire ───
  let decisionId: string | null = null
  if (triggeredVote && applicableRule) {
    // Deadline : 7 jours par défaut
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7)

    const { data: decisionRow, error: decisionErr } = await supabase
      .from('decisions')
      .insert({
        organization_id: input.teamId,
        created_by: sbUser.id,
        kind: 'expense',
        title: `Dépense : ${input.description.slice(0, 80)}`,
        description: `Montant : ${(input.amountCents / 100).toFixed(2)} ${input.currency ?? 'EUR'}\nRègle appliquée : ${applicableRule.validationMode}`,
        amount_cents: input.amountCents,
        status: 'pending',
        deadline: deadline.toISOString(),
      })
      .select('id')
      .single()

    if (decisionErr || !decisionRow) {
      throw new ServiceFailure({
        code: 'unknown',
        message: 'Création de la décision liée échouée',
        details: { supabaseError: decisionErr?.message },
      })
    }
    decisionId = decisionRow.id as string
  }

  // ─── 5. Insérer l'expense ───
  const { data, error } = await supabase
    .from('expenses_v3')
    .insert({
      team_id: input.teamId,
      created_by: sbUser.id,
      amount_cents: input.amountCents,
      currency: input.currency ?? 'EUR',
      category: input.category?.trim() || null,
      description: input.description.trim(),
      receipt_url: input.receiptUrl ?? null,
      status: triggeredVote ? 'pending' : 'approved',
      decision_id: decisionId,
      spent_at: input.spentAt ?? new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de la dépense échouée',
      details: { supabaseError: error?.message },
    })
  }

  return { expense: fromDbExpense(data as DbExpense), triggeredVote }
}

/** Synchronise le status d'une expense avec celui de sa décision liée. */
export async function syncExpenseStatusFromDecision(expenseId: string): Promise<Expense> {
  await requireUser()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('expenses_v3')
    .select('*, decisions:decision_id(status)')
    .eq('id', expenseId)
    .maybeSingle()
  if (!row) {
    throw new ServiceFailure({ code: 'not_found', message: 'Dépense introuvable' })
  }
  const decision = (row as { decisions?: { status: string } | null }).decisions
  if (!decision) {
    // Pas de décision liée → pas de sync, on retourne l'état courant
    return fromDbExpense(row as unknown as DbExpense)
  }

  const newStatus: 'pending' | 'approved' | 'rejected' =
    decision.status === 'approved'
      ? 'approved'
      : decision.status === 'rejected'
        ? 'rejected'
        : 'pending'

  if (newStatus === (row as unknown as DbExpense).status) {
    return fromDbExpense(row as unknown as DbExpense)
  }

  const { data, error } = await supabase
    .from('expenses_v3')
    .update({ status: newStatus })
    .eq('id', expenseId)
    .select('*')
    .single()
  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Sync du status échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbExpense(data as DbExpense)
}

export async function cancelExpense(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses_v3')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Annulation de la dépense échouée',
      details: { supabaseError: error.message },
    })
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('expenses_v3').delete().eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Suppression de la dépense échouée',
      details: { supabaseError: error.message },
    })
  }
}

/** Total des dépenses approuvées du mois en cours pour une team. */
export async function getMonthlyTotal(teamId: string): Promise<number> {
  await requireUser()
  const supabase = await createClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('expenses_v3')
    .select('amount_cents')
    .eq('team_id', teamId)
    .eq('status', 'approved')
    .gte('spent_at', monthStart.toISOString().slice(0, 10))

  return (data ?? []).reduce(
    (sum, r) => sum + ((r as { amount_cents: number }).amount_cents ?? 0),
    0
  )
}
