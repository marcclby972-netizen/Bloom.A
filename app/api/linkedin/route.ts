import { NextResponse } from 'next/server'
import { getToken, refreshTokenIfNeeded, deleteToken } from '@/lib/social-oauth'

export const maxDuration = 30

/**
 * GET /api/linkedin?action=list_posts&orgIndex=0
 * GET /api/linkedin?action=list_ads
 */
export async function GET(req: Request) {
  const token = await getToken('linkedin')
  if (!token) return NextResponse.json({ connected: false }, { status: 200 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list_posts'

  try {
    const accessToken = await refreshTokenIfNeeded(token)
    const auth = {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202405',
      'X-Restli-Protocol-Version': '2.0.0',
    }
    const meta = token.account_metadata as { organizations?: Array<{ urn: string; id: string }>; sub?: string; name?: string; picture?: string }

    if (action === 'list_posts') {
      const orgIndex = parseInt(url.searchParams.get('orgIndex') || '0', 10)
      const author = meta.organizations?.[orgIndex]?.urn || `urn:li:person:${meta.sub}`

      const postsRes = await fetch(
        `https://api.linkedin.com/rest/posts?q=author&author=${encodeURIComponent(author)}&count=20`,
        { headers: auth }
      )
      if (!postsRes.ok) {
        return NextResponse.json({ error: await postsRes.text() }, { status: postsRes.status })
      }
      const data = await postsRes.json()
      type Post = {
        id: string
        commentary?: string
        createdAt?: number
        publishedAt?: number
        content?: { article?: { thumbnail?: string }; media?: { id?: string } }
      }
      const posts = ((data.elements as Post[]) || []).map((p) => ({
        id: p.id,
        text: p.commentary?.slice(0, 200),
        publishedAt: p.publishedAt || p.createdAt,
        thumbnail: p.content?.article?.thumbnail,
      }))
      return NextResponse.json({
        connected: true,
        account: { name: meta.name, picture: meta.picture, organizations: meta.organizations || [] },
        posts,
      })
    }

    if (action === 'list_ads') {
      // Get ad accounts
      const acctsRes = await fetch(
        'https://api.linkedin.com/rest/adAccounts?q=search&search=(status:(values:List(ACTIVE)))',
        { headers: auth }
      )
      if (!acctsRes.ok) {
        return NextResponse.json({ error: 'Need r_ads permission. Check Marketing Developer Platform approval.' }, { status: 403 })
      }
      const acctsData = await acctsRes.json()
      type AdAccount = { id: number; name: string; currency: string }
      const accounts = (acctsData.elements as AdAccount[]) || []

      if (!accounts.length) return NextResponse.json({ accounts: [], campaigns: [] })

      // Fetch campaigns for the first account
      const acctId = accounts[0].id
      const campsRes = await fetch(
        `https://api.linkedin.com/rest/adAccounts/${acctId}/adCampaigns?q=search`,
        { headers: auth }
      )
      const campsData = campsRes.ok ? await campsRes.json() : { elements: [] }
      type Campaign = { id: number; name: string; status: string; objectiveType: string; dailyBudget?: { amount: string } }
      const campaigns = ((campsData.elements as Campaign[]) || []).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objectiveType,
        dailyBudget: c.dailyBudget?.amount ? parseFloat(c.dailyBudget.amount) : 0,
      }))

      return NextResponse.json({ connected: true, accounts, campaigns })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  await deleteToken('linkedin')
  return new NextResponse(null, { status: 204 })
}
