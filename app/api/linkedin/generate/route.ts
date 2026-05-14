import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * POST /api/linkedin/generate
 * Body: { brief, objective, style }
 * Generates LinkedIn post content via the user's connected AI provider.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { brief, objective = 'engagement', style = 'standard', apiKey, model } = body
  if (!brief || typeof brief !== 'string' || brief.trim().length < 10) {
    return NextResponse.json({ error: 'Brief trop court (min 10 caractères)' }, { status: 400 })
  }

  // Style descriptions
  const styleDirectives: Record<string, string> = {
    standard: 'Ton naturel et professionnel, structure simple, paragraphes courts.',
    premium: 'Ton expert et inspirant. Hook fort en première ligne, storytelling, leçon claire en conclusion.',
    story: 'Format storytelling : situation, conflit, résolution, leçon. Émotionnel et concret.',
    listicle: 'Format liste numérotée avec un titre accrocheur, 3 à 7 points, chaque point court et actionnable.',
    hot_take: 'Opinion forte et clivante mais argumentée. Hook polémique, raisonnement, conclusion.',
  }

  const objectiveDirectives: Record<string, string> = {
    engagement: 'Objectif : maximiser les commentaires. Termine par une question ouverte.',
    awareness: 'Objectif : faire connaître une idée ou un projet. Pas de CTA commercial.',
    conversion: 'Objectif : générer des leads. CTA clair en fin de post (DM, lien en commentaire, etc.).',
  }

  const systemPrompt = `Tu es un expert LinkedIn qui aide à rédiger des posts performants en français.

CONTRAINTES TECHNIQUES :
- Max 2900 caractères (LinkedIn limite à 3000)
- Pas d'emojis sauf si vraiment pertinent (max 2-3)
- Pas de "Bonjour", "Bonjour à tous", "Hello world"
- Paragraphes courts (1-3 phrases)
- Saut de ligne entre paragraphes
- Hook puissant en première ligne (8-15 mots max)

STYLE DEMANDÉ : ${styleDirectives[style] || styleDirectives.standard}

OBJECTIF : ${objectiveDirectives[objective] || objectiveDirectives.engagement}

Réponds UNIQUEMENT avec le contenu du post, sans préambule ni commentaire.`

  // Use Anthropic by default; fallback to OpenAI if key provided
  const effectiveModel = model || 'claude-sonnet-4-5-20250514'
  const isOpenAI = effectiveModel.startsWith('gpt-')
  const isGemini = effectiveModel.startsWith('gemini-')

  let key: string | undefined
  if (apiKey) key = apiKey
  else if (isGemini) key = process.env.GOOGLE_API_KEY
  else if (isOpenAI) key = process.env.OPENAI_API_KEY
  else key = process.env.ANTHROPIC_API_KEY

  if (!key) {
    return NextResponse.json({ error: 'Aucune clé API IA disponible — configure une dans Paramètres → Intégrations' }, { status: 400 })
  }

  try {
    let content = ''
    if (isOpenAI) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: effectiveModel,
          max_tokens: 1500,
          temperature: 0.8,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: brief },
          ],
        }),
      })
      if (!res.ok) return NextResponse.json({ error: (await res.json()).error?.message || 'OpenAI error' }, { status: res.status })
      const data = await res.json()
      content = data.choices?.[0]?.message?.content || ''
    } else if (isGemini) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: brief }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.8 },
        }),
      })
      if (!res.ok) return NextResponse.json({ error: 'Gemini error' }, { status: res.status })
      const data = await res.json()
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: effectiveModel,
          max_tokens: 1500,
          temperature: 0.8,
          system: systemPrompt,
          messages: [{ role: 'user', content: brief }],
        }),
      })
      if (!res.ok) return NextResponse.json({ error: (await res.json()).error?.message || 'Anthropic error' }, { status: res.status })
      const data = await res.json()
      content = data.content?.[0]?.text || ''
    }

    return NextResponse.json({ content: content.trim() })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
