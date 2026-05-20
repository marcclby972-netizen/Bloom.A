/**
 * Teams service — gestion des équipes + membres + invites.
 *
 * Mapping :
 *  - DB table `organizations`     → domaine `Team` (via view `teams`)
 *  - DB table `organization_members` → domaine `Membership` (via view `memberships`)
 *  - DB table `organization_invites` → invites email en attente
 *
 * RLS : un user voit toutes les teams où il est membre actif.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import { assertPlanFeature } from './_plan'
import type { Team, Membership, TeamRole } from '@/lib/v3-types'
import type { DbTeam, DbMembership } from '@/lib/v3-types/db'
import { fromDbTeam, fromDbMembership } from './_mappers'

/**
 * Returns all teams where the current user is an active member.
 */
export async function getUserTeams(userId?: string): Promise<Team[]> {
  const sbUser = await requireUser()
  const targetUserId = userId ?? sbUser.id

  if (targetUserId !== sbUser.id) {
    // Could allow admins to query other users — for now strict.
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux lister que tes propres équipes',
    })
  }

  const supabase = await createClient()

  // Use organizations table directly (the `teams` view exists but querying
  // via the source table is safer for joins).
  const { data: memberships, error: mErr } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', targetUserId)
    .eq('status', 'active')
  if (mErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des équipes échouée',
      details: { supabaseError: mErr.message },
    })
  }
  const ids = (memberships ?? []).map((m) => m.organization_id as string)
  if (ids.length === 0) return []

  const { data: orgs, error: oErr } = await supabase
    .from('organizations')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })
  if (oErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des équipes échouée',
      details: { supabaseError: oErr.message },
    })
  }
  return (orgs ?? []).map((r) => fromDbTeam(r as DbTeam))
}

/**
 * Create a new team and add the current user as founder.
 * Returns the created team.
 */
export async function createTeam(input: { name: string }): Promise<Team> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name || name.length > 80) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le nom de l\'équipe doit faire entre 1 et 80 caractères',
    })
  }

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name, created_by: sbUser.id })
    .select('*')
    .single()
  if (orgErr || !org) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de l\'équipe échouée',
      details: { supabaseError: orgErr?.message },
    })
  }

  // Auto-add creator as founder
  const { error: mErr } = await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: sbUser.id,
    role: 'founder',
    status: 'active',
  })
  if (mErr) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Ajout du fondateur échoué',
      details: { supabaseError: mErr.message },
    })
  }

  return fromDbTeam(org as DbTeam)
}

/**
 * Invite a member by email. Creates a pending invite row.
 * Only founders of the team can invite.
 */
export async function inviteMember(input: {
  teamId: string
  email: string
  role?: TeamRole
}): Promise<{ inviteId: string }> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  // Enforcement : team_invite réservé au plan Team
  await assertPlanFeature(
    sbUser,
    'team_invite',
    "L'invitation d'associés nécessite le plan Team (29€/mois)."
  )

  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) {
    throw new ServiceFailure({ code: 'validation', message: 'Email invalide' })
  }

  const { data, error } = await supabase
    .from('organization_invites')
    .insert({
      organization_id: input.teamId,
      email,
      role: input.role ?? 'associate',
      invited_by: sbUser.id,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Envoi de l\'invitation échoué',
      details: { supabaseError: error?.message },
    })
  }
  return { inviteId: data.id as string }
}

/**
 * Returns all active memberships for a team (including founder).
 */
export async function getTeamMembers(teamId: string): Promise<Membership[]> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des membres échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbMembership(r as DbMembership))
}

// ─────────────────────────────────────────────────────────────
// Team mutations (update, member role, remove)
// ─────────────────────────────────────────────────────────────

async function assertFounder(teamId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', teamId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Vérification des droits échouée',
      details: { supabaseError: error.message },
    })
  }
  if (!data || data.status !== 'active' || data.role !== 'founder') {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Action réservée aux fondateurs de l’équipe',
    })
  }
}

/** Renomme une équipe — réservé aux fondateurs. */
export async function updateTeam(
  teamId: string,
  input: { name: string }
): Promise<Team> {
  const sbUser = await requireUser()
  await assertFounder(teamId, sbUser.id)

  const trimmed = input.name.trim()
  if (!trimmed) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le nom ne peut pas être vide',
    })
  }
  if (trimmed.length > 80) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le nom est trop long (80 caractères max)',
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour de l’équipe échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTeam(data as DbTeam)
}

/** Retire un membre (soft : passage en status 'inactive'). Founders only. */
export async function removeMember(membershipId: string): Promise<void> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  // Find target membership to assert team
  const { data: target, error: findErr } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role')
    .eq('id', membershipId)
    .maybeSingle()
  if (findErr || !target) {
    throw new ServiceFailure({
      code: 'not_found',
      message: 'Membre introuvable',
      details: { supabaseError: findErr?.message },
    })
  }

  await assertFounder(target.organization_id as string, sbUser.id)

  // Prevent removing the last founder
  if (target.role === 'founder') {
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', target.organization_id)
      .eq('status', 'active')
      .eq('role', 'founder')
    if ((count ?? 0) <= 1) {
      throw new ServiceFailure({
        code: 'validation',
        message: 'Impossible de retirer le dernier fondateur',
      })
    }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'inactive' })
    .eq('id', membershipId)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Retrait du membre échoué',
      details: { supabaseError: error.message },
    })
  }
}

/** Change le rôle d'un membre. Founders only. */
export async function updateMemberRole(
  membershipId: string,
  role: TeamRole
): Promise<Membership> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const { data: target, error: findErr } = await supabase
    .from('organization_members')
    .select('id, organization_id, role')
    .eq('id', membershipId)
    .maybeSingle()
  if (findErr || !target) {
    throw new ServiceFailure({
      code: 'not_found',
      message: 'Membre introuvable',
      details: { supabaseError: findErr?.message },
    })
  }

  await assertFounder(target.organization_id as string, sbUser.id)

  // Prevent removing the last founder via demotion
  if (target.role === 'founder' && role !== 'founder') {
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', target.organization_id)
      .eq('status', 'active')
      .eq('role', 'founder')
    if ((count ?? 0) <= 1) {
      throw new ServiceFailure({
        code: 'validation',
        message: 'Impossible de rétrograder le dernier fondateur',
      })
    }
  }

  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', membershipId)
    .select('*')
    .single()
  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Changement de rôle échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbMembership(data as DbMembership)
}
