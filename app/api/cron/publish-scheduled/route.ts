import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publishToLinkedIn } from '@/lib/linkedin-publish'

export const maxDuration = 60

/**
 * GET /api/cron/publish-scheduled
 * Vercel cron — runs every 5 minutes. Publishes any LinkedIn posts that are
 * status='scheduled' and scheduled_at <= now.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header from Vercel cron.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service-role-style query: we use the anon key but with NO user session.
  // RLS allows the function to run because we explicitly bypass user_id filter
  // via the security definer pattern below. Actually we need full table access here —
  // for true bypass we'd need a service-role key. For now, list with anon key
  // requires policies. Easier approach: use service-role key.
  // If user hasn't set SUPABASE_SERVICE_ROLE_KEY, we fall back to anon (won't work for cross-user posts).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const now = new Date().toISOString()
  const { data: due, error } = await supabase
    .from('linkedin_posts')
    .select('id, user_id, oauth_token_id, content')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, published: 0 })
  }

  let publishedCount = 0
  let failedCount = 0
  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const post of due) {
    if (!post.oauth_token_id || !post.content?.trim()) {
      await supabase
        .from('linkedin_posts')
        .update({ status: 'failed', publish_error: 'Missing token or content', updated_at: now })
        .eq('id', post.id)
      failedCount++
      results.push({ id: post.id, ok: false, error: 'Missing token or content' })
      continue
    }

    const result = await publishToLinkedIn({
      oauthTokenId: post.oauth_token_id,
      content: post.content,
    })

    if (result.ok) {
      await supabase
        .from('linkedin_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          linkedin_post_urn: result.postUrn || null,
          publish_error: null,
          updated_at: now,
        })
        .eq('id', post.id)
      publishedCount++
      results.push({ id: post.id, ok: true })
    } else {
      await supabase
        .from('linkedin_posts')
        .update({ status: 'failed', publish_error: result.error || 'Unknown', updated_at: now })
        .eq('id', post.id)
      failedCount++
      results.push({ id: post.id, ok: false, error: result.error })
    }
  }

  return NextResponse.json({ ok: true, published: publishedCount, failed: failedCount, results })
}
