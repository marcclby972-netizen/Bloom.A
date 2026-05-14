import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

/**
 * Proxy to Stripe API — fetches charges and subscriptions for a connected account.
 * Auth is required; the user's Stripe API key (restricted recommended) is sent in the request body.
 * We don't store the key on the server — it always lives in the user's localStorage.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { apiKey, action = 'list_charges', daysBack = 90, limit = 100 } = body

  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk_')) {
    return NextResponse.json({ error: 'Invalid Stripe API key' }, { status: 400 })
  }

  const since = Math.floor((Date.now() - daysBack * 86400 * 1000) / 1000)

  try {
    if (action === 'list_charges') {
      // Fetch charges via REST
      const params = new URLSearchParams({
        'created[gte]': String(since),
        limit: String(Math.min(limit, 100)),
      })
      const res = await fetch(`https://api.stripe.com/v1/charges?${params}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Stripe-Version': '2024-06-20',
        },
      })
      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || 'Stripe error' }, { status: res.status })
      }
      const data = await res.json()
      // Slim down the payload: only what's needed in the UI
      const charges = (data.data || []).map((c: {
        id: string; amount: number; amount_refunded: number; currency: string;
        status: string; description: string | null; receipt_email: string | null;
        created: number; metadata: Record<string, string>; paid: boolean; refunded: boolean
      }) => ({
        id: c.id,
        amount: c.amount,
        amountRefunded: c.amount_refunded,
        currency: c.currency,
        status: c.status,
        description: c.description,
        email: c.receipt_email,
        createdAt: c.created * 1000,
        metadata: c.metadata,
        paid: c.paid,
        refunded: c.refunded,
      }))
      return NextResponse.json({ charges })
    }

    if (action === 'verify') {
      // Test connection
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return NextResponse.json({ ok: res.ok })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
