'use client'

/**
 * Cloud sync layer — pushes localStorage data to Supabase and pulls from cloud.
 *
 * Strategy:
 * - localStorage is the synchronous cache the UI reads from.
 * - Every mutation writes to localStorage immediately AND fires a debounced upsert to Supabase.
 * - On app mount: pull all rows for the authenticated user, replace localStorage cache.
 * - On first load with empty cloud + non-empty local cache: push local cache to cloud (migration).
 * - On window focus: re-pull from cloud to catch updates made on other devices.
 */

import { createClient } from './supabase/client'
import type {
  Task, TodoItem, Contact, Interaction, Post, Project, ProjectNote,
  VocalProject, VocalNote, PromptNote, Category, TimeEntry, Goal, AppSettings,
} from './types'

const KEYS = {
  tasks: 'bloom_tasks',
  categories: 'bloom_categories',
  timeEntries: 'bloom_time_entries',
  goals: 'bloom_goals',
  contacts: 'bloom_contacts',
  interactions: 'bloom_interactions',
  posts: 'bloom_posts',
  vocalProjects: 'bloom_vocal_projects',
  vocalNotes: 'bloom_vocal_notes',
  promptNotes: 'bloom_prompt_notes',
  projects: 'bloom_projects',
  projectNotes: 'bloom_project_notes',
  todos: 'bloom_todos',
  settings: 'bloom_settings',
} as const

const MIGRATION_FLAG = 'bloom_cloud_migration_done'

// ── Camel ↔ snake mapping helpers ──

type AnyRecord = Record<string, unknown>

// Recursive snake → camel converter for incoming rows
function snakeToCamel<T>(row: AnyRecord): T {
  const out: AnyRecord = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    out[camel] = v
  }
  return out as T
}

function camelToSnake(row: AnyRecord): AnyRecord {
  const out: AnyRecord = {}
  for (const [k, v] of Object.entries(row)) {
    const snake = k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
    out[snake] = v
  }
  return out
}

// ── Entity definitions ──

type EntityKey = keyof typeof KEYS
type TableName =
  | 'tasks' | 'todos' | 'contacts' | 'interactions' | 'posts'
  | 'projects' | 'project_notes' | 'vocal_projects' | 'vocal_notes'
  | 'prompt_notes' | 'categories' | 'time_entries' | 'goals'

const ENTITY_TABLE_MAP: Record<Exclude<EntityKey, 'settings'>, TableName> = {
  tasks: 'tasks',
  todos: 'todos',
  contacts: 'contacts',
  interactions: 'interactions',
  posts: 'posts',
  projects: 'projects',
  projectNotes: 'project_notes',
  vocalProjects: 'vocal_projects',
  vocalNotes: 'vocal_notes',
  promptNotes: 'prompt_notes',
  categories: 'categories',
  timeEntries: 'time_entries',
  goals: 'goals',
}

// ── State ──

let supabase: ReturnType<typeof createClient> | null = null
let currentUserId: string | null = null
let initialized = false
let pendingUpserts = new Map<string, ReturnType<typeof setTimeout>>()

function getClient() {
  if (!supabase) supabase = createClient()
  return supabase
}

// ── localStorage helpers ──

function readLocal<T = AnyRecord>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function writeLocal(key: string, data: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Public API ──

/**
 * Initialize sync: load user, pull all data from Supabase, merge with local, push back if needed.
 * Returns true if init succeeded.
 */
export async function initCloudSync(): Promise<{ ok: boolean; userId: string | null }> {
  if (typeof window === 'undefined') return { ok: false, userId: null }
  if (initialized && currentUserId) return { ok: true, userId: currentUserId }

  const client = getClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { ok: false, userId: null }
  currentUserId = user.id

  const migrationDone = localStorage.getItem(MIGRATION_FLAG) === user.id

  // Pull all tables from cloud
  const cloudData: Partial<Record<Exclude<EntityKey, 'settings'>, AnyRecord[]>> = {}
  for (const [entityKey, table] of Object.entries(ENTITY_TABLE_MAP) as [Exclude<EntityKey, 'settings'>, TableName][]) {
    const { data, error } = await client.from(table).select('*').eq('user_id', user.id)
    if (error) {
      console.warn(`[cloud-sync] Failed to load ${table}:`, error.message)
      continue
    }
    cloudData[entityKey] = data || []
  }

  // Pull settings (single row, jsonb)
  const { data: settingsRow } = await client
    .from('user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .single()

  // First time migration: cloud is empty but local has data → push local to cloud
  if (!migrationDone) {
    let pushed = 0
    for (const [entityKey, table] of Object.entries(ENTITY_TABLE_MAP) as [Exclude<EntityKey, 'settings'>, TableName][]) {
      const cloudRows = cloudData[entityKey] || []
      const localRows = readLocal(KEYS[entityKey])
      if (cloudRows.length === 0 && localRows.length > 0) {
        const toUpsert = localRows.map((r) => ({
          ...camelToSnake(r as AnyRecord),
          user_id: user.id,
        }))
        const { error } = await client.from(table).upsert(toUpsert, { onConflict: 'id' })
        if (error) {
          console.warn(`[cloud-sync] Migration push failed for ${table}:`, error.message)
        } else {
          pushed += toUpsert.length
          cloudData[entityKey] = toUpsert
        }
      }
    }

    // Migrate settings
    if (!settingsRow) {
      const localSettings = localStorage.getItem(KEYS.settings)
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings)
          await client.from('user_settings').upsert({ user_id: user.id, settings: parsed }, { onConflict: 'user_id' })
        } catch {/* ignore */}
      }
    }

    localStorage.setItem(MIGRATION_FLAG, user.id)
    if (pushed > 0) console.log(`[cloud-sync] Migrated ${pushed} local rows to cloud`)
  }

  // Replace local cache with cloud data
  for (const [entityKey, rows] of Object.entries(cloudData) as [Exclude<EntityKey, 'settings'>, AnyRecord[]][]) {
    if (!rows) continue
    const camelRows = rows.map((r) => {
      const { user_id, created_at, updated_at, ...rest } = r as Record<string, unknown>
      void user_id; void created_at; void updated_at
      return snakeToCamel(rest)
    })
    writeLocal(KEYS[entityKey], camelRows)
  }

  if (settingsRow?.settings) {
    writeLocal(KEYS.settings, settingsRow.settings)
  }

  initialized = true
  return { ok: true, userId: user.id }
}

/**
 * Queue an upsert for a single record. Debounced per-record-id.
 */
export function queueUpsert(entityKey: Exclude<EntityKey, 'settings'>, record: AnyRecord) {
  if (!currentUserId) return
  const table = ENTITY_TABLE_MAP[entityKey]
  const id = record.id as string
  if (!id) return
  const key = `${table}:${id}`
  const existing = pendingUpserts.get(key)
  if (existing) clearTimeout(existing)
  pendingUpserts.set(key, setTimeout(async () => {
    pendingUpserts.delete(key)
    const client = getClient()
    const row = { ...camelToSnake(record), user_id: currentUserId }
    const { error } = await client.from(table).upsert(row, { onConflict: 'id' })
    if (error) console.warn(`[cloud-sync] Upsert ${table}/${id} failed:`, error.message)
  }, 500))
}

/**
 * Queue a delete.
 */
export function queueDelete(entityKey: Exclude<EntityKey, 'settings'>, id: string) {
  if (!currentUserId) return
  const table = ENTITY_TABLE_MAP[entityKey]
  setTimeout(async () => {
    const client = getClient()
    const { error } = await client.from(table).delete().eq('id', id).eq('user_id', currentUserId)
    if (error) console.warn(`[cloud-sync] Delete ${table}/${id} failed:`, error.message)
  }, 100)
}

/**
 * Sync the whole settings blob.
 */
export function queueSettingsSync(settings: AppSettings) {
  if (!currentUserId) return
  const key = 'settings'
  const existing = pendingUpserts.get(key)
  if (existing) clearTimeout(existing)
  pendingUpserts.set(key, setTimeout(async () => {
    pendingUpserts.delete(key)
    const client = getClient()
    const { error } = await client.from('user_settings').upsert(
      { user_id: currentUserId, settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) console.warn('[cloud-sync] Settings upsert failed:', error.message)
  }, 500))
}

/**
 * Re-pull all data from cloud (no migration). Called on window focus.
 */
export async function refreshFromCloud(): Promise<void> {
  if (!currentUserId) return
  const client = getClient()
  for (const [entityKey, table] of Object.entries(ENTITY_TABLE_MAP) as [Exclude<EntityKey, 'settings'>, TableName][]) {
    const { data, error } = await client.from(table).select('*').eq('user_id', currentUserId)
    if (error) continue
    const camelRows = (data || []).map((r: AnyRecord) => {
      const { user_id, created_at, updated_at, ...rest } = r as Record<string, unknown>
      void user_id; void created_at; void updated_at
      return snakeToCamel(rest)
    })
    writeLocal(KEYS[entityKey], camelRows)
  }
  const { data: settingsRow } = await client
    .from('user_settings').select('settings').eq('user_id', currentUserId).single()
  if (settingsRow?.settings) writeLocal(KEYS.settings, settingsRow.settings)
}

export function isCloudSyncReady(): boolean {
  return initialized && currentUserId !== null
}

export function getCurrentUserId(): string | null {
  return currentUserId
}

// Avoid unused-import warnings for entity types — they're exported in case consumers want them
export type {
  Task, TodoItem, Contact, Interaction, Post, Project, ProjectNote,
  VocalProject, VocalNote, PromptNote, Category, TimeEntry, Goal,
}
