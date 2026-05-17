/**
 * Bloom v3 — Services barrel.
 *
 * Re-exports all v3 services. Usage:
 *   import { getCurrentUser, startTimer } from '@/lib/services'
 *
 * Each service is server-only — they call `await createClient()` from
 * `@/lib/supabase/server` which uses `next/headers`. Only use in:
 *  - Server Components
 *  - Server Actions
 *  - Route Handlers
 *
 * Client components should use the hooks layer (`@/hooks/*`) which
 * wraps server actions / fetch calls — never import these directly
 * from a 'use client' file.
 */

export * from './users'
export * from './teams'
export * from './projects'
export * from './tasks'
export * from './time'
export * from './governance'
export * from './notifications'

// Auth helper re-export for convenience
export { requireUser, getOptionalUser, ServiceFailure } from '../supabase/auth-helpers'
