'use server'

import * as svc from '@/lib/services/projects'
import { withResult } from './_result'
import type { CreateProjectInput } from '@/lib/services/projects'
import { requireUser } from '@/lib/supabase/auth-helpers'

export async function getProjectsAction(opts: { teamId?: string | null } = {}) {
  const sbUser = await requireUser()
  return withResult(svc.getProjectsForUser(sbUser.id, opts))
}

export async function createProjectAction(input: CreateProjectInput) {
  return withResult(svc.createProject(input))
}

export async function updateProjectAction(id: string, patch: Partial<CreateProjectInput>) {
  return withResult(svc.updateProject(id, patch))
}

export async function archiveProjectAction(id: string) {
  return withResult(svc.archiveProject(id))
}

export async function deleteProjectAction(id: string) {
  return withResult(svc.deleteProject(id))
}
