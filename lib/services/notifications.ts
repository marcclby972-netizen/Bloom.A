/**
 * Notifications service — uses the legacy `notifications` table from the
 * collaborations migration. We add domain-level type safety on top via
 * the NotificationType union.
 *
 * Legacy schema:
 *   id, user_id, type, title, body, payload (jsonb), read (bool), created_at
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type { Notification, NotificationType } from '@/lib/v3-types'
import type { DbNotification } from '@/lib/v3-types/db'
import { fromDbNotification } from './_mappers'

export type CreateNotificationInput = {
  /** Recipient. */
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  payload?: Record<string, unknown>
}

/**
 * Server-side notification creation. RLS lets a user insert notifications
 * for any other user (since notifications fire from cross-user actions —
 * e.g. founder invites member). Reads are restricted to the owner.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  await requireUser() // any authed user can create
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title.trim(),
      body: input.body ?? null,
      payload: input.payload ?? {},
      read: false,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de la notification échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbNotification(data as DbNotification)
}

/**
 * List notifications for a user (newest first), with optional unread-only filter.
 */
export async function getUserNotifications(
  userId: string,
  opts: { unreadOnly?: boolean; limit?: number } = {}
): Promise<Notification[]> {
  const sbUser = await requireUser()
  if (userId !== sbUser.id) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux lire que tes propres notifications',
    })
  }

  const supabase = await createClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', sbUser.id)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.unreadOnly) query = query.eq('read', false)

  const { data, error } = await query
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des notifications échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbNotification(r as DbNotification))
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<Notification> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', sbUser.id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Marquage de la notification échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbNotification(data as DbNotification)
}

/**
 * Marks all unread notifications of the user as read.
 * Returns the count of updated rows.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const sbUser = await requireUser()
  if (userId !== sbUser.id) {
    throw new ServiceFailure({
      code: 'forbidden',
      message: 'Tu ne peux marquer que tes propres notifications',
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', sbUser.id)
    .eq('read', false)
    .select('id')

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Marquage global échoué',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).length
}
