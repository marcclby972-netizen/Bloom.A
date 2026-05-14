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
    return NextResponse.redirect(`${url.origin}/settings?linkedin=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${url.origin}/settings?linkedin=unauthorized`)
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/settings?linkedin=missing_config`)
  }

  const redirectUri = `${url.origin}/api/auth/linkedin/callback`
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${url.origin}/settings?linkedin=token_error`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  // Fetch user info via OpenID Connect userinfo endpoint
  let metadata: Record<string, unknown> = {}
  try {
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (userRes.ok) {
      const data = await userRes.json()
      metadata = {
        sub: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture,
      }
    }

    // Fetch organizations the user can manage
    const orgsRes = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED',
      { headers: { Authorization: `Bearer ${tokens.access_token}`, 'LinkedIn-Version': '202405' } }
    )
    if (orgsRes.ok) {
      const data = await orgsRes.json()
      type OrgAcl = { organization: string; role: string }
      metadata.organizations = ((data.elements as OrgAcl[]) || []).map((o) => ({
        urn: o.organization,
        id: o.organization.replace('urn:li:organization:', ''),
      }))
    }
  } catch {/* ignore */}

  await saveToken({
    user_id: user.id,
    platform: 'linkedin',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
    account_metadata: metadata,
  })

  return NextResponse.redirect(`${url.origin}/settings?linkedin=connected`)
}
