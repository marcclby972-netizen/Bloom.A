import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

/**
 * POST /api/notifications/respond
 * Body: { inviteId: string, accept: boolean }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { inviteId, accept } = body
  if (!inviteId || typeof accept !== 'boolean') {
    return NextResponse.json({ error: 'inviteId and accept required' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('respond_project_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (data?.ok === false) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
