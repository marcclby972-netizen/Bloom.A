'use server'

import * as svc from '@/lib/services/tasks'
import type { CreateTaskInput } from '@/lib/services/tasks'
import { withResult } from './_result'
import { requireUser } from '@/lib/supabase/auth-helpers'
import type { TaskStatus } from '@/lib/v3-types'

export async function getTasksForUserAction(userId?: string) {
  const sbUser = await requireUser()
  return withResult(svc.getTasksForUser(userId ?? sbUser.id))
}

export async function getTasksForProjectAction(projectId: string) {
  return withResult(svc.getTasksForProject(projectId))
}

export async function createTaskAction(input: CreateTaskInput) {
  return withResult(svc.createTask(input))
}

export async function updateTaskAction(id: string, patch: Partial<CreateTaskInput>) {
  return withResult(svc.updateTask(id, patch))
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  return withResult(svc.updateTaskStatus(id, status))
}

export async function deleteTaskAction(id: string) {
  return withResult(svc.deleteTask(id))
}
