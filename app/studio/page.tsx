'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PostEditorModal, type LinkedInPost, type LinkedInAccount } from '@/components/studio/PostEditorModal'

const STATUS_COLUMNS: { id: LinkedInPost['status']; label: string; color: string; bg: string }[] = [
  { id: 'idea', label: 'Idée', color: 'bg-amber-500', bg: 'bg-amber-50/40 dark:bg-amber-950/20' },
  { id: 'draft', label: 'Brouillon', color: 'bg-muted-foreground', bg: 'bg-muted/40' },
  { id: 'scheduled', label: 'Planifié', color: 'bg-blue-500', bg: 'bg-blue-50/40 dark:bg-blue-950/20' },
  { id: 'published', label: 'Publié', color: 'bg-green-500', bg: 'bg-green-50/40 dark:bg-green-950/20' },
]

type View = 'kanban' | 'list'

export default function StudioPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<LinkedInPost | null>(null)
  const [view, setView] = useState<View>('kanban')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [postsRes, liRes] = await Promise.all([
        fetch('/api/linkedin/posts'),
        fetch('/api/linkedin'),
      ])
      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts || [])
      }
      if (liRes.ok) {
        const data = await liRes.json()
        if (data.connected && Array.isArray(data.accounts)) {
          setAccounts(data.accounts)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const counts = useMemo(() => {
    const c: Record<string, number> = { idea: 0, draft: 0, scheduled: 0, published: 0, failed: 0 }
    for (const p of posts) c[p.status] = (c[p.status] || 0) + 1
    return c
  }, [posts])

  const openNew = () => { setEditingPost(null); setEditorOpen(true) }
  const openEdit = (p: LinkedInPost) => { setEditingPost(p); setEditorOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce post ?')) return
    await fetch(`/api/linkedin/posts/${id}`, { method: 'DELETE' })
    refresh()
  }

  const handlePublishNow = async (id: string) => {
    if (!confirm('Publier ce post sur LinkedIn maintenant ?')) return
    const res = await fetch(`/api/linkedin/posts/${id}/publish`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      alert('Erreur : ' + (data.error || 'Échec publication'))
    }
    refresh()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header counts={counts} view={view} onViewChange={setView} onNew={openNew} accountsCount={accounts.length} onRefresh={refresh} loading={loading} />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 max-w-2xl mx-auto">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Aucun compte LinkedIn connecté</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Va dans <strong>Paramètres → Intégrations → LinkedIn</strong> pour connecter un compte avant de pouvoir publier.
              Tu peux quand même créer des brouillons et des idées dès maintenant.
            </p>
          </div>
        ) : null}

        {view === 'kanban' ? (
          <KanbanView posts={posts} onEdit={openEdit} onDelete={handleDelete} onPublishNow={handlePublishNow} onNew={openNew} loading={loading} />
        ) : (
          <ListView posts={posts} onEdit={openEdit} onDelete={handleDelete} onPublishNow={handlePublishNow} loading={loading} />
        )}
      </div>

      <PostEditorModal
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingPost(null) }}
        onSaved={refresh}
        post={editingPost}
        accounts={accounts}
      />
    </div>
  )
}

function Header({ counts, view, onViewChange, onNew, accountsCount, onRefresh, loading }: {
  counts: Record<string, number>
  view: View
  onViewChange: (v: View) => void
  onNew: () => void
  accountsCount: number
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M8 1.5L9.5 5.5L13.5 7L9.5 8.5L8 13L6.5 8.5L2.5 7L6.5 5.5Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Content Studio</h1>
            <p className="text-xs text-muted-foreground">
              Planifie et publie tes posts LinkedIn
              {accountsCount > 0 && <> · {accountsCount} compte{accountsCount > 1 ? 's' : ''}</>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 ml-6 text-xs">
            <KpiInline label="Idées" value={counts.idea || 0} color="text-amber-600" />
            <KpiInline label="Brouillons" value={counts.draft || 0} color="text-muted-foreground" />
            <KpiInline label="Planifiés" value={counts.scheduled || 0} color="text-blue-600" />
            <KpiInline label="Publiés" value={counts.published || 0} color="text-green-600" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button
              onClick={() => onViewChange('kanban')}
              className={cn('px-2 py-1 rounded-md text-xs font-medium transition-colors',
                view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Kanban
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={cn('px-2 py-1 rounded-md text-xs font-medium transition-colors',
                view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Liste
            </button>
          </div>
          <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading} title="Rafraîchir">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(loading && 'animate-spin')}>
              <path d="M2 4.5L4 2.5M2 4.5L4 6.5M2 4.5C5 2 9 2 11 5.5" />
              <path d="M12 9.5L10 11.5M12 9.5L10 7.5M12 9.5C9 12 5 12 3 8.5" />
            </svg>
          </Button>
          <Button size="sm" onClick={onNew}>+ Nouveau post</Button>
        </div>
      </div>
      <div className="h-px gradient-line" />
    </div>
  )
}

function KpiInline({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-base font-bold tabular-nums', color)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

function KanbanView({ posts, onEdit, onDelete, onPublishNow, onNew, loading }: {
  posts: LinkedInPost[]
  onEdit: (p: LinkedInPost) => void
  onDelete: (id: string) => void
  onPublishNow: (id: string) => void
  onNew: () => void
  loading: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => {
        const colPosts = posts.filter((p) => p.status === col.id)
        return (
          <div key={col.id} className={cn('rounded-xl border border-border p-3 flex flex-col min-h-[400px]', col.bg)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', col.color)} />
                <span className="text-sm font-medium">{col.label}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{colPosts.length}</span>
            </div>
            <div className="flex-1 space-y-2">
              {loading && colPosts.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-4">Chargement...</div>
              ) : colPosts.length === 0 ? (
                <button
                  onClick={onNew}
                  className="w-full rounded-lg border border-dashed border-border bg-background/40 hover:bg-background/80 transition-colors py-8 text-xs text-muted-foreground"
                >
                  + Nouveau
                </button>
              ) : (
                colPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onEdit={() => onEdit(p)}
                    onDelete={() => onDelete(p.id)}
                    onPublishNow={() => onPublishNow(p.id)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ posts, onEdit, onDelete, onPublishNow, loading }: {
  posts: LinkedInPost[]
  onEdit: (p: LinkedInPost) => void
  onDelete: (id: string) => void
  onPublishNow: (id: string) => void
  loading: boolean
}) {
  const sorted = [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  if (loading && posts.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
  if (sorted.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Aucun post pour le moment</p>
  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      {sorted.map((p) => (
        <PostCard key={p.id} post={p} onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} onPublishNow={() => onPublishNow(p.id)} expanded />
      ))}
    </div>
  )
}

function PostCard({ post, onEdit, onDelete, onPublishNow, expanded }: {
  post: LinkedInPost
  onEdit: () => void
  onDelete: () => void
  onPublishNow: () => void
  expanded?: boolean
}) {
  const col = STATUS_COLUMNS.find((c) => c.id === post.status)
  const isFailed = post.status === 'failed'
  return (
    <div className="group rounded-lg border border-border bg-background p-3 hover:shadow-sm transition-shadow cursor-pointer" onClick={onEdit}>
      {(isFailed || col) && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', isFailed ? 'bg-red-500' : col!.color)} />
          <span className={cn('text-[10px] uppercase tracking-wider font-medium', isFailed ? 'text-red-600' : 'text-muted-foreground')}>
            {isFailed ? 'Échec' : col!.label}
          </span>
        </div>
      )}
      <p className={cn('text-sm font-medium leading-snug', !expanded && 'line-clamp-2')}>
        {post.content || <span className="italic text-muted-foreground">Vide — clique pour éditer</span>}
      </p>
      {expanded && post.content.length > 200 && (
        <p className="text-xs text-muted-foreground mt-1.5">{post.content.length} caractères</p>
      )}
      {post.brief && !expanded && (
        <p className="text-[10px] text-muted-foreground italic mt-1.5 line-clamp-1">Brief : {post.brief}</p>
      )}

      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>
          {post.status === 'scheduled' && post.scheduled_at
            ? `📅 ${new Date(post.scheduled_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : post.status === 'published' && post.published_at
              ? `✓ ${new Date(post.published_at).toLocaleDateString('fr-FR')}`
              : new Date(post.created_at).toLocaleDateString('fr-FR')}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {(post.status === 'draft' || post.status === 'scheduled' || post.status === 'failed') && post.oauth_token_id && (
            <button onClick={onPublishNow} title="Publier maintenant" className="h-6 px-2 rounded text-[10px] bg-primary text-primary-foreground hover:bg-primary/90">
              Publier
            </button>
          )}
          <button onClick={onDelete} title="Supprimer" className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h8M4 3V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V3" />
              <path d="M3 3v7a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3" />
            </svg>
          </button>
        </div>
      </div>

      {isFailed && post.publish_error && (
        <p className="text-[10px] text-red-600 mt-1.5 italic">⚠ {post.publish_error}</p>
      )}
    </div>
  )
}
