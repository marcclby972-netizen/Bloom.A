/**
 * Users service — wrapping Supabase Auth + user_settings table.
 *
 * The Supabase `auth.users` is the source of truth for identity.
 * `user_settings` (legacy table) stores app-level preferences.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type { User, UserSettings, UserRole } from '@/lib/v3-types'
import { isAdmin } from '@/lib/admin'

const DEFAULT_SETTINGS: UserSettings = {
  language: 'fr',
  timezone: 'Europe/Paris',
  notifications: { email: true, push: false },
}

/**
 * Returns the current authenticated user enriched with role + settings.
 * Throws `ServiceFailure('unauthorized')` if no session.
 */
export async function getCurrentUser(): Promise<User> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const { data: settingsRow } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', sbUser.id)
    .maybeSingle()

  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...((settingsRow?.settings as UserSettings | undefined) ?? {}),
  }

  const role: UserRole = isAdmin(sbUser.email) ? 'admin' : 'user'
  const meta = (sbUser.user_metadata ?? {}) as { name?: string; full_name?: string }

  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    name: meta.name ?? meta.full_name ?? null,
    role,
    settings,
    createdAt: sbUser.created_at,
  }
}

/**
 * Update the user profile. Splits between auth metadata (name) and
 * user_settings (preferences).
 */
export async function updateUserProfile(input: {
  name?: string
  settings?: Partial<UserSettings>
}): Promise<User> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  // 1. Name → auth user_metadata
  if (input.name !== undefined) {
    const { error } = await supabase.auth.updateUser({
      data: { name: input.name },
    })
    if (error) {
      throw new ServiceFailure({
        code: 'unknown',
        message: 'Mise à jour du profil échouée',
        details: { supabaseError: error.message },
      })
    }
  }

  // 2. Settings → user_settings table (upsert)
  if (input.settings) {
    const { data: existing } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', sbUser.id)
      .maybeSingle()

    const merged: UserSettings = {
      ...DEFAULT_SETTINGS,
      ...((existing?.settings as UserSettings | undefined) ?? {}),
      ...input.settings,
    }

    const { error } = await supabase.from('user_settings').upsert(
      { user_id: sbUser.id, settings: merged, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) {
      throw new ServiceFailure({
        code: 'unknown',
        message: 'Sauvegarde des préférences échouée',
        details: { supabaseError: error.message },
      })
    }
  }

  // Re-fetch to return the canonical state
  return getCurrentUser()
}

// ─────────────────────────────────────────────────────────────
// Auth mutations (email / password)
// ─────────────────────────────────────────────────────────────

/**
 * Update the email address — triggers a confirmation email by default
 * (cf. Supabase auth.updateUser). User must click the link in both old
 * and new mailbox to finalize the change.
 */
export async function updateUserEmail(newEmail: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const trimmed = newEmail.trim().toLowerCase()
  if (!trimmed || !trimmed.includes('@')) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Email invalide',
    })
  }
  const { error } = await supabase.auth.updateUser({ email: trimmed })
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: error.message || 'Changement d’email échoué',
      details: { supabaseError: error.message },
    })
  }
}

/**
 * Update password — re-authenticates with the current password first to
 * confirm identity, then sets the new one. Throws `validation` if the
 * current password is wrong (Supabase ne le vérifie pas par défaut sur
 * updateUser).
 */
export async function updateUserPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  if (input.newPassword.length < 8) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le mot de passe doit faire au moins 8 caractères',
    })
  }

  // Re-authenticate to confirm the current password is correct
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: sbUser.email ?? '',
    password: input.currentPassword,
  })
  if (signInErr) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Mot de passe actuel incorrect',
    })
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  })
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: error.message || 'Changement de mot de passe échoué',
      details: { supabaseError: error.message },
    })
  }
}

// ─────────────────────────────────────────────────────────────
// Account deletion & data export
// ─────────────────────────────────────────────────────────────

/**
 * Delete the current user's account.
 *
 * Côté Supabase, l'utilisateur courant ne peut pas supprimer son propre
 * `auth.users` row via le SDK client — il faut passer par la Admin API
 * (service role key). Comme on n'a pas de service role dispo côté
 * Next.js Server Component sans risquer de fuite, on procède en deux
 * étapes :
 *  1. Soft-delete dans les tables de l'app (memberships, etc.) via RLS
 *     (le user a les droits sur ses propres rows).
 *  2. Sign out + retour d'un flag indiquant que l'utilisateur doit
 *     contacter le support pour la suppression auth, OU appeler une
 *     edge function admin si configurée.
 *
 * Pour l'instant on fait un soft-delete cohérent : on déactive ses
 * memberships, on supprime ses settings, on sign-out. La row auth reste
 * et sera purgée par un cron côté admin (TODO infra).
 */
export async function deleteCurrentAccount(): Promise<void> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  // 1. Soft-delete memberships (set status = inactive)
  await supabase
    .from('memberships')
    .update({ status: 'inactive' })
    .eq('user_id', sbUser.id)

  // 2. Purge settings
  await supabase.from('user_settings').delete().eq('user_id', sbUser.id)

  // 3. Sign out — la row auth.users reste et sera purgée par l'admin.
  // Si tu as une Supabase edge function 'delete-user' avec service role,
  // c'est ici qu'il faudrait l'appeler avec sbUser.id.
  await supabase.auth.signOut()
}

/**
 * Export all the user's data as a JSON object — RGPD-friendly.
 * Le format est volontairement plat pour faciliter la portabilité.
 */
export async function exportCurrentUserData(): Promise<{
  exportedAt: string
  user: User
  memberships: unknown[]
  projects: unknown[]
  tasks: unknown[]
  timeEntries: unknown[]
  votes: unknown[]
}> {
  const sbUser = await requireUser()
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [
    { data: memberships },
    { data: projects },
    { data: tasks },
    { data: timeEntries },
    { data: votes },
  ] = await Promise.all([
    supabase.from('memberships').select('*').eq('user_id', sbUser.id),
    supabase.from('projects_v3').select('*').eq('owner_user_id', sbUser.id),
    supabase.from('tasks_v3').select('*').eq('assignee_user_id', sbUser.id),
    supabase.from('time_entries_v3').select('*').eq('user_id', sbUser.id),
    supabase.from('votes').select('*').eq('voter_user_id', sbUser.id),
  ])

  return {
    exportedAt: new Date().toISOString(),
    user,
    memberships: memberships ?? [],
    projects: projects ?? [],
    tasks: tasks ?? [],
    timeEntries: timeEntries ?? [],
    votes: votes ?? [],
  }
}
