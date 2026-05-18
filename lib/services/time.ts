/**
 * Time service — time_entries_v3 table.
 *
 * Règle métier critique : un seul TimeEntry actif (ended_at null) par user
 * à la fois. Enforced à 2 niveaux :
 *  1. DB : index unique partiel `uniq_time_entries_v3_active_per_user`
 *  2. Service : `startTimer` stoppe automatiquement l'éventuel timer actif
 *     existant avant d'en créer un nouveau (UX: "switching project = stop+start").
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import { canStartTimer } from '@/lib/rules/timer-constraint'
import type { TimeEntry, TimePeriod, TimeStats } from '@/lib/v3-types'
import type { DbTimeEntry } from '@/lib/v3-types/db'
import { fromDbTimeEntry } from './_mappers'

/**
 * Returns the currently-active timer for a user (or null).
 */
export async function getActiveTimer(userId: string): Promise<TimeEntry | null> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('time_entries_v3')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle()

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture du timer actif échouée',
      details: { supabaseError: error.message },
    })
  }
  return data ? fromDbTimeEntry(data as DbTimeEntry) : null
}

/**
 * Start a new timer. If a timer is already active for this user, stop it first.
 *
 * Idempotent on "active on same project/task" : if the user is already
 * tracking the same project+task, this is a no-op (returns existing).
 */
export async function startTimer(input: {
  userId: string
  projectId?: string | null
  taskId?: string | null
  note?: string
}): Promise<TimeEntry> {
  const sbUser = await requireUser()
  if (input.userId !== sbUser.id) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux démarrer un timer que pour toi-même',
    })
  }

  const supabase = await createClient()
  const existingActive = await getActiveTimer(sbUser.id)

  // Pure rule: noop / switch / start
  const decision = canStartTimer(existingActive, {
    projectId: input.projectId,
    taskId: input.taskId,
  })
  if (decision === 'noop' && existingActive) return existingActive
  if (decision === 'switch') await stopTimer(sbUser.id)

  const { data, error } = await supabase
    .from('time_entries_v3')
    .insert({
      user_id: sbUser.id,
      project_id: input.projectId ?? null,
      task_id: input.taskId ?? null,
      note: input.note ?? '',
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error || !data) {
    // If unique constraint fired (race condition), try to recover
    if (error?.code === '23505') {
      throw new ServiceFailure({
        code: 'conflict',
        message: 'Un timer est déjà actif. Arrête-le d\'abord.',
        details: { supabaseError: error.message },
      })
    }
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Démarrage du timer échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTimeEntry(data as DbTimeEntry)
}

/**
 * Stop the currently-active timer for a user. No-op if no active timer.
 * Returns the stopped entry (with duration), or null if there was no active timer.
 */
export async function stopTimer(userId: string): Promise<TimeEntry | null> {
  const sbUser = await requireUser()
  if (userId !== sbUser.id) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux arrêter que ton propre timer',
    })
  }

  const supabase = await createClient()
  const active = await getActiveTimer(sbUser.id)
  if (!active) return null

  const { data, error } = await supabase
    .from('time_entries_v3')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', active.id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Arrêt du timer échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTimeEntry(data as DbTimeEntry)
}

/**
 * Returns time entries for a user within an optional date range.
 * Range: ISO timestamps (inclusive).
 */
export async function getTimeEntriesForUser(
  userId: string,
  opts: { from?: string; to?: string; projectId?: string } = {}
): Promise<TimeEntry[]> {
  await requireUser()
  const supabase = await createClient()

  let query = supabase
    .from('time_entries_v3')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (opts.from) query = query.gte('started_at', opts.from)
  if (opts.to) query = query.lte('started_at', opts.to)
  if (opts.projectId) query = query.eq('project_id', opts.projectId)

  const { data, error } = await query
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des entrées de temps échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbTimeEntry(r as DbTimeEntry))
}

/**
 * Returns time stats for a user over a period.
 * For 'all', no date filter.
 */
export async function getTimeStatsForUser(
  userId: string,
  opts: { period: TimePeriod } = { period: 'week' }
): Promise<TimeStats> {
  const now = new Date()
  let from: string | undefined
  let days = 1
  switch (opts.period) {
    case 'day':
      from = startOfDay(now).toISOString(); days = 1; break
    case 'week':
      from = startOfDays(now, 7).toISOString(); days = 7; break
    case 'month':
      from = startOfDays(now, 30).toISOString(); days = 30; break
    case 'all':
      from = undefined; days = 365; break
  }

  const entries = await getTimeEntriesForUser(userId, { from })

  // Only count completed entries for "totals" (active entry has null duration)
  let totalSeconds = 0
  const byProjectMap = new Map<string | null, number>()
  const byDayMap = new Map<string, number>()

  for (const e of entries) {
    if (e.durationSeconds == null) continue
    totalSeconds += e.durationSeconds
    byProjectMap.set(
      e.projectId,
      (byProjectMap.get(e.projectId) ?? 0) + e.durationSeconds
    )
    const dayKey = e.startedAt.slice(0, 10)
    byDayMap.set(dayKey, (byDayMap.get(dayKey) ?? 0) + e.durationSeconds)
  }

  return {
    totalSeconds,
    byProject: [...byProjectMap.entries()].map(([projectId, seconds]) => ({ projectId, seconds })),
    byDay: [...byDayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, seconds]) => ({ date, seconds })),
    entriesCount: entries.length,
    averagePerDaySeconds: days > 0 ? Math.round(totalSeconds / days) : 0,
  }
}

// ── helpers internes ────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function startOfDays(d: Date, n: number): Date {
  const x = startOfDay(d)
  x.setDate(x.getDate() - (n - 1))
  return x
}
