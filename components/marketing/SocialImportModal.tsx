'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Platform, PostMetrics } from '@/lib/types'

type SocialPlatform = 'youtube' | 'linkedin'

type AccountInfo = { id: string; providerAccountId: string; metadata: Record<string, unknown> }

type SocialItem = {
  id: string
  title?: string
  description?: string
  caption?: string
  text?: string
  message?: string
  thumbnail?: string
  permalink?: string
  url?: string
  publishedAt?: string | number | null
  views?: number
  likes?: number
  comments?: number
  shares?: number
  impressions?: number
  reach?: number
  engagement?: number
  clicks?: number
}

const PLATFORM_INFO: Record<SocialPlatform, { label: string; endpoint: string; appPlatform: Platform }> = {
  youtube: { label: 'YouTube', endpoint: '/api/youtube?action=list_videos', appPlatform: 'youtube' },
  linkedin: { label: 'LinkedIn', endpoint: '/api/linkedin?action=list_posts', appPlatform: 'linkedin' },
}

type Props = {
  open: boolean
  onClose: () => void
  defaultProjectId?: string
}

export function SocialImportModal({ open, onClose, defaultProjectId }: Props) {
  const app = useApp()
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('youtube')
  const [accountsByPlatform, setAccountsByPlatform] = useState<Record<SocialPlatform, AccountInfo[]>>({
    youtube: [], linkedin: [],
  })
  const [activeAccountId, setActiveAccountId] = useState<string | undefined>()
  const [items, setItems] = useState<SocialItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId || null)
  const [imported, setImported] = useState<Set<string>>(new Set())

  // Detect connected platforms + their accounts
  useEffect(() => {
    if (!open) return
    ;(async () => {
      const platforms: SocialPlatform[] = ['youtube', 'linkedin']
      const result: Record<SocialPlatform, AccountInfo[]> = { youtube: [], linkedin: [] }
      await Promise.all(platforms.map(async (p) => {
        try {
          const res = await fetch(PLATFORM_INFO[p].endpoint.split('?')[0])
          if (!res.ok) return
          const data = await res.json()
          if (data.connected && Array.isArray(data.accounts)) {
            result[p] = data.accounts as AccountInfo[]
          }
        } catch {/* ignore */}
      }))
      setAccountsByPlatform(result)
      const firstConnected = platforms.find((p) => result[p].length > 0)
      if (firstConnected) {
        setActivePlatform(firstConnected)
        setActiveAccountId(result[firstConnected][0]?.providerAccountId)
      }
    })()
  }, [open])

  const loadItems = useCallback(async (platform: SocialPlatform, accountId?: string) => {
    setLoading(true)
    setError('')
    setItems([])
    try {
      const sep = PLATFORM_INFO[platform].endpoint.includes('?') ? '&' : '?'
      const accountQs = accountId ? `${sep}accountId=${encodeURIComponent(accountId)}` : ''
      const res = await fetch(`${PLATFORM_INFO[platform].endpoint}${accountQs}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      const list: SocialItem[] = data.videos || data.items || data.posts || []
      setItems(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  // When platform changes, reset active account to the first one of that platform
  useEffect(() => {
    const accs = accountsByPlatform[activePlatform]
    if (accs.length > 0 && !accs.find((a) => a.providerAccountId === activeAccountId)) {
      setActiveAccountId(accs[0].providerAccountId)
    }
  }, [activePlatform, accountsByPlatform, activeAccountId])

  // Load items whenever platform or account changes
  useEffect(() => {
    if (open && accountsByPlatform[activePlatform].length > 0 && activeAccountId) {
      loadItems(activePlatform, activeAccountId)
    }
  }, [open, activePlatform, activeAccountId, accountsByPlatform, loadItems])

  const connectedPlatforms = useMemo(() => {
    const s = new Set<SocialPlatform>()
    ;(Object.keys(accountsByPlatform) as SocialPlatform[]).forEach((p) => {
      if (accountsByPlatform[p].length > 0) s.add(p)
    })
    return s
  }, [accountsByPlatform])

  const accountLabel = (acc: AccountInfo) => {
    const m = acc.metadata
    return (m.channelTitle || m.username || m.userName || m.name || m.igUsername ||
      (m.user as { display_name?: string })?.display_name || 'Compte') as string
  }

  const handleImport = (item: SocialItem) => {
    const platformAppId = PLATFORM_INFO[activePlatform].appPlatform
    const title = item.title || item.caption?.slice(0, 80) || item.text?.slice(0, 80) || item.message?.slice(0, 80) || 'Post importé'
    const content = item.description || item.caption || item.text || item.message || ''
    const publishedAt = item.publishedAt
      ? typeof item.publishedAt === 'number'
        ? new Date(item.publishedAt).toISOString().slice(0, 10)
        : new Date(item.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    const metrics: PostMetrics = {
      impressions: item.impressions || item.views || 0,
      reach: item.reach || 0,
      likes: item.likes || 0,
      comments: item.comments || 0,
      shares: item.shares || 0,
      clicks: item.clicks || 0,
      spend: 0,
      conversions: 0,
    }

    app.createPost({
      platform: platformAppId,
      type: 'organic',
      title,
      content,
      publishedAt,
      metrics,
      tags: [],
      projectId: projectId || undefined,
    })
    setImported((prev) => new Set(prev).add(item.id))
  }

  const platforms: SocialPlatform[] = ['youtube', 'linkedin']
  const hasAnyConnected = connectedPlatforms.size > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col sm:!max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importer depuis tes réseaux sociaux</DialogTitle>
        </DialogHeader>

        {!hasAnyConnected ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Aucune plateforme connectée.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Va dans <strong>Paramètres → Intégrations</strong> pour connecter YouTube, Meta, TikTok ou LinkedIn.
            </p>
            <a href="/settings" className="inline-block mt-4 text-xs text-primary hover:underline">
              Aller aux paramètres →
            </a>
          </div>
        ) : (
          <>
            {/* Platform tabs */}
            <div className="flex items-center gap-1 border-b border-border pb-2 flex-wrap">
              {platforms.map((p) => {
                const isConnected = connectedPlatforms.has(p)
                return (
                  <button
                    key={p}
                    onClick={() => isConnected && setActivePlatform(p)}
                    disabled={!isConnected}
                    title={!isConnected ? `${PLATFORM_INFO[p].label} non connecté — va dans Paramètres` : undefined}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      !isConnected && 'opacity-50 cursor-not-allowed',
                      activePlatform === p && isConnected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        isConnected ? 'bg-green-500' : 'bg-muted-foreground/40'
                      )}
                    />
                    {PLATFORM_INFO[p].label}
                  </button>
                )
              })}
            </div>

            {/* Account selector (when multiple accounts for the active platform) */}
            {accountsByPlatform[activePlatform].length > 1 && (
              <div className="flex items-center gap-2 text-xs pb-2 border-b border-border flex-wrap">
                <span className="text-muted-foreground">Compte :</span>
                {accountsByPlatform[activePlatform].map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setActiveAccountId(acc.providerAccountId)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
                      activeAccountId === acc.providerAccountId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {accountLabel(acc)}
                  </button>
                ))}
              </div>
            )}

            {/* Project picker */}
            {app.projects.length > 0 && (
              <div className="flex items-center gap-2 text-xs pb-2 border-b border-border">
                <span className="text-muted-foreground">Lier les imports au projet :</span>
                <select
                  value={projectId || ''}
                  onChange={(e) => setProjectId(e.target.value || null)}
                  className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none"
                >
                  <option value="">Aucun</option>
                  {app.projects.filter((p) => p.status !== 'archived').map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Button size="xs" variant="ghost" onClick={() => loadItems(activePlatform, activeAccountId)} className="ml-auto">
                  Rafraîchir
                </Button>
              </div>
            )}

            {/* Items list — grid 2 cols on wide screens */}
            <div className="flex-1 overflow-auto -mx-6 px-6">
              {error && <p className="text-xs text-red-600 py-2">{error}</p>}
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucun élément trouvé sur ce compte.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 py-2">
                  {items.map((item) => {
                    const isImported = imported.has(item.id)
                    const title = item.title || item.caption?.slice(0, 80) || item.text?.slice(0, 80) || 'Sans titre'
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 hover:shadow-sm transition-shadow"
                      >
                        {item.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail} alt="" className="h-14 w-20 rounded-md object-cover shrink-0 bg-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                            {(item.views !== undefined && item.views > 0) && <span>{item.views.toLocaleString()} vues</span>}
                            {(item.impressions !== undefined && item.impressions > 0) && <span>{item.impressions.toLocaleString()} imp.</span>}
                            {(item.likes !== undefined && item.likes > 0) && <span>{item.likes.toLocaleString()} likes</span>}
                            {(item.comments !== undefined && item.comments > 0) && <span>{item.comments.toLocaleString()} comm.</span>}
                            {(item.shares !== undefined && item.shares > 0) && <span>{item.shares.toLocaleString()} part.</span>}
                            {item.publishedAt && (
                              <span>
                                {new Date(typeof item.publishedAt === 'number' ? item.publishedAt : item.publishedAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(item.permalink || item.url) && (
                            <a
                              href={item.permalink || item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-muted-foreground hover:text-primary px-1"
                              title="Ouvrir l'original"
                            >
                              ↗
                            </a>
                          )}
                          <Button
                            size="xs"
                            variant={isImported ? 'ghost' : 'default'}
                            disabled={isImported}
                            onClick={() => handleImport(item)}
                          >
                            {isImported ? 'Importé' : 'Importer'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                {imported.size > 0 ? `${imported.size} post${imported.size > 1 ? 's' : ''} importé${imported.size > 1 ? 's' : ''}` : 'Choisis ce que tu veux importer'}
              </p>
              <Button size="sm" onClick={onClose}>Fermer</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
