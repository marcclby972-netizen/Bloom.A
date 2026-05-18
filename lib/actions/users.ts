'use server'

import * as svc from '@/lib/services/users'
import { withResult } from './_result'
import type { UserSettings } from '@/lib/v3-types'

export async function getCurrentUserAction() {
  return withResult(svc.getCurrentUser())
}

export async function updateUserProfileAction(input: {
  name?: string
  settings?: Partial<UserSettings>
}) {
  return withResult(svc.updateUserProfile(input))
}

export async function updateUserEmailAction(newEmail: string) {
  return withResult(svc.updateUserEmail(newEmail))
}

export async function updateUserPasswordAction(input: {
  currentPassword: string
  newPassword: string
}) {
  return withResult(svc.updateUserPassword(input))
}

export async function deleteCurrentAccountAction() {
  return withResult(svc.deleteCurrentAccount())
}

export async function exportCurrentUserDataAction() {
  return withResult(svc.exportCurrentUserData())
}
