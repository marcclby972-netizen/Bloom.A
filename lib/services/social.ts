/**
 * Social service — content planner multi-plateforme.
 *
 * Tables :
 *  - social_drafts_v3 : posts (brouillon/planifié/publié) par plateforme
 *  - social_targets_v3 : objectifs per_day / per_week par user × plateforme
 *
 * RLS : user_id = auth.uid() (user-scoped strict).
 *
 * Plan gating : marketing_drafts est exigé (free → bloqué).
 *               targets reste accessible à tous les plans (juste affichage).
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import { assertPlanFeature } from './_plan'
import type {
  SocialDraft,
  SocialDraftStatus,
  SocialPlatform,
  SocialTarget,
} from '@/lib/v3-types'
import type { DbSocialDraft, DbSocialTarget } from '@/lib/v3-types/db'

// ─────────────────────────────────────────────────────────────
// Mappers DB ↔ Domain
// ─────────────────────────────────────────────────────────────

function fromDbDraft(row: DbSocialDraft): SocialDraft {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    platform: row.platform,
    title: row.title,
    content: row.content,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fromDbTarget(row: DbSocialTarget): SocialTarget {
  return {
    userId: row.user_id,
    platform: row.platform,
    targetPerDay: row.target_per_day,
    targetPerWeek: row.target_per_week,
    updatedAt: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Drafts CRUD
// ─────────────────────────────────────────────────────────────

export type CreateSocialDraftInput = {
  platform: SocialPlatform
  title: string
  content: string
  scheduledAt?: string | null
  status?: SocialDraftStatus
  teamId?: string | null
}

export async function getDrafts(opts: {
  from?: string // ISO date
  to?: string
  platform?: SocialPlatform
} = {}): Promise<SocialDraft[]> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('social_drafts_v3')
    .select('*')
    .eq('user_id', sbUser.id)
    .order('created_at', { ascending: false })

  if (opts.platform) q = q.eq('platform', opts.platform)
  if (opts.from) q = q.gte('created_at', opts.from)
  if (opts.to) q = q.lte('created_at', opts.to)

  const { data, error } = await q
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des brouillons échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbDraft(r as DbSocialDraft))
}

export async function createDraft(input: CreateSocialDraftInput): Promise<SocialDraft> {
  const sbUser = await requireUser()
  await assertPlanFeature(
    sbUser,
    'marketing_drafts',
    'Le module marketing nécessite le plan Solo ou Team.'
  )
  const supabase = await createClient()

  const title = input.title.trim()
  const content = input.content.trim()
  if (!title || title.length > 200) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le titre doit faire entre 1 et 200 caractères',
    })
  }
  if (!content || content.length > 5000) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le contenu doit faire entre 1 et 5000 caractères',
    })
  }

  const status: SocialDraftStatus =
    input.status ?? (input.scheduledAt ? 'planifie' : 'brouillon')

  const { data, error } = await supabase
    .from('social_drafts_v3')
    .insert({
      user_id: sbUser.id,
      team_id: input.teamId ?? null,
      platform: input.platform,
      title,
      content,
      status,
      scheduled_at: input.scheduledAt ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création du brouillon échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbDraft(data as DbSocialDraft)
}

export async function updateDraft(
  id: string,
  patch: Partial<Omit<CreateSocialDraftInput, 'teamId'>> & {
    status?: SocialDraftStatus
  }
): Promise<SocialDraft> {
  await requireUser()
  const supabase = await createClient()

  const dbPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title.trim()
  if (patch.content !== undefined) dbPatch.content = patch.content.trim()
  if (patch.platform !== undefined) dbPatch.platform = patch.platform
  if (patch.scheduledAt !== undefined) dbPatch.scheduled_at = patch.scheduledAt
  if (patch.status !== undefined) dbPatch.status = patch.status

  const { data, error } = await supabase
    .from('social_drafts_v3')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour du brouillon échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbDraft(data as DbSocialDraft)
}

export async function deleteDraft(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from('social_drafts_v3')
    .delete()
    .eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Suppression du brouillon échouée',
      details: { supabaseError: error.message },
    })
  }
}

/** Marque un brouillon comme publié (set published_at = now, status='publie'). */
export async function markPublished(id: string): Promise<SocialDraft> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_drafts_v3')
    .update({
      status: 'publie' as SocialDraftStatus,
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Marquage publié échoué',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbDraft(data as DbSocialDraft)
}

// ─────────────────────────────────────────────────────────────
// Targets
// ─────────────────────────────────────────────────────────────

export async function getTargets(): Promise<SocialTarget[]> {
  const sbUser = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_targets_v3')
    .select('*')
    .eq('user_id', sbUser.id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des objectifs échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbTarget(r as DbSocialTarget))
}

export async function upsertTarget(input: {
  platform: SocialPlatform
  targetPerDay: number
  targetPerWeek: number
}): Promise<SocialTarget> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  if (input.targetPerDay < 0 || input.targetPerWeek < 0) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Les objectifs doivent être ≥ 0',
    })
  }

  const { data, error } = await supabase
    .from('social_targets_v3')
    .upsert(
      {
        user_id: sbUser.id,
        platform: input.platform,
        target_per_day: input.targetPerDay,
        target_per_week: input.targetPerWeek,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    )
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Sauvegarde de l’objectif échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTarget(data as DbSocialTarget)
}
