'use server'

import * as svc from '@/lib/services/social'
import { withResult } from './_result'
import type { CreateSocialDraftInput } from '@/lib/services/social'
import type {
  SocialPlatform,
  SocialDraftStatus,
} from '@/lib/v3-types'

export async function getDraftsAction(opts: {
  from?: string
  to?: string
  platform?: SocialPlatform
} = {}) {
  return withResult(svc.getDrafts(opts))
}

export async function createDraftAction(input: CreateSocialDraftInput) {
  return withResult(svc.createDraft(input))
}

export async function updateDraftAction(
  id: string,
  patch: Partial<Omit<CreateSocialDraftInput, 'teamId'>> & {
    status?: SocialDraftStatus
  }
) {
  return withResult(svc.updateDraft(id, patch))
}

export async function deleteDraftAction(id: string) {
  return withResult(svc.deleteDraft(id))
}

export async function markPublishedAction(id: string) {
  return withResult(svc.markPublished(id))
}

export async function getTargetsAction() {
  return withResult(svc.getTargets())
}

export async function upsertTargetAction(input: {
  platform: SocialPlatform
  targetPerDay: number
  targetPerWeek: number
}) {
  return withResult(svc.upsertTarget(input))
}
