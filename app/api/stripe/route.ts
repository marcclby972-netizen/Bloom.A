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
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return NextResponse.json({ ok: res.ok })
    }

    if (action === 'list_products') {
      const res = await fetch('https://api.stripe.com/v1/products?active=true&limit=100', {
        headers: { Authorization: `Bearer ${apiKey}`, 'Stripe-Version': '2024-06-20' },
      })
      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || 'Stripe error' }, { status: res.status })
      }
      const data = await res.json()
      type SP = { id: string; name: string; description: string | null; active: boolean }
      const products = (data.data || []).map((p: SP) => ({
        id: p.id, name: p.name, description: p.description, active: p.active,
      }))
      return NextResponse.json({ products })
    }

    if (action === 'list_customers') {
      const search = body.search as string | undefined
      const url = new URL('https://api.stripe.com/v1/customers')
      url.searchParams.set('limit', '50')
      if (search) url.searchParams.set('email', search)
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}`, 'Stripe-Version': '2024-06-20' },
      })
      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.error?.message || 'Stripe error' }, { status: res.status })
      }
      const data = await res.json()
      type SC = { id: string; email: string | null; name: string | null; created: number }
      const customers = (data.data || []).map((c: SC) => ({
        id: c.id, email: c.email, name: c.name, createdAt: c.created * 1000,
      }))
      return NextResponse.json({ customers })
    }

    /**
     * list_charges_for_project — fetches charges that match the project's Stripe filters.
     * Strategy: for each customer ID, query /charges?customer=cus_XXX. For products,
     * Stripe doesn't index charges by product directly, so we fetch the latest invoices
     * and check their line items for matching product IDs.
     */
    if (action === 'list_charges_for_project') {
      const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : []
      const customerIds: string[] = Array.isArray(body.customerIds) ? body.customerIds : []
      if (productIds.length === 0 && customerIds.length === 0) {
        return NextResponse.json({ charges: [], subscriptions: [] })
      }

      const allCharges = new Map<string, unknown>()
      const subscriptionsByCustomer = new Map<string, unknown[]>()

      // 1. Charges by customer
      for (const customerId of customerIds.slice(0, 20)) {
        const params = new URLSearchParams({
          customer: customerId,
          'created[gte]': String(since),
          limit: '50',
        })
        const res = await fetch(`https://api.stripe.com/v1/charges?${params}`, {
          headers: { Authorization: `Bearer ${apiKey}`, 'Stripe-Version': '2024-06-20' },
        })
        if (res.ok) {
          const data = await res.json()
          for (const c of data.data || []) {
            allCharges.set(c.id, c)
          }
        }
      }

      // 2. Charges by product — via invoices + line items
      if (productIds.length > 0) {
        const params = new URLSearchParams({
          'created[gte]': String(since),
          limit: '100',
          status: 'paid',
        })
        const res = await fetch(`https://api.stripe.com/v1/invoices?${params}&expand[]=data.lines.data.price.product&expand[]=data.charge`, {
          headers: { Authorization: `Bearer ${apiKey}`, 'Stripe-Version': '2024-06-20' },
        })
        if (res.ok) {
          const data = await res.json()
          type Invoice = {
            id: string; charge: string | { id: string; amount: number; amount_refunded: number; currency: string; status: string; description: string | null; receipt_email: string | null; created: number; metadata: Record<string, string>; paid: boolean; refunded: boolean } | null;
            lines: { data: Array<{ price?: { product?: string | { id: string } } }> }
          }
          for (const inv of (data.data || []) as Invoice[]) {
            const matches = inv.lines?.data?.some((line) => {
              const p = typeof line.price?.product === 'string' ? line.price.product : line.price?.product?.id
              return p && productIds.includes(p)
            })
            if (matches && inv.charge && typeof inv.charge === 'object') {
              allCharges.set(inv.charge.id, inv.charge)
            }
          }
        }
      }

      // 3. Active subscriptions per customer (for MRR calc)
      for (const customerId of customerIds.slice(0, 20)) {
        const res = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=20&expand[]=data.items.data.price`,
          { headers: { Authorization: `Bearer ${apiKey}`, 'Stripe-Version': '2024-06-20' } }
        )
        if (res.ok) {
          const data = await res.json()
          subscriptionsByCustomer.set(customerId, data.data || [])
        }
      }

      // Slim down charges payload
      type Charge = {
        id: string; amount: number; amount_refunded: number; currency: string;
        status: string; description: string | null; receipt_email: string | null;
        created: number; metadata: Record<string, string>; paid: boolean; refunded: boolean
      }
      const charges = Array.from(allCharges.values()).map((c) => {
        const ch = c as Charge
        return {
          id: ch.id,
          amount: ch.amount,
          amountRefunded: ch.amount_refunded,
          currency: ch.currency,
          status: ch.status,
          description: ch.description,
          email: ch.receipt_email,
          createdAt: ch.created * 1000,
          paid: ch.paid,
          refunded: ch.refunded,
        }
      }).sort((a, b) => b.createdAt - a.createdAt)

      // Slim down subscriptions for MRR
      type Sub = { id: string; status: string; items: { data: Array<{ price?: { id: string; unit_amount: number | null; currency: string; recurring?: { interval: string; interval_count: number } } }> } }
      const subscriptions = Array.from(subscriptionsByCustomer.values()).flat().map((s) => {
        const sub = s as Sub
        const lines = (sub.items?.data || []).map((it) => ({
          priceId: it.price?.id,
          amount: it.price?.unit_amount || 0,
          currency: it.price?.currency || 'eur',
          interval: it.price?.recurring?.interval || 'month',
          intervalCount: it.price?.recurring?.interval_count || 1,
        }))
        return { id: sub.id, status: sub.status, lines }
      })

      return NextResponse.json({ charges, subscriptions })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
