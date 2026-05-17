/**
 * Bloom v3 — Server Actions barrel.
 *
 * Re-exports all server actions. Each is a thin 'use server' wrapper around
 * a service that returns a `Result<T>` (no throw — typed errors).
 *
 * Usage:
 *   import { getCurrentUserAction } from '@/lib/actions'
 *
 * Note : a barrel like this is fine for actions because each file already
 * has its own 'use server' directive. The barrel itself is just re-exports.
 */

export * from './users'
export * from './teams'
export * from './projects'
export * from './tasks'
export * from './time'
export * from './governance'
export * from './notifications'
export type { Result } from './_result'
export { isOk } from './_result'
