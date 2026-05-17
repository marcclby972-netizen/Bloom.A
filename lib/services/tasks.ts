/**
 * Tasks service — tasks_v3 table.
 *
 * RLS = accès au projet parent (via la policy on tasks_v3).
 */

import { createClient } from '@/lib/supabase/server'
import { requireUser, ServiceFailure } from '@/lib/supabase/auth-helpers'
import type { Task, TaskStatus, TaskPriority } from '@/lib/v3-types'
import type { DbTask } from '@/lib/v3-types/db'
import { fromDbTask } from './_mappers'

/**
 * All tasks assigned to a user across all visible projects.
 */
export async function getTasksForUser(userId: string): Promise<Task[]> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks_v3')
    .select('*')
    .eq('assignee_user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des tâches assignées échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbTask(r as DbTask))
}

export async function getTasksForProject(projectId: string): Promise<Task[]> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks_v3')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Lecture des tâches échouée',
      details: { supabaseError: error.message },
    })
  }
  return (data ?? []).map((r) => fromDbTask(r as DbTask))
}

export type CreateTaskInput = {
  projectId: string
  title: string
  description?: string
  assigneeUserId?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const sbUser = await requireUser()
  const supabase = await createClient()

  const title = input.title.trim()
  if (!title || title.length > 200) {
    throw new ServiceFailure({
      code: 'validation',
      message: 'Le titre de la tâche doit faire entre 1 et 200 caractères',
    })
  }

  const { data, error } = await supabase
    .from('tasks_v3')
    .insert({
      project_id: input.projectId,
      title,
      description: input.description ?? '',
      assignee_user_id: input.assigneeUserId ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      due_date: input.dueDate ?? null,
      created_by: sbUser.id,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Création de la tâche échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTask(data as DbTask)
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks_v3')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour du statut échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTask(data as DbTask)
}

export async function updateTask(
  id: string,
  patch: Partial<CreateTaskInput>
): Promise<Task> {
  await requireUser()
  const supabase = await createClient()

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (patch.title !== undefined) update.title = patch.title.trim()
  if (patch.description !== undefined) update.description = patch.description
  if (patch.status !== undefined) update.status = patch.status
  if (patch.priority !== undefined) update.priority = patch.priority
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate
  if (patch.assigneeUserId !== undefined) update.assignee_user_id = patch.assigneeUserId

  const { data, error } = await supabase
    .from('tasks_v3')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Mise à jour de la tâche échouée',
      details: { supabaseError: error?.message },
    })
  }
  return fromDbTask(data as DbTask)
}

export async function deleteTask(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('tasks_v3').delete().eq('id', id)
  if (error) {
    throw new ServiceFailure({
      code: 'unknown',
      message: 'Suppression de la tâche échouée',
      details: { supabaseError: error.message },
    })
  }
}
