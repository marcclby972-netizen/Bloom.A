'use server'

import * as svc from '@/lib/services/notifications'
import type { CreateNotificationInput } from '@/lib/services/notifications'
import { withResult } from './_result'
import { requireUser } from '@/lib/supabase/auth-helpers'

export async function getNotificationsAction(opts: {
  unreadOnly?: boolean
  limit?: number
} = {}) {
  const sbUser = await requireUser()
  return withResult(svc.getUserNotifications(sbUser.id, opts))
}

export async function createNotificationAction(input: CreateNotificationInput) {
  return withResult(svc.createNotification(input))
}

export async function markNotificationAsReadAction(id: string) {
  return withResult(svc.markNotificationAsRead(id))
}

export async function markAllNotificationsAsReadAction() {
  const sbUser = await requireUser()
  return withResult(svc.markAllNotificationsAsRead(sbUser.id))
}
