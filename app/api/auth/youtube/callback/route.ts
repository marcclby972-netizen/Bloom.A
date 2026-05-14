import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveToken } from '@/lib/social-oauth'

export const maxDuration = 15

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${url.origin}/settings?youtube=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${url.origin}/settings?youtube=unauthorized`)
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/settings?youtube=missing_config`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${url.origin}/api/auth/youtube/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${url.origin}/settings?youtube=token_error`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  // Fetch channel info for nice display + unique account id
  let metadata: Record<string, unknown> = {}
  let providerAccountId = ''
  try {
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (channelRes.ok) {
      const data = await channelRes.json()
      const ch = data.items?.[0]
      if (ch) {
        providerAccountId = ch.id
        metadata = {
          channelId: ch.id,
          channelTitle: ch.snippet?.title,
          subscriberCount: ch.statistics?.subscriberCount,
          thumbnail: ch.snippet?.thumbnails?.default?.url,
        }
      }
    }
  } catch {/* ignore */}

  if (!providerAccountId) {
    return NextResponse.redirect(`${url.origin}/settings?youtube=no_channel`)
  }

  await saveToken({
    user_id: user.id,
    platform: 'youtube',
    provider_account_id: providerAccountId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
    account_metadata: metadata,
  })

  return NextResponse.redirect(`${url.origin}/settings?youtube=connected`)
}
