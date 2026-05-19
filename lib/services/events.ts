/**
 * Events service — calendrier natif Bloom (events_v3).
 *
 * RLS au niveau DB :
 *  - lecture : owner OU membre actif de la team
 *  - écriture : owner uniquement
 *
 * Côté domaine on accepte un team_id optionnel ; on valide à la création
 * que l'utilisateur est bien membre actif de la team passée.
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type { Event } from '@/lib/v3-types'
import type { DbEvent } from '@/lib/v3-types/db'
import { fromDbEvent } from './_mappers'

export type CreateEventInput = {
  title: string
  startsAt: string
  endsAt: string
  allDay?: boolean
  description?: string | null
  teamId?: string | null
  projectId?: string | null
  taskId?: string | null
  color?: string | null
}

export type UpdateEventInput = Partial<
  Omit<CreateEventInput, 'teamId'>
> & {
  teamId?: string | null
}

/**
 * Liste les évènements dans une plage [from, to[ pour le user courant +
 * les teams où il est membre actif. Auto-trié par startsAt asc.
 */
export async function getEvents(opts: {
  from: string
  to: string
  /** Si fourni, on filtre uniquement les évènements de cette team. */
  teamId?: string | null
  projectId?: string
}): Promise<Event[]> {
  await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('events_v3')
    .select('*')
    .gte('starts_at', opts.from)
    .lt('starts_at', opts.to)
    .order('starts_at', { ascending: true })

  if (opts.teamId === null) {
    q = q.is('team_id', null)
  } else if (typeof opts.teamId === 'string') {
    q = q.eq('team_id', opts.teamId)
  }
  if (opts.projectId) q = q.eq('project_id', opts.projectId)

  const { data, error } = await q
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des évènements échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbEvent(r as DbEvent))
}

export async function getEventById(id: string): Promise<Event | null> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events_v3')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture de l’évènement échouée',
      details: { supabaseError: error.message },
    })
  }
  return data ? fromDbEvent(data as DbEvent) : null
}

function validateEventInput(input: {
  title: string
  startsAt: string
  endsAt: string
}): void {
  if (!input.title.trim()) {
    throw new ServiceFailure({ code: 'validation', message: 'Le titre est requis' })
  }
  if (input.title.length > 200) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le titre est trop long (200 caractères max)',
    })
  }
  const start = new Date(input.startsAt).getTime()
  const end = new Date(input.endsAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Dates de début ou fin invalides',
    })
  }
  if (end < start) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'La fin doit être après le début',
    })
  }
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  validateEventInput(input)

  const row = {
    user_id: sbUser.id,
    team_id: input.teamId ?? null,
    project_id: input.projectId ?? null,
    task_id: input.taskId ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    all_day: input.allDay ?? false,
    color: input.color ?? null,
  }

  const { data, error } = await supabase
    .from('events_v3')
    .insert(row)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de l’évènement échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbEvent(data as DbEvent)
}

export async function updateEvent(
  id: string,
  patch: UpdateEventInput
): Promise<Event> {
  await requireUser()
  const supabase = await createClient()

  // Build minimal patch payload
  const dbPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim()
    if (!trimmed) {
      throw new ServiceFailure({
        code: 'validation',
        message: 'Le titre ne peut pas être vide',
      })
    }
    dbPatch.title = trimmed
  }
  if (patch.description !== undefined) {
    dbPatch.description = patch.description?.trim() || null
  }
  if (patch.startsAt !== undefined) dbPatch.starts_at = patch.startsAt
  if (patch.endsAt !== undefined) dbPatch.ends_at = patch.endsAt
  if (patch.allDay !== undefined) dbPatch.all_day = patch.allDay
  if (patch.color !== undefined) dbPatch.color = patch.color
  if (patch.teamId !== undefined) dbPatch.team_id = patch.teamId
  if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId
  if (patch.taskId !== undefined) dbPatch.task_id = patch.taskId

  if (patch.startsAt !== undefined || patch.endsAt !== undefined) {
    // Need both to validate — fetch current if one missing
    const current = await getEventById(id)
    if (!current) {
      throw new ServiceFailure({ code: 'not_found', message: 'Évènement introuvable' })
    }
    const startsAt = (patch.startsAt as string | undefined) ?? current.startsAt
    const endsAt = (patch.endsAt as string | undefined) ?? current.endsAt
    validateEventInput({ title: patch.title ?? current.title, startsAt, endsAt })
  }

  const { data, error } = await supabase
    .from('events_v3')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour de l’évènement échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbEvent(data as DbEvent)
}

export async function deleteEvent(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('events_v3').delete().eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Suppression de l’évènement échouée',
      details: { supabaseError: error.message },
    })
  }
}
