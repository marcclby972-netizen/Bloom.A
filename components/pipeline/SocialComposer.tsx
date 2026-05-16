'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDateFr } from '@/lib/date-utils'

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', max: 3000 },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', max: 2200 },
  { id: 'x', label: 'X', color: '#000000', max: 280 },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', max: 5000 },
  { id: 'tiktok', label: 'TikTok', color: '#000000', max: 2200 },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', max: 5000 },
] as const

const REMINDERS = [
  { id: '15m', label: '15 min avant', ms: 15 * 60_000 },
  { id: '1h', label: '1 heure avant', ms: 60 * 60_000 },
  { id: '3h', label: '3 heures avant', ms: 3 * 60 * 60_000 },
  { id: '1d', label: '1 jour avant', ms: 24 * 60 * 60_000 },
  { id: '2d', label: '2 jours avant', ms: 2 * 24 * 60 * 60_000 },
  { id: '1w', label: '1 semaine avant', ms: 7 * 24 * 60 * 60_000 },
] as const

type ScheduledPost = {
  id: string
  platforms: string[]
  content: string
  images: string[]   // base64 data URLs
  scheduledAt: number  // ms timestamp of intended publish time
  reminders: string[]  // ids from REMINDERS
  createdAt: number
}

const STORAGE_KEY = 'bloom_scheduled_posts'

function readPosts(): ScheduledPost[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function writePosts(posts: ScheduledPost[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

/**
 * SocialComposer — pre-record social posts and schedule reminders.
 *
 * Lives in the empty space on the right of the Pipeline page. Posts are
 * stored locally for now (no auto-publish — this is a planning + reminder
 * tool). Reminders trigger via the existing notification API on schedule.
 */
export function SocialComposer() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [composerOpen, setComposerOpen] = useState(true)

  // Form state
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['linkedin']))
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set(['1h', '1d']))

  useEffect(() => {
    setPosts(readPosts())
  }, [])

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleReminder = (id: string) => {
    setSelectedReminders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const dataUrls = await Promise.all(
      files.map((file) => new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      }))
    )
    setImages((prev) => [...prev, ...dataUrls].slice(0, 4)) // max 4
    e.target.value = '' // reset input
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const reset = () => {
    setSelectedPlatforms(new Set(['linkedin']))
    setContent('')
    setImages([])
    setScheduleDate('')
    setScheduleTime('')
    setSelectedReminders(new Set(['1h', '1d']))
  }

  const save = () => {
    if (!content.trim() || selectedPlatforms.size === 0 || !scheduleDate || !scheduleTime) return
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).getTime()
    if (Number.isNaN(scheduledAt)) return
    const post: ScheduledPost = {
      id: `post-${Date.now()}`,
      platforms: [...selectedPlatforms],
      content: content.trim(),
      images,
      scheduledAt,
      reminders: [...selectedReminders],
      createdAt: Date.now(),
    }
    const next = [...posts, post]
    writePosts(next)
    setPosts(next)
    reset()
  }

  const remove = (id: string) => {
    const next = posts.filter((p) => p.id !== id)
    writePosts(next)
    setPosts(next)
  }

  // Char counter min based on selected platforms
  const minMax = selectedPlatforms.size > 0
    ? Math.min(...PLATFORMS.filter((p) => selectedPlatforms.has(p.id)).map((p) => p.max))
    : Infinity
  const overLimit = content.length > minMax

  return (
    <aside className="hidden xl:flex flex-col w-[360px] shrink-0 h-full overflow-hidden border-l border-border bg-secondary/30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <p className="card-num">/ COMPOSER</p>
          <h2 className="text-sm font-semibold mt-0.5">Posts à programmer</h2>
        </div>
        <button
          onClick={() => setComposerOpen((v) => !v)}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
          aria-label={composerOpen ? 'Réduire' : 'Ouvrir'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn('transition-transform', composerOpen ? '' : 'rotate-180')}>
            <path d="M3 9l4-4 4 4" />
          </svg>
        </button>
      </div>

      {composerOpen && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Platforms */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Réseaux
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'h-8 px-3 rounded-full text-[11px] font-medium transition-all border',
                      active
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Contenu
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Que veux-tu publier ?"
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border focus:border-foreground/40 focus:outline-none transition-colors text-sm resize-none"
            />
            {selectedPlatforms.size > 0 && (
              <div className={cn(
                'flex justify-end text-[10px] mt-1 tabular-nums',
                overLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}>
                {content.length} / {minMax === Infinity ? '∞' : minMax}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Images ({images.length}/4)
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-card border border-border group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 4 && (
              <label className="block w-full px-3 py-2.5 rounded-xl bg-card border border-dashed border-border text-center text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors cursor-pointer">
                + Ajouter image{images.length === 0 ? 's' : ''}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Programmer à
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-card border border-border focus:border-foreground/40 focus:outline-none transition-colors text-sm"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-card border border-border focus:border-foreground/40 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Rappels avant publication
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {REMINDERS.map((r) => {
                const active = selectedReminders.has(r.id)
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleReminder(r.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-[11px] font-medium transition-all border text-left',
                      active
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={!content.trim() || selectedPlatforms.size === 0 || !scheduleDate || !scheduleTime || overLimit}
            className="w-full pill pill-dark text-sm py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Programmer le post
          </button>
        </div>
      )}

      {/* Liste des posts programmés */}
      <div className="border-t border-border max-h-[40%] overflow-y-auto">
        <div className="px-5 py-3 sticky top-0 bg-secondary/80 backdrop-blur z-10 border-b border-border">
          <p className="card-num">/ PROGRAMMÉS · {posts.length}</p>
        </div>
        {posts.length === 0 ? (
          <div className="px-5 py-6 text-xs text-muted-foreground italic text-center">
            Aucun post programmé.
          </div>
        ) : (
          <ul className="px-3 py-2 space-y-1.5">
            {posts.sort((a, b) => a.scheduledAt - b.scheduledAt).map((p) => (
              <li key={p.id} className="group bg-card rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap gap-1">
                    {p.platforms.map((platId) => {
                      const plat = PLATFORMS.find((pl) => pl.id === platId)
                      if (!plat) return null
                      return (
                        <span
                          key={platId}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: plat.color }}
                        >
                          {plat.label}
                        </span>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs leading-snug line-clamp-2">{p.content}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground tabular-nums">
                  <span>{formatDateFr(p.scheduledAt, 'dd MMM HH:mm')}</span>
                  {p.images.length > 0 && <span>· {p.images.length} img</span>}
                  {p.reminders.length > 0 && <span>· {p.reminders.length} rappels</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
