import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const maxDuration = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { siteId, eventType = 'pageview', path, referrer, sessionId } = body
    if (!siteId || typeof siteId !== 'string') {
      return NextResponse.json({ error: 'siteId required' }, { status: 400, headers: corsHeaders })
    }

    // Use service-less Supabase client (no auth needed for inserts due to RLS policy)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null
    const country = req.headers.get('x-vercel-ip-country') || null

    const { error } = await supabase.from('tracking_events').insert({
      site_id: siteId,
      event_type: eventType,
      path: typeof path === 'string' ? path.slice(0, 500) : null,
      referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : null,
      session_id: typeof sessionId === 'string' ? sessionId.slice(0, 100) : null,
      user_agent: userAgent,
      country,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders })
    }

    return new NextResponse(null, { status: 204, headers: corsHeaders })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
