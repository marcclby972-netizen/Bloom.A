'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { store } from '@/lib/store'
import { cn } from '@/lib/utils'

export type LinkedInPost = {
  id: string
  user_id: string
  oauth_token_id: string | null
  status: 'idea' | 'draft' | 'scheduled' | 'published' | 'failed'
  brief: string
  objective: string
  style: string
  title: string
  content: string
  media_urls: string[]
  hashtags: string[]
  scheduled_at: string | null
  published_at: string | null
  linkedin_post_urn: string | null
  publish_error: string | null
  project_id: string | null
  created_at: string
  updated_at: string
}

export type LinkedInAccount = {
  id: string
  providerAccountId: string
  metadata: { name?: string; picture?: string; sub?: string; email?: string }
}

const OBJECTIVES = [
  { value: 'engagement', label: 'Engagement (commentaires)' },
  { value: 'awareness', label: 'Notoriété (visibilité)' },
  { value: 'conversion', label: 'Conversion (leads)' },
]

const STYLES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'story', label: 'Storytelling' },
  { value: 'listicle', label: 'Liste' },
  { value: 'hot_take', label: 'Opinion forte' },
]

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  post?: LinkedInPost | null
  accounts: LinkedInAccount[]
}

export function PostEditorModal({ open, onClose, onSaved, post, accounts }: Props) {
  const [brief, setBrief] = useState('')
  const [objective, setObjective] = useState('engagement')
  const [stylePreset, setStylePreset] = useState('standard')
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset when opening
  useEffect(() => {
    if (open) {
      setBrief(post?.brief || '')
      setObjective(post?.objective || 'engagement')
      setStylePreset(post?.style || 'standard')
      setContent(post?.content || '')
      setScheduledAt(post?.scheduled_at ? post.scheduled_at.slice(0, 16) : '')
      setAccountId(post?.oauth_token_id || accounts[0]?.id || null)
      setError('')
    }
  }, [open, post, accounts])

  const generate = useCallback(async () => {
    setError('')
    if (brief.trim().length < 10) {
      setError('Décris ton sujet en au moins 10 caractères')
      return
    }
    setGenerating(true)
    try {
      // Get AI api key from settings
      const settings = store.getSettings()
      const anthropic = settings.integrations.find((i) => i.provider === 'anthropic')
      const openai = settings.integrations.find((i) => i.provider === 'openai')
      const google = settings.integrations.find((i) => i.provider === 'google')

      const model = settings.ai?.model || 'claude-sonnet-4-5-20250514'
      const apiKey = model.startsWith('gpt-') ? openai?.apiKey
        : model.startsWith('gemini-') ? google?.apiKey
        : anthropic?.apiKey

      const res = await fetch('/api/linkedin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim(), objective, style: stylePreset, apiKey, model }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur génération')
        return
      }
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setGenerating(false)
    }
  }, [brief, objective, stylePreset])

  const save = async (targetStatus: 'idea' | 'draft' | 'scheduled' | 'published_now') => {
    setError('')
    if (targetStatus !== 'idea' && !content.trim()) {
      setError('Le contenu est vide')
      return
    }
    if (targetStatus === 'scheduled' && !scheduledAt) {
      setError('Choisis une date de publication')
      return
    }
    if (targetStatus === 'scheduled' && new Date(scheduledAt).getTime() < Date.now()) {
      setError('La date doit être dans le futur')
      return
    }
    if (targetStatus === 'published_now' && !accountId) {
      setError('Sélectionne un compte LinkedIn')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        brief: brief.trim(),
        objective,
        style: stylePreset,
        content: content.trim(),
        oauth_token_id: accountId,
      }
      if (targetStatus === 'idea') payload.status = 'idea'
      if (targetStatus === 'draft') payload.status = 'draft'
      if (targetStatus === 'scheduled') {
        payload.status = 'scheduled'
        payload.scheduled_at = new Date(scheduledAt).toISOString()
      }

      let savedId: string | null = post?.id || null

      if (post) {
        // Update existing
        const res = await fetch(`/api/linkedin/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          setError((await res.json()).error || 'Erreur enregistrement')
          return
        }
      } else {
        // Create new
        const res = await fetch('/api/linkedin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          setError((await res.json()).error || 'Erreur enregistrement')
          return
        }
        const data = await res.json()
        savedId = data.post.id
      }

      // If publish now, trigger the publish endpoint
      if (targetStatus === 'published_now' && savedId) {
        const res = await fetch(`/api/linkedin/posts/${savedId}/publish`, { method: 'POST' })
        if (!res.ok) {
          setError((await res.json()).error || 'Échec publication')
          onSaved()
          return
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const account = accounts.find((a) => a.id === accountId)
  const accountName = (account?.metadata.name || account?.metadata.email || 'Profil LinkedIn') as string

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col sm:!max-w-5xl">
        <DialogHeader>
          <DialogTitle>{post ? 'Modifier le post' : 'Nouveau post LinkedIn'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto -mx-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            {/* Form */}
            <div className="space-y-4">
              {/* Account selector */}
              {accounts.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Compte LinkedIn</label>
                  <select
                    value={accountId || ''}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {(a.metadata.name || a.metadata.email) as string}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {accounts.length === 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
                  Aucun compte LinkedIn connecté. Va dans <strong>Paramètres → Intégrations</strong> pour en connecter un.
                </div>
              )}

              {/* Brief */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brief IA</label>
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Décris le sujet, le message clé, l'actu..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Objective + Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Objectif</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                  >
                    {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Style</label>
                  <select
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                  >
                    {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <Button
                onClick={generate}
                disabled={generating || !brief.trim()}
                className="w-full gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 1L8.5 4.5L12 6L8.5 7.5L7 11L5.5 7.5L2 6L5.5 4.5Z" />
                </svg>
                {generating ? 'Génération en cours...' : 'Générer avec l\'IA'}
              </Button>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Contenu</label>
                  <span className={cn(
                    'text-[10px] tabular-nums',
                    content.length > 2900 ? 'text-red-600' : 'text-muted-foreground'
                  )}>
                    {content.length} / 3000
                  </span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écris ton post directement ou génère-le avec l'IA..."
                  rows={12}
                  className="text-sm leading-relaxed"
                  maxLength={3000}
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Date de publication <span className="text-[10px] italic">(optionnel — vide = brouillon)</span>
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="text-sm"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-2 text-xs text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* LinkedIn preview */}
            <div className="lg:sticky lg:top-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aperçu LinkedIn</label>
              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {(accountName?.[0] || 'L').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{accountName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {scheduledAt ? `Programmé · ${new Date(scheduledAt).toLocaleString('fr-FR')}` : 'Maintenant'}
                    </div>
                  </div>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {content || <span className="italic text-muted-foreground">Votre contenu apparaîtra ici en temps réel...</span>}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
                  <span>J&apos;aime</span>
                  <span>Commenter</span>
                  <span>Republier</span>
                  <span>Envoyer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => save('idea')} disabled={saving}>
              💡 Idée
            </Button>
            <Button variant="ghost" size="sm" onClick={() => save('draft')} disabled={saving || !content.trim()}>
              📝 Brouillon
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => save('published_now')}
              disabled={saving || !content.trim() || !accountId}
            >
              Publier maintenant
            </Button>
            <Button
              size="sm"
              onClick={() => save('scheduled')}
              disabled={saving || !content.trim() || !scheduledAt}
            >
              {saving ? 'Enregistrement...' : 'Planifier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
