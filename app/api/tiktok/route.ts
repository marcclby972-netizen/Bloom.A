import { NextResponse } from 'next/server'
import { getTokens, getTokenByAccount, refreshTokenIfNeeded, deleteTokenById, deleteAllTokens } from '@/lib/social-oauth'

export const maxDuration = 30

/**
 * GET /api/tiktok — list all connected accounts
 * GET /api/tiktok?action=list_videos&accountId=XXX
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId') || undefined
  const action = url.searchParams.get('action')

  if (!action) {
    const tokens = await getTokens('tiktok')
    if (tokens.length === 0) return NextResponse.json({ connected: false }, { status: 200 })
    return NextResponse.json({
      connected: true,
      account: tokens[0].account_metadata,
      accounts: tokens.map((t) => ({
        id: t.id,
        providerAccountId: t.provider_account_id,
        metadata: t.account_metadata,
      })),
    })
  }

  const token = await getTokenByAccount('tiktok', accountId)
  if (!token) return NextResponse.json({ connected: false }, { status: 200 })

  try {
    const accessToken = await refreshTokenIfNeeded(token)
    const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

    if (action === 'list_videos') {
      const res = await fetch(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time',
        {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({ max_count: 20 }),
        }
      )
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status })
      }
      const data = await res.json()
      type TTVideo = {
        id: string; title?: string; video_description?: string; duration?: number;
        cover_image_url?: string; share_url?: string;
        view_count?: number; like_count?: number; comment_count?: number; share_count?: number;
        create_time?: number
      }
      const videos = (data.data?.videos as TTVideo[] || []).map((v) => ({
        id: v.id,
        title: v.title || v.video_description?.slice(0, 60) || 'Sans titre',
        description: v.video_description,
        duration: v.duration,
        thumbnail: v.cover_image_url,
        url: v.share_url,
        publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
        views: v.view_count || 0,
        likes: v.like_count || 0,
        comments: v.comment_count || 0,
        shares: v.share_count || 0,
      }))
      return NextResponse.json({ connected: true, account: token.account_metadata, videos })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const accountId = url.searchParams.get('accountId')
  if (accountId) {
    const token = await getTokenByAccount('tiktok', accountId)
    if (token) await deleteTokenById(token.id)
  } else {
    await deleteAllTokens('tiktok')
  }
  return new NextResponse(null, { status: 204 })
}
