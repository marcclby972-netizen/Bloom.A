/**
 * Contributions service — agrège pour une team :
 *  - time_entries_v3 par user (somme des durationSeconds sur la période)
 *  - expenses_v3 approuvées par user (somme amount_cents)
 *  - shares déclarées (depuis memberships)
 *
 * Puis appelle `computeEquityScorePure` pour obtenir le score d'équité.
 *
 * Fonction principale : `getTeamContributions(teamId, { from?, to? })`
 * Retourne `TeamContributionsResult` (cf. v3-types).
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import { computeEquityScorePure } from '@/lib/rules/equity-score'
import { assertPlanFeature } from './_plan'
import type {
  TeamContributionsResult,
  MemberContribution,
  TeamRole,
} from '@/lib/v3-types'

export async function getTeamContributions(opts: {
  teamId: string
  /** Default : 30 derniers jours. */
  from?: string
  to?: string
}): Promise<TeamContributionsResult> {
  const sbUser = await requireUser()
  await assertPlanFeature(
    sbUser,
    'contributions_equity',
    "Le score d'équité nécessite le plan Team."
  )
  const supabase = await createClient()

  const to = opts.to ?? new Date().toISOString()
  const fromDate = new Date(to)
  fromDate.setDate(fromDate.getDate() - 30)
  const from = opts.from ?? fromDate.toISOString()

  // ─── 1. Liste des memberships actifs ───
  const { data: memberships, error: mErr } = await supabase
    .from('organization_members')
    .select('id, user_id, role, shares')
    .eq('organization_id', opts.teamId)
    .eq('status', 'active')
  if (mErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des memberships échouée',
      details: { supabaseError: mErr.message },
    })
  }
  const memberRows = (memberships ?? []) as Array<{
    id: string
    user_id: string
    role: TeamRole
    shares: number | null
  }>
  if (memberRows.length === 0) {
    return {
      teamId: opts.teamId,
      from,
      to,
      members: [],
      equityScore: 100,
      equityAlerts: [],
    }
  }

  const userIds = memberRows.map((m) => m.user_id)

  // ─── 2. Time entries de la team scope (filtré par user_id ∈ membres) ───
  // Note : on agrège côté JS, plus simple que de faire un GROUP BY SQL
  // pour rester portable et non-couplé à la fonction Postgres.
  // Le scope team passe par les projets : time_entries.project_id ∈
  // projets dont team_id = opts.teamId, OU project_id IS NULL (travail libre)
  // pour les users de la team.
  const { data: timeRows } = await supabase
    .from('time_entries_v3')
    .select('user_id, duration_seconds, project_id')
    .in('user_id', userIds)
    .gte('started_at', from)
    .lt('started_at', to)
    .not('ended_at', 'is', null)        // on ignore les timers en cours

  // ─── 3. Filtrer : ne garder que les entries dont le projet est de la team OU sans projet ───
  // On lit les project IDs de la team pour filtrer côté JS.
  const { data: teamProjects } = await supabase
    .from('projects_v3')
    .select('id')
    .eq('team_id', opts.teamId)
  const teamProjectIds = new Set(
    (teamProjects ?? []).map((p) => (p as { id: string }).id)
  )

  const timeByUser = new Map<string, number>()
  for (const r of timeRows ?? []) {
    const row = r as { user_id: string; duration_seconds: number | null; project_id: string | null }
    if (row.project_id !== null && !teamProjectIds.has(row.project_id)) continue
    const prev = timeByUser.get(row.user_id) ?? 0
    timeByUser.set(row.user_id, prev + (row.duration_seconds ?? 0))
  }

  // ─── 4. Expenses approuvées de la team ───
  const { data: expenseRows } = await supabase
    .from('expenses_v3')
    .select('created_by, amount_cents')
    .eq('team_id', opts.teamId)
    .eq('status', 'approved')
    .gte('spent_at', from.slice(0, 10))
    .lte('spent_at', to.slice(0, 10))

  const expensesByUser = new Map<string, number>()
  for (const r of expenseRows ?? []) {
    const row = r as { created_by: string; amount_cents: number }
    const prev = expensesByUser.get(row.created_by) ?? 0
    expensesByUser.set(row.created_by, prev + row.amount_cents)
  }

  // ─── 5. Assemble per-member contributions ───
  const members: MemberContribution[] = memberRows.map((m) => ({
    userId: m.user_id,
    membershipId: m.id,
    role: m.role,
    sharesPct: m.shares,
    timeSeconds: timeByUser.get(m.user_id) ?? 0,
    expensesCents: expensesByUser.get(m.user_id) ?? 0,
  }))

  // ─── 6. Compute equity score via pure rule ───
  const equity = computeEquityScorePure({
    members: members.map((m) => ({
      userId: m.userId,
      sharesPct: m.sharesPct,
      contributionSeconds: m.timeSeconds,
      contributionCents: m.expensesCents,
    })),
  })

  return {
    teamId: opts.teamId,
    from,
    to,
    members,
    equityScore: equity.overall,
    equityAlerts: equity.alerts,
  }
}
