/**
 * Cron : rappel chrono > 4h
 *
 * Schedule : toutes les 30 min (cf. vercel.json — `crons[0].schedule`)
 *
 * Pour chaque time_entry encore active (ended_at IS NULL) dont started_at
 * remonte à > 4h, on insère une notification `timer_reminder` pour le user
 * — sauf si une notif similaire existe déjà depuis moins de 4h
 * (anti-spam).
 *
 * Authentification : Vercel cron envoie un header
 * Authorization: Bearer <CRON_SECRET>. Si la var n'est pas définie, on
 * accepte en dev mais on log un warning.
 *
 * IMPORTANT : route protégée par CRON_SECRET — penser à le configurer
 * dans Vercel project env. Génère avec `openssl rand -hex 32`.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FOUR_HOURS_SEC = 4 * 3600

/**
 * Log structuré JSON pour Vercel Runtime Logs.
 * Pas de dépendance OTel — `console.log` suffit, Vercel capture stdout.
 * Recherchable via `vercel logs --search='[cron:chrono-reminder]'`.
 */
function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown> = {}
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    tag: '[cron:chrono-reminder]',
    level,
    event,
    ...data,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export async function GET(req: Request) {
  const startMs = Date.now()
  log('info', 'invocation_start', { headers_present: !!req.headers })

  // ─── Auth : Bearer <CRON_SECRET> ───
  const auth = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected) {
    if (auth !== `Bearer ${expected}`) {
      log('warn', 'unauthorized', { has_auth_header: !!auth })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    log('error', 'missing_cron_secret_in_prod')
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }

  // ─── Service-role client (bypass RLS pour scan multi-users) ───
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    log('error', 'missing_supabase_env', {
      has_url: !!supabaseUrl,
      has_service_role: !!serviceRoleKey,
    })
    return NextResponse.json(
      { error: 'Supabase service-role env missing' },
      { status: 500 }
    )
  }
  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // ─── 1. Timers actifs depuis > 4h ───
  const cutoff = new Date(Date.now() - FOUR_HOURS_SEC * 1000).toISOString()
  const { data: longRunning, error: queryErr } = await sb
    .from('time_entries_v3')
    .select('id, user_id, started_at, project_id')
    .is('ended_at', null)
    .lt('started_at', cutoff)

  if (queryErr) {
    log('error', 'query_long_running_failed', { error: queryErr.message })
    return NextResponse.json(
      { error: 'Query failed', details: queryErr.message },
      { status: 500 }
    )
  }

  if (!longRunning || longRunning.length === 0) {
    log('info', 'invocation_end', {
      scanned: 0,
      reminded: 0,
      duration_ms: Date.now() - startMs,
    })
    return NextResponse.json({ ok: true, reminded: 0, scanned: 0 })
  }

  // ─── 2. Filtrer : anti-spam (déjà notifié dans les 4h ?) ───
  const userIds = Array.from(
    new Set(longRunning.map((r) => (r as { user_id: string }).user_id))
  )
  const sinceIso = cutoff
  const { data: recentNotifs, error: notifQueryErr } = await sb
    .from('notifications')
    .select('user_id')
    .in('user_id', userIds)
    .eq('type', 'timer_reminder')
    .gte('created_at', sinceIso)

  if (notifQueryErr) {
    log('warn', 'query_recent_notifs_failed', { error: notifQueryErr.message })
    // On continue quand même — pire cas on re-notifie, pas grave.
  }

  const alreadyNotified = new Set(
    (recentNotifs ?? []).map((n) => (n as { user_id: string }).user_id)
  )

  // ─── 3. Insertion ───
  const toInsert = longRunning
    .filter((r) => !alreadyNotified.has((r as { user_id: string }).user_id))
    .map((r) => {
      const row = r as {
        id: string
        user_id: string
        started_at: string
        project_id: string | null
      }
      const startedAtMs = new Date(row.started_at).getTime()
      const elapsedHours = Math.floor((Date.now() - startedAtMs) / 3600_000)
      return {
        user_id: row.user_id,
        type: 'timer_reminder' as const,
        title: 'Chrono en cours depuis longtemps',
        body: `Ton chrono tourne depuis ${elapsedHours}h — pense à faire une pause.`,
        payload: { entry_id: row.id, project_id: row.project_id },
        read: false,
      }
    })

  if (toInsert.length === 0) {
    log('info', 'invocation_end', {
      scanned: longRunning.length,
      reminded: 0,
      already_notified: alreadyNotified.size,
      duration_ms: Date.now() - startMs,
      reason: 'all_already_notified',
    })
    return NextResponse.json({
      ok: true,
      reminded: 0,
      scanned: longRunning.length,
      reason: 'all_already_notified',
    })
  }

  const { error: insertErr } = await sb.from('notifications').insert(toInsert)
  if (insertErr) {
    log('error', 'insert_notifs_failed', {
      error: insertErr.message,
      attempted: toInsert.length,
    })
    return NextResponse.json(
      { error: 'Insert failed', details: insertErr.message },
      { status: 500 }
    )
  }

  log('info', 'invocation_end', {
    scanned: longRunning.length,
    reminded: toInsert.length,
    already_notified: alreadyNotified.size,
    duration_ms: Date.now() - startMs,
  })

  return NextResponse.json({
    ok: true,
    reminded: toInsert.length,
    scanned: longRunning.length,
  })
}
