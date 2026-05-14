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
    return NextResponse.redirect(`${url.origin}/settings?meta=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${url.origin}/settings?meta=unauthorized`)
  }

  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/settings?meta=missing_config`)
  }

  // Step 1: exchange code for short-lived token
  const redirectUri = `${url.origin}/api/auth/meta/callback`
  const shortRes = await fetch(
    `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
  )
  if (!shortRes.ok) {
    return NextResponse.redirect(`${url.origin}/settings?meta=token_error`)
  }
  const shortData = await shortRes.json() as { access_token: string; expires_in?: number }

  // Step 2: exchange short-lived for long-lived (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortData.access_token}`
  )
  const longData = longRes.ok
    ? await longRes.json() as { access_token: string; expires_in?: number }
    : shortData
  const accessToken = longData.access_token
  const expiresIn = longData.expires_in || 60 * 86400

  // Step 3: list pages and IG business accounts
  let metadata: Record<string, unknown> = {}
  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`
    )
    if (pagesRes.ok) {
      const data = await pagesRes.json()
      type Page = {
        id: string; name: string; access_token: string;
        instagram_business_account?: { id: string; username: string; profile_picture_url?: string }
      }
      metadata = {
        pages: (data.data || []).map((p: Page) => ({
          id: p.id,
          name: p.name,
          pageAccessToken: p.access_token,
          igBusinessId: p.instagram_business_account?.id,
          igUsername: p.instagram_business_account?.username,
          igPicture: p.instagram_business_account?.profile_picture_url,
        })),
      }
    }
  } catch {/* ignore */}

  await saveToken({
    user_id: user.id,
    platform: 'meta',
    access_token: accessToken,
    refresh_token: null,
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: null,
    account_metadata: metadata,
  })

  return NextResponse.redirect(`${url.origin}/settings?meta=connected`)
}
