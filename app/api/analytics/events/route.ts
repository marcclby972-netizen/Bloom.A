import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 15

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const siteId = url.searchParams.get('siteId')
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Verify ownership
  const { data: site } = await supabase
    .from('tracking_sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const since = new Date(Date.now() - days * 86400 * 1000).toISOString()

  const { data, error } = await supabase
    .from('tracking_events')
    .select('id, event_type, path, referrer, country, session_id, user_agent, created_at')
    .eq('site_id', siteId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ events: data })
}
