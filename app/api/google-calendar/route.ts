import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

type TokenRow = {
  access_token: string
  refresh_token: string | null
  expires_at: string
}

async function refreshIfNeeded(token: TokenRow, userId: string): Promise<string> {
  const expires = new Date(token.expires_at).getTime()
  const now = Date.now()
  // Refresh if expires within 60 seconds
  if (expires - now > 60_000) return token.access_token

  if (!token.refresh_token) throw new Error('No refresh token — user must re-authenticate')
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth not configured')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  const data = await res.json() as { access_token: string; expires_in: number }

  const supabase = await createClient()
  await supabase.from('google_calendar_tokens').update({
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq('user_id', userId)

  return data.access_token
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Not connected', connected: false }, { status: 200 })
  }

  try {
    const accessToken = await refreshIfNeeded(tokenRow as TokenRow, user.id)

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '7', 10)
    const timeMin = new Date(Date.now() - 1 * 86400 * 1000).toISOString()
    const timeMax = new Date(Date.now() + days * 86400 * 1000).toISOString()

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    })

    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!eventsRes.ok) {
      const err = await eventsRes.text()
      return NextResponse.json({ error: err }, { status: eventsRes.status })
    }
    const data = await eventsRes.json()
    type GEvent = {
      id: string; summary?: string; start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string }; htmlLink?: string; location?: string
    }
    const events = (data.items || []).map((e: GEvent) => ({
      id: e.id,
      title: e.summary || '(Sans titre)',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: !e.start?.dateTime,
      htmlLink: e.htmlLink,
      location: e.location,
    }))

    return NextResponse.json({ connected: true, events })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('google_calendar_tokens').delete().eq('user_id', user.id)
  return new NextResponse(null, { status: 204 })
}
