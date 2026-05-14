import { NextResponse } from 'next/server'
import { getToken, refreshTokenIfNeeded, deleteToken } from '@/lib/social-oauth'

export const maxDuration = 30

/**
 * GET /api/meta?action=list_ig_media&pageIndex=0
 * GET /api/meta?action=list_fb_posts&pageIndex=0
 * GET /api/meta?action=list_ads
 */
export async function GET(req: Request) {
  const token = await getToken('meta')
  if (!token) return NextResponse.json({ connected: false }, { status: 200 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list_ig_media'
  const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)

  try {
    const accessToken = await refreshTokenIfNeeded(token)
    const meta = token.account_metadata as { pages?: Array<{ id: string; name: string; pageAccessToken: string; igBusinessId?: string; igUsername?: string; igPicture?: string }> }
    const page = meta.pages?.[pageIndex]
    if (!page && action !== 'list_pages') {
      return NextResponse.json({ error: 'No page configured' }, { status: 400 })
    }

    if (action === 'list_pages') {
      return NextResponse.json({ connected: true, pages: meta.pages || [] })
    }

    if (action === 'list_ig_media') {
      if (!page?.igBusinessId) return NextResponse.json({ error: 'No IG business account linked' }, { status: 400 })
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)'
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${page.igBusinessId}/media?fields=${fields}&limit=25&access_token=${page.pageAccessToken}`
      )
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: res.status })
      }
      const data = await res.json()
      type IGMedia = {
        id: string; caption?: string; media_type?: string; permalink?: string; media_url?: string;
        thumbnail_url?: string; timestamp?: string; like_count?: number; comments_count?: number;
        insights?: { data?: Array<{ name: string; values: Array<{ value: number }> }> }
      }
      const items = (data.data as IGMedia[]).map((m) => {
        const insight = (name: string) => m.insights?.data?.find((i) => i.name === name)?.values?.[0]?.value || 0
        return {
          id: m.id,
          caption: m.caption?.slice(0, 200),
          type: m.media_type,
          permalink: m.permalink,
          thumbnail: m.thumbnail_url || m.media_url,
          publishedAt: m.timestamp,
          likes: m.like_count || 0,
          comments: m.comments_count || 0,
          impressions: insight('impressions'),
          reach: insight('reach'),
          engagement: insight('engagement'),
          saved: insight('saved'),
        }
      })
      return NextResponse.json({ connected: true, account: { username: page.igUsername, picture: page.igPicture }, items })
    }

    if (action === 'list_fb_posts') {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${page!.id}/posts?fields=id,message,permalink_url,created_time,full_picture,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engaged_users,post_clicks)&limit=25&access_token=${page!.pageAccessToken}`
      )
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: res.status })
      }
      const data = await res.json()
      type FBPost = {
        id: string; message?: string; permalink_url?: string; created_time?: string; full_picture?: string;
        likes?: { summary?: { total_count?: number } };
        comments?: { summary?: { total_count?: number } };
        shares?: { count?: number };
        insights?: { data?: Array<{ name: string; values: Array<{ value: number }> }> }
      }
      const items = (data.data as FBPost[]).map((p) => {
        const insight = (name: string) => p.insights?.data?.find((i) => i.name === name)?.values?.[0]?.value || 0
        return {
          id: p.id,
          message: p.message?.slice(0, 200),
          permalink: p.permalink_url,
          publishedAt: p.created_time,
          thumbnail: p.full_picture,
          likes: p.likes?.summary?.total_count || 0,
          comments: p.comments?.summary?.total_count || 0,
          shares: p.shares?.count || 0,
          impressions: insight('post_impressions'),
          engagement: insight('post_engaged_users'),
          clicks: insight('post_clicks'),
        }
      })
      return NextResponse.json({ connected: true, account: { name: page!.name }, items })
    }

    if (action === 'list_ads') {
      // Get ad accounts
      const adAcctRes = await fetch(
        `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,currency&access_token=${accessToken}`
      )
      if (!adAcctRes.ok) {
        return NextResponse.json({ error: 'No ad account access (need ads_read)' }, { status: 403 })
      }
      const adAcctData = await adAcctRes.json()
      type AdAccount = { id: string; name: string; currency: string }
      const accounts = adAcctData.data as AdAccount[]
      if (!accounts?.length) return NextResponse.json({ accounts: [], campaigns: [] })

      // Fetch campaigns + insights for the first account
      const acct = accounts[0]
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v20.0/${acct.id}/campaigns?fields=id,name,status,objective,insights{spend,impressions,clicks,actions}&limit=50&access_token=${accessToken}`
      )
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : { data: [] }
      type Campaign = {
        id: string; name: string; status: string; objective: string;
        insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string; actions?: Array<{ action_type: string; value: string }> }> }
      }
      const campaigns = ((campaignsData.data as Campaign[]) || []).map((c) => {
        const ins = c.insights?.data?.[0]
        const conversionAction = ins?.actions?.find((a) => a.action_type === 'purchase' || a.action_type === 'lead')
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          spend: parseFloat(ins?.spend || '0'),
          impressions: parseInt(ins?.impressions || '0', 10),
          clicks: parseInt(ins?.clicks || '0', 10),
          conversions: parseInt(conversionAction?.value || '0', 10),
        }
      })

      return NextResponse.json({ connected: true, accounts, campaigns })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  await deleteToken('meta')
  return new NextResponse(null, { status: 204 })
}
