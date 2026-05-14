import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

/**
 * POST /api/integrations-guide/verify
 * Body: { code: string }
 * Returns: { ok: boolean }
 *
 * The code is compared against INTEGRATIONS_GUIDE_CODE env var server-side
 * so the secret is never shipped to the client bundle.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const expected = process.env.INTEGRATIONS_GUIDE_CODE
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'Code not configured on server' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const provided = typeof body.code === 'string' ? body.code : ''

  // Constant-time comparison to mitigate timing attacks
  const ok = provided.length === expected.length && (() => {
    let mismatch = 0
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i)
    }
    return mismatch === 0
  })()

  if (!ok) {
    // Small delay to slow brute force
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
