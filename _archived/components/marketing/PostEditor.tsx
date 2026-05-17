'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context'
import { PLATFORMS, type Post, type Platform } from '@/lib/types'
import { today } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onClose: () => void
  post?: Post
}

export function PostEditor({ open, onClose, post }: Props) {
  const { createPost, updatePost, deletePost } = useApp()

  const [platform, setPlatform] = useState<Platform>(post?.platform || 'instagram')
  const [type, setType] = useState<'organic' | 'paid'>(post?.type || 'organic')
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt || today())
  const [impressions, setImpressions] = useState(String(post?.metrics.impressions || 0))
  const [reach, setReach] = useState(String(post?.metrics.reach || 0))
  const [likes, setLikes] = useState(String(post?.metrics.likes || 0))
  const [comments, setComments] = useState(String(post?.metrics.comments || 0))
  const [shares, setShares] = useState(String(post?.metrics.shares || 0))
  const [clicks, setClicks] = useState(String(post?.metrics.clicks || 0))
  const [spend, setSpend] = useState(String(post?.metrics.spend || 0))
  const [conversions, setConversions] = useState(String(post?.metrics.conversions || 0))
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(post?.tags || [])

  const handleSave = () => {
    if (!title.trim()) return
    const data = {
      platform,
      type,
      title: title.trim(),
      content,
      publishedAt,
      metrics: {
        impressions: parseInt(impressions) || 0,
        reach: parseInt(reach) || 0,
        likes: parseInt(likes) || 0,
        comments: parseInt(comments) || 0,
        shares: parseInt(shares) || 0,
        clicks: parseInt(clicks) || 0,
        spend: parseFloat(spend) || 0,
        conversions: parseInt(conversions) || 0,
      },
      tags,
    }
    if (post) {
      updatePost(post.id, data)
    } else {
      createPost(data)
    }
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput('') }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Modifier le post' : 'Nouveau post'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Plateforme</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                    platform === p.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('organic')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all text-center',
                  type === 'organic'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                Organique
              </button>
              <button
                onClick={() => setType('paid')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all text-center',
                  type === 'paid'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                Payant
              </button>
            </div>
          </div>

          {/* Title & content */}
          <Input placeholder="Titre du post *" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description / contenu" value={content} onChange={(e) => setContent(e.target.value)} rows={2} />
          <Input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />

          {/* Metrics */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Métriques</label>
            <div className="grid grid-cols-4 gap-2">
              <MetricInput label="Impressions" value={impressions} onChange={setImpressions} />
              <MetricInput label="Portée" value={reach} onChange={setReach} />
              <MetricInput label="Likes" value={likes} onChange={setLikes} />
              <MetricInput label="Commentaires" value={comments} onChange={setComments} />
              <MetricInput label="Partages" value={shares} onChange={setShares} />
              <MetricInput label="Clics" value={clicks} onChange={setClicks} />
              {type === 'paid' && (
                <>
                  <MetricInput label="Dépense (€)" value={spend} onChange={setSpend} />
                  <MetricInput label="Conversions" value={conversions} onChange={setConversions} />
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
            <div className="flex gap-2">
              <Input placeholder="Ajouter un tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1" />
              <Button variant="outline" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    {tag} <span className="opacity-60">×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          {post ? (
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
              onClick={() => { deletePost(post.id); onClose() }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3.5h10M5 3.5V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M11 3.5 10.5 12a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1L3 3.5" />
              </svg>
              Supprimer
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} className="min-w-[100px]">
              {post ? 'Enregistrer' : 'Créer le post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MetricInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground block mb-0.5">{label}</label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
    </div>
  )
}
