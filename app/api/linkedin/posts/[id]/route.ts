import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const allowed: Record<string, unknown> = {}
  for (const key of ['oauth_token_id', 'status', 'brief', 'objective', 'style', 'title', 'content', 'media_urls', 'hashtags', 'scheduled_at', 'project_id']) {
    if (body[key] !== undefined) allowed[key] = body[key]
  }
  if (Object.keys(allowed).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  allowed.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('linkedin_posts')
    .update(allowed)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ post: data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('linkedin_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}
