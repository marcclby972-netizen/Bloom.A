import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.META_APP_ID
  if (!clientId) {
    return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const redirectUri = `${url.origin}/api/auth/meta/callback`
  // Permissions for IG Business + FB Pages insights
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_read_user_content',
    'instagram_basic',
    'instagram_manage_insights',
    'ads_read',
    'business_management',
    'read_insights',
  ].join(',')

  const authUrl = new URL('https://www.facebook.com/v20.0/dialog/oauth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', user.id)
  authUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(authUrl.toString())
}
