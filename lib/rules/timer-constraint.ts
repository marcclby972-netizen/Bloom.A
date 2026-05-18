/**
 * Pure timer-constraint check — "1 active timer per user".
 *
 * Used by:
 *  - `lib/services/time.ts:startTimer` to decide whether to no-op,
 *    auto-stop the previous active entry, or just create a new one.
 *  - Unit tests (no Supabase mock needed).
 */

import type { TimeEntry } from '@/lib/v3-types'

export type StartIntent = {
  projectId?: string | null
  taskId?: string | null
}

export type StartDecision =
  /** No active timer — proceed to insert a new entry. */
  | 'start'
  /** Active timer is on the same projectId+taskId — return it as-is. */
  | 'noop'
  /** Active timer is on a different (project, task) — stop it then start the new one. */
  | 'switch'

/**
 * Pure decision for `startTimer()`. Doesn't touch the DB.
 */
export function canStartTimer(
  active: TimeEntry | null,
  intent: StartIntent
): StartDecision {
  if (active === null) return 'start'

  const sameProject = (active.projectId ?? null) === (intent.projectId ?? null)
  const sameTask = (active.taskId ?? null) === (intent.taskId ?? null)
  if (sameProject && sameTask) return 'noop'

  return 'switch'
}
