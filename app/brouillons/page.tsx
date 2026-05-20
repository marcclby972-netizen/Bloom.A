'use client'

/**
 * Brouillons — content planner pour social posts (LinkedIn / X / Instagram).
 *
 * MVP : créer un brouillon avec contenu + plateforme + statut + date prévue
 * de publication. Liste avec filtres status. Pas d'API de publication —
 * planification + rappels uniquement (cf. brief v0).
 *
 * Backend stub : on stocke les brouillons dans localStorage pour l'instant
 * (pas de table v3 dédiée — viendra dans une itération séparée). Pattern
 * Result<T> respecté pour migrer facilement vers Supabase plus tard.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'

type Platform = 'linkedin' | 'x' | 'instagram'
type DraftStatus = 'brouillon' | 'planifie' | 'a-publier'

type Draft = {
  id: string
  platform: Platform
  status: DraftStatus
  title: string
  content: string
  scheduledAt: string | null
  createdAt: string
}

const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
}

const PLATFORM_COLOR: Record<Platform, string> = {
  linkedin: '#0A66C2',
  x: '#F3F3F2',
  instagram: '#E1306C',
}

const STATUS_LABEL: Record<DraftStatus, string> = {
  brouillon: 'Brouillon',
  planifie: 'Planifié',
  'a-publier': 'À publier',
}

const STATUS_COLOR: Record<DraftStatus, { bg: string; fg: string }> = {
  brouillon: { bg: 'rgba(155,155,159,0.18)', fg: '#9B9B9F' },
  planifie: { bg: 'rgba(59,130,246,0.18)', fg: '#3B82F6' },
  'a-publier': { bg: 'rgba(255,138,26,0.18)', fg: '#FF8A1A' },
}

const STORAGE_KEY = 'bloom_drafts_v1'

function loadDrafts(): Draft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Draft[]
  } catch {
    return []
  }
}
function saveDrafts(drafts: Draft[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export default function BrouillonsPage() {
  return (
    <DashboardShell screenLabel="Brouillons">
      <BrouillonsContent />
    </DashboardShell>
  )
}

function BrouillonsContent() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [filter, setFilter] = useState<'all' | DraftStatus>('all')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setDrafts(loadDrafts())
  }, [])

  const filtered = useMemo<Draft[]>(() => {
    if (filter === 'all') return drafts
    return drafts.filter((d) => d.status === filter)
  }, [drafts, filter])

  const counts = useMemo(() => {
    return {
      all: drafts.length,
      brouillon: drafts.filter((d) => d.status === 'brouillon').length,
      planifie: drafts.filter((d) => d.status === 'planifie').length,
      'a-publier': drafts.filter((d) => d.status === 'a-publier').length,
    }
  }, [drafts])

  const addDraft = (
    platforms: Platform[],
    title: string,
    content: string,
    scheduledAt: string | null
  ) => {
    const now = new Date().toISOString()
    const newDrafts = platforms.map<Draft>((p) => ({
      id: `${Date.now()}-${p}`,
      platform: p,
      status: scheduledAt ? 'planifie' : 'brouillon',
      title,
      content,
      scheduledAt,
      createdAt: now,
    }))
    const updated = [...newDrafts, ...drafts]
    setDrafts(updated)
    saveDrafts(updated)
  }

  const setStatus = (id: string, status: DraftStatus) => {
    const updated = drafts.map((d) => (d.id === id ? { ...d, status } : d))
    setDrafts(updated)
    saveDrafts(updated)
  }

  const remove = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id)
    setDrafts(updated)
    saveDrafts(updated)
  }

  return (
    <>
      <PageHeader
        eyebrow="Content planner"
        title="Brouillons"
        right={
          <>
            {(['all', 'brouillon', 'planifie', 'a-publier'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn ${filter === f ? '' : 'btn-ghost-dark'}`}
                onClick={() => setFilter(f)}
                style={
                  filter === f
                    ? { background: 'var(--bloom-text)', color: 'var(--bloom-bg)' }
                    : undefined
                }
              >
                {f === 'all' ? 'Tous' : STATUS_LABEL[f]}
                <span style={{ marginLeft: 4, opacity: 0.6, fontSize: 11 }}>
                  {counts[f]}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCreating((c) => !c)}
            >
              + Nouveau brouillon
            </button>
          </>
        }
      />

      {creating && (
        <DraftForm
          onCancel={() => setCreating(false)}
          onSave={(platforms, title, content, scheduledAt) => {
            addDraft(platforms, title, content, scheduledAt)
            setCreating(false)
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && !creating && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              background: 'var(--bloom-surface)',
              border: '1px solid var(--bloom-border)',
              borderRadius: 14,
              color: 'var(--bloom-text-muted)',
            }}
          >
            {filter === 'all'
              ? 'Aucun brouillon. Crée ton premier post.'
              : 'Aucun brouillon dans cette catégorie.'}
          </div>
        )}
        {filtered.map((d) => (
          <DraftRow
            key={d.id}
            draft={d}
            onStatusChange={(s) => setStatus(d.id, s)}
            onRemove={() => remove(d.id)}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 11.5,
          color: 'var(--bloom-text-faint)',
        }}
      >
        Note : les brouillons sont stockés localement (localStorage). Pas
        d&apos;API de publication automatique — planification + rappels
        uniquement.
      </p>
    </>
  )
}

function DraftForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: (
    platforms: Platform[],
    title: string,
    content: string,
    scheduledAt: string | null
  ) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(['linkedin']))
  const [scheduledAt, setScheduledAt] = useState('')

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (platforms.size === 0 || !title.trim() || !content.trim()) return
    onSave(
      Array.from(platforms),
      title.trim(),
      content.trim(),
      scheduledAt || null
    )
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <input
        autoFocus
        type="text"
        placeholder="Titre du post"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={inputStyle}
      />
      <textarea
        placeholder="Contenu du post…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={5}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--bloom-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Plateformes :
        </span>
        {(['linkedin', 'x', 'instagram'] as Platform[]).map((p) => {
          const active = platforms.has(p)
          return (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: `1.5px solid ${active ? PLATFORM_COLOR[p] : 'var(--bloom-border)'}`,
                background: active ? `${PLATFORM_COLOR[p]}22` : 'transparent',
                color: active ? PLATFORM_COLOR[p] : 'var(--bloom-text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {PLATFORM_LABEL[p]}
            </button>
          )
        })}
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          style={{ ...inputStyle, width: 220 }}
          aria-label="Date de publication"
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!title.trim() || !content.trim() || platforms.size === 0}
        >
          Enregistrer
        </button>
        <button type="button" className="btn btn-ghost-dark" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}

function DraftRow({
  draft,
  onStatusChange,
  onRemove,
}: {
  draft: Draft
  onStatusChange: (s: DraftStatus) => void
  onRemove: () => void
}) {
  const sc = STATUS_COLOR[draft.status]
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 6,
            background: `${PLATFORM_COLOR[draft.platform]}22`,
            color: PLATFORM_COLOR[draft.platform],
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {PLATFORM_LABEL[draft.platform]}
        </span>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 6,
            background: sc.bg,
            color: sc.fg,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {STATUS_LABEL[draft.status]}
        </span>
        {draft.scheduledAt && (
          <span style={{ fontSize: 11.5, color: 'var(--bloom-text-muted)' }}>
            {new Date(draft.scheduledAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        )}
        <select
          value={draft.status}
          onChange={(e) => onStatusChange(e.target.value as DraftStatus)}
          style={{
            marginLeft: 'auto',
            background: 'var(--bloom-surface-2)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 6,
            color: 'var(--bloom-text)',
            padding: '3px 8px',
            fontSize: 11,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <option value="brouillon">Brouillon</option>
          <option value="planifie">Planifié</option>
          <option value="a-publier">À publier</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: '1px solid var(--bloom-border)',
            borderRadius: 6,
            color: '#FCA5A5',
            padding: '3px 8px',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--bloom-text)',
          marginBottom: 4,
        }}
      >
        {draft.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--bloom-text-muted)',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {draft.content}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bloom-surface-2)',
  border: '1px solid var(--bloom-border)',
  borderRadius: 10,
  color: 'var(--bloom-text)',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}
