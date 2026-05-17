/**
 * Result type for Server Actions.
 *
 * Server Actions throw `ServiceFailure` from the service layer when something
 * goes wrong. Hooks shouldn't have to wrap every call in try/catch.
 * The `withResult()` helper converts a throwing service call into a
 * serializable `Result<T>` that the client can pattern-match safely.
 *
 * Usage in an action file:
 *   'use server'
 *   import { withResult } from './_result'
 *   import * as users from '@/lib/services/users'
 *
 *   export const getCurrentUserAction = () => withResult(users.getCurrentUser())
 */

import type { ServiceError } from '@/lib/v3-types'
import { ServiceFailure } from '@/lib/supabase/auth-helpers'

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError }

export async function withResult<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise
    return { ok: true, data }
  } catch (e) {
    if (e instanceof ServiceFailure) {
      return {
        ok: false,
        error: { code: e.code, message: e.message, details: e.details },
      }
    }
    // Unknown error → wrap as 'unknown'
    return {
      ok: false,
      error: {
        code: 'unknown',
        message: e instanceof Error ? e.message : 'Erreur inconnue',
      },
    }
  }
}

/**
 * Type-narrowing helper for hooks:
 *   const r = await someAction()
 *   if (isOk(r)) console.log(r.data)
 *   else console.log(r.error.message)
 */
export function isOk<T>(r: Result<T>): r is { ok: true; data: T } {
  return r.ok
}
