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
