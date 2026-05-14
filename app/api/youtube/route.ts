import { NextResponse } from 'next/server'
import { getToken, refreshTokenIfNeeded, deleteToken } from '@/lib/social-oauth'

export const maxDuration = 30

/**
 * GET /api/youtube?action=list_videos&maxResults=10
 * GET /api/youtube?action=video_stats&videoId=XXX
 */
export async function GET(req: Request) {
  const token = await getToken('youtube')
  if (!token) return NextResponse.json({ connected: false }, { status: 200 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list_videos'

  try {
    const accessToken = await refreshTokenIfNeeded(token)
    const auth = { Authorization: `Bearer ${accessToken}` }

    if (action === 'list_videos') {
      const maxResults = url.searchParams.get('maxResults') || '20'
      // 1. Get uploads playlist
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
        { headers: auth }
      )
      if (!chRes.ok) return NextResponse.json({ error: await chRes.text() }, { status: chRes.status })
      const chData = await chRes.json()
      const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
      if (!uploadsId) return NextResponse.json({ videos: [] })

      // 2. List items
      const itemsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=${maxResults}`,
        { headers: auth }
      )
      if (!itemsRes.ok) return NextResponse.json({ error: await itemsRes.text() }, { status: itemsRes.status })
      const itemsData = await itemsRes.json()
      const videoIds = (itemsData.items || []).map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId).filter(Boolean).join(',')

      // 3. Fetch full stats for each video
      if (!videoIds) return NextResponse.json({ videos: [] })
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
        { headers: auth }
      )
      const statsData = await statsRes.json()
      type YTVideo = {
        id: string; snippet?: { title?: string; publishedAt?: string; thumbnails?: { medium?: { url?: string } } };
        statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }
      }
      const videos = (statsData.items || []).map((v: YTVideo) => ({
        id: v.id,
        title: v.snippet?.title || '',
        publishedAt: v.snippet?.publishedAt,
        thumbnail: v.snippet?.thumbnails?.medium?.url,
        views: parseInt(v.statistics?.viewCount || '0', 10),
        likes: parseInt(v.statistics?.likeCount || '0', 10),
        comments: parseInt(v.statistics?.commentCount || '0', 10),
      }))
      return NextResponse.json({ connected: true, account: token.account_metadata, videos })
    }

    if (action === 'video_stats') {
      const videoId = url.searchParams.get('videoId')
      if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}`,
        { headers: auth }
      )
      const data = await res.json()
      const v = data.items?.[0]
      if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({
        id: v.id,
        title: v.snippet?.title,
        views: parseInt(v.statistics?.viewCount || '0', 10),
        likes: parseInt(v.statistics?.likeCount || '0', 10),
        comments: parseInt(v.statistics?.commentCount || '0', 10),
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  await deleteToken('youtube')
  return new NextResponse(null, { status: 204 })
}
