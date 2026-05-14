import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const redirectUri = `${url.origin}/api/auth/linkedin/callback`
  const scopes = [
    'openid',
    'profile',
    'email',
    'w_member_social',
    'r_member_social',
    'r_organization_social',
    'r_organization_admin',
    'rw_organization_admin',
    'r_ads',
    'r_ads_reporting',
  ].join(' ')

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(authUrl.toString())
}
