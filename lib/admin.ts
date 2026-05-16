'use client'

/**
 * Admin gating — hardcoded list of admin emails.
 *
 * Used to hide admin-only UI surfaces (e.g. /integrations-guide which
 * documents how to set up LinkedIn / Stripe / Google OAuth apps and is
 * irrelevant to end users).
 *
 * To add an admin, just append the email here. Server-side gating should
 * always re-check via Supabase RLS — this client check is for UX only.
 */
const ADMIN_EMAILS = new Set<string>([
  'marc.clby.972@gmail.com',
])

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.has(email.toLowerCase().trim())
}
