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
    return NextResponse.redirect(`${url.origin}/settings?tiktok=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${url.origin}/settings?tiktok=unauthorized`)
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/settings?tiktok=missing_config`)
  }

  const redirectUri = `${url.origin}/api/auth/tiktok/callback`
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${url.origin}/settings?tiktok=token_error`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string
    open_id: string
  }

  // Fetch user info
  let metadata: Record<string, unknown> = { open_id: tokens.open_id }
  try {
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    if (userRes.ok) {
      const data = await userRes.json()
      metadata = { ...metadata, user: data.data?.user }
    }
  } catch {/* ignore */}

  await saveToken({
    user_id: user.id,
    platform: 'tiktok',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
    account_metadata: metadata,
  })

  return NextResponse.redirect(`${url.origin}/settings?tiktok=connected`)
}
