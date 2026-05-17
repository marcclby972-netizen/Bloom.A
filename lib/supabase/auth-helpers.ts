/**
 * Helpers d'auth réutilisés par tous les services côté serveur.
 *
 * Convention :
 * - `requireUser()` : lève une erreur typée `ServiceError` si pas de session.
 *   À utiliser dans tous les services qui nécessitent un user.
 * - `getOptionalUser()` : retourne null si pas de session (pour landing, etc.).
 */

import { createClient } from './server'
import type { ServiceError } from '@/lib/v3-types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export class ServiceFailure extends Error {
  readonly code: ServiceError['code']
  readonly details?: Record<string, unknown>

  constructor(error: ServiceError) {
    super(error.message)
    this.code = error.code
    this.details = error.details
    this.name = 'ServiceFailure'
  }
}

/**
 * Returns the current Supabase user. Throws a ServiceFailure if no session.
 * Use in Server Components or Route Handlers that need an authenticated user.
 */
export async function requireUser(): Promise<SupabaseUser> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new ServiceFailure({
      code: 'unauthorized',
      message: 'Authentification requise',
      details: error ? { supabaseError: error.message } : undefined,
    })
  }

  return user
}

/** Returns user or null. Use for optional auth (public pages, etc.). */
export async function getOptionalUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
