/**
 * Projects service — projects_v3 table.
 *
 * Solo project = `team_id` null, owned by the user.
 * Team project = `team_id` set, accessible to all active members.
 *
 * RLS handles the access scoping.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type { Project, ProjectStatus } from '@/lib/v3-types'
import type { DbProject } from '@/lib/v3-types/db'
import { fromDbProject } from './_mappers'

/**
 * Returns all projects accessible to a user.
 * - `team` mode: projects of the given team
 * - `solo` mode (no teamId): only solo projects owned by this user
 */
export async function getProjectsForUser(
  userId: string,
  opts: { teamId?: string | null } = {}
): Promise<Project[]> {
  await requireUser()
  const supabase = await createClient()

  let query = supabase
    .from('projects_v3')
    .select('*')
    .order('updated_at', { ascending: false })

  if (opts.teamId === undefined) {
    // All projects RLS lets us see (solo + every team the user is in)
    // No additional filter.
  } else if (opts.teamId === null) {
    // Only solo projects
    query = query.is('team_id', null).eq('owner_user_id', userId)
  } else {
    query = query.eq('team_id', opts.teamId)
  }

  const { data, error } = await query
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des projets échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbProject(r as DbProject))
}

/**
 * Convenience alias used by some pages — same as getProjectsForUser with teamId.
 */
export async function getTeamProjects(teamId: string): Promise<Project[]> {
  const sbUser = await requireUser()
  return getProjectsForUser(sbUser.id, { teamId })
}

export type CreateProjectInput = {
  name: string
  description?: string
  /** null = projet solo, sinon team scope */
  teamId?: string | null
  color?: string | null
  dueDate?: string | null              // YYYY-MM-DD
  status?: ProjectStatus
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const name = input.name.trim()
  if (!name || name.length > 120) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le nom du projet doit faire entre 1 et 120 caractères',
    })
  }

  const { data, error } = await supabase
    .from('projects_v3')
    .insert({
      name,
      description: input.description ?? '',
      team_id: input.teamId ?? null,
      owner_user_id: sbUser.id,
      color: input.color ?? null,
      due_date: input.dueDate ?? null,
      status: input.status ?? 'active',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création du projet échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbProject(data as DbProject)
}

export async function updateProject(
  id: string,
  patch: Partial<CreateProjectInput>
): Promise<Project> {
  await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.description !== undefined) update.description = patch.description
  if (patch.color !== undefined) update.color = patch.color
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate
  if (patch.status !== undefined) update.status = patch.status
  if (patch.teamId !== undefined) update.team_id = patch.teamId

  const { data, error } = await supabase
    .from('projects_v3')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour du projet échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbProject(data as DbProject)
}

export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { status: 'archived' })
}

export async function deleteProject(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('projects_v3').delete().eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Suppression du projet échouée',
      details: { supabaseError: error.message },
    })
  }
}
