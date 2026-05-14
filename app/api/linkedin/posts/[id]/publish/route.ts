import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishToLinkedIn } from '@/lib/linkedin-publish'

export const maxDuration = 30

/**
 * POST /api/linkedin/posts/[id]/publish — publish a draft/scheduled post NOW
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the post
  const { data: post, error: fetchErr } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (fetchErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status === 'published') return NextResponse.json({ error: 'Already published' }, { status: 400 })
  if (!post.oauth_token_id) return NextResponse.json({ error: 'No LinkedIn account selected for this post' }, { status: 400 })
  if (!post.content?.trim()) return NextResponse.json({ error: 'Post content is empty' }, { status: 400 })

  const result = await publishToLinkedIn({
    oauthTokenId: post.oauth_token_id,
    content: post.content,
  })

  if (!result.ok) {
    await supabase
      .from('linkedin_posts')
      .update({ status: 'failed', publish_error: result.error || 'Unknown', updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  await supabase
    .from('linkedin_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      linkedin_post_urn: result.postUrn || null,
      publish_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ ok: true, postUrn: result.postUrn })
}
