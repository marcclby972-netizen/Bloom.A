import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

/**
 * Initiates Google OAuth flow for Calendar access.
 * GET /api/auth/google → redirects to Google consent screen.
 * Callback handled at /api/auth/google/callback.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({
      error: 'GOOGLE_OAUTH_CLIENT_ID not configured. See README.',
    }, { status: 500 })
  }

  const url = new URL(req.url)
  const redirectUri = `${url.origin}/api/auth/google/callback`
  const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(authUrl.toString())
}
