import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 15

/**
 * GET  /api/linkedin/posts            — list all posts for current user
 * POST /api/linkedin/posts            — create a new post (any status)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ posts: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const allowed: Record<string, unknown> = { user_id: user.id }
  for (const key of ['oauth_token_id', 'status', 'brief', 'objective', 'style', 'title', 'content', 'media_urls', 'hashtags', 'scheduled_at', 'project_id']) {
    if (body[key] !== undefined) allowed[key] = body[key]
  }
  // Validate status if provided
  if (allowed.status && !['idea', 'draft', 'scheduled', 'published'].includes(String(allowed.status))) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (allowed.status === 'scheduled' && !allowed.scheduled_at) {
    return NextResponse.json({ error: 'scheduled_at required when status=scheduled' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('linkedin_posts')
    .insert(allowed)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ post: data })
}
