import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ prompt: '' }, { status: 401 })
  }

  const { transcripts, projectName, previousPrompt, settings } = await req.json()

  const model = settings?.model || 'claude-sonnet-4-5-20250514'
  const isOpenAI = model.startsWith('gpt-')
  const isGemini = model.startsWith('gemini-')

  let apiKey: string | undefined
  if (isGemini) {
    apiKey = settings?.googleApiKey || process.env.GOOGLE_API_KEY
  } else if (isOpenAI) {
    apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY
  } else {
    apiKey = settings?.apiKey || process.env.ANTHROPIC_API_KEY
  }

  if (!apiKey) {
    return NextResponse.json({ prompt: transcripts.join('\n\n') })
  }

  const systemPrompt = `Tu es un assistant qui transforme des notes vocales brutes en prompts/notes structures et clairs.

Regles :
- Reecris le contenu de maniere claire, structuree et professionnelle
- Conserve TOUTES les idees et informations mentionnees
- Organise par themes/sections si pertinent
- Utilise un ton direct et actionnable
- Si un prompt precedent est fourni, fusionne les nouvelles transcriptions avec celui-ci de maniere coherente
- Ne perds aucune information du prompt precedent
- Reponds uniquement avec le prompt reecrit, sans introduction ni commentaire`

  const userMessage = previousPrompt
    ? `Projet : "${projectName || 'Sans nom'}"

Prompt precedent a mettre a jour :
---
${previousPrompt}
---

Nouvelles transcriptions a integrer :
${transcripts.map((t: string, i: number) => `[Vocal ${i + 1}] ${t}`).join('\n\n')}

Fusionne le prompt precedent avec les nouvelles transcriptions en un seul prompt coherent et complet.`
    : `Projet : "${projectName || 'Sans nom'}"

Transcriptions vocales :
${transcripts.map((t: string, i: number) => `[Vocal ${i + 1}] ${t}`).join('\n\n')}

Reecris ces transcriptions en un prompt/note structure, clair et complet.`

  try {
    let text = ''

    if (isGemini) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.5 },
          }),
        }
      )
      if (!res.ok) return NextResponse.json({ prompt: transcripts.join('\n\n') })
      const data = await res.json()
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else if (isOpenAI) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          temperature: 0.5,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      })
      if (!res.ok) return NextResponse.json({ prompt: transcripts.join('\n\n') })
      const data = await res.json()
      text = data.choices?.[0]?.message?.content || ''
    } else {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          temperature: 0.5,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })
      if (!res.ok) return NextResponse.json({ prompt: transcripts.join('\n\n') })
      const data = await res.json()
      text = data.content?.[0]?.text || ''
    }

    return NextResponse.json({ prompt: text || transcripts.join('\n\n') })
  } catch {
    return NextResponse.json({ prompt: transcripts.join('\n\n') })
  }
}
