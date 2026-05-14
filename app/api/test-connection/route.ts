import { NextResponse } from 'next/server'

export const maxDuration = 15

export async function POST(req: Request) {
  const { provider, apiKey } = await req.json()

  if (!provider || !apiKey) {
    return NextResponse.json({ ok: false, error: 'Missing provider or apiKey' }, { status: 400 })
  }

  try {
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250414',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      })
      return NextResponse.json({ ok: res.ok })
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return NextResponse.json({ ok: res.ok })
    }

    if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )
      return NextResponse.json({ ok: res.ok })
    }

    if (provider === 'stripe') {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return NextResponse.json({ ok: res.ok })
    }

    // Unknown provider — just check key exists
    return NextResponse.json({ ok: !!apiKey })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
