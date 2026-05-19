'use server'

import * as svc from '@/lib/services/events'
import { withResult } from './_result'
import type { CreateEventInput, UpdateEventInput } from '@/lib/services/events'

export async function getEventsAction(opts: {
  from: string
  to: string
  teamId?: string | null
  projectId?: string
}) {
  return withResult(svc.getEvents(opts))
}

export async function getEventByIdAction(id: string) {
  return withResult(svc.getEventById(id))
}

export async function createEventAction(input: CreateEventInput) {
  return withResult(svc.createEvent(input))
}

export async function updateEventAction(id: string, patch: UpdateEventInput) {
  return withResult(svc.updateEvent(id, patch))
}

export async function deleteEventAction(id: string) {
  return withResult(svc.deleteEvent(id))
}
