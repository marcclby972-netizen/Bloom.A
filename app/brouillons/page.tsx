'use client'

/**
 * Brouillons — content planner multi-plateforme (LinkedIn / X / Instagram / TikTok)
 * câblé à Supabase (social_drafts_v3 + social_targets_v3).
 *
 * 3 onglets :
 *  - Liste : tous les brouillons + filtres status + create form
 *  - Calendrier : grid 30 jours × plateformes, vert/orange/rouge selon target
 *  - Objectifs : per_day + per_week par plateforme
 *
 * Streak hero card au-dessus des tabs, calcule en client via
 * `computeStreakByPlatform` (pure rule).
 *
 * Migration localStorage → Supabase au mount : si `bloom_drafts_v1` existe,
 * prompt + bulk import + clear.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useSocialDrafts, useSocialTargets } from '@/hooks'
import {
  computeStreakByPlatform,
  type SocialPlatform,
} from '@/lib/rules/streak'
import type { SocialDraft, SocialDraftStatus } from '@/lib/v3-types'

// ──────────────── Constantes UI ────────────────

const PLATFORMS: SocialPlatform[] = ['linkedin', 'x', 'instagram', 'tiktok']

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  linkedin: '#0A66C2',
  x: '#F3F3F2',
  instagram: '#E1306C',
  tiktok: '#69C9D0',
}

const PLATFORM_EMOJI: Record<SocialPlatform, string> = {
  linkedin: '🔵',
  x: '🐦',
  instagram: '📸',
  tiktok: '🎵',
}

const STATUS_LABEL: Record<SocialDraftStatus, string> = {
  brouillon: 'Brouillon',
  planifie: 'Planifié',
  publie: 'Publié',
}

const STATUS_COLOR: Record<SocialDraftStatus, { bg: string; fg: string }> = {
  brouillon: { bg: 'rgba(155,155,159,0.18)', fg: '#9B9B9F' },
  planifie: { bg: 'rgba(59,130,246,0.18)', fg: '#3B82F6' },
  publie: { bg: 'rgba(34,197,94,0.18)', fg: '#22C55E' },
}

type Tab = 'list' | 'calendar' | 'targets'

const STORAGE_LEGACY_KEY = 'bloom_drafts_v1'

// ──────────────── Page wrapper ────────────────

export default function BrouillonsPage() {
  return (
    <DashboardShell screenLabel="Brouillons">
      <BrouillonsContent />
    </DashboardShell>
  )
}

function BrouillonsContent() {
  const drafts = useSocialDrafts()
  const targets = useSocialTargets()
  const [tab, setTab] = useState<Tab>('list')
  const [filter, setFilter] = useState<'all' | SocialDraftStatus>('all')
  const [creating, setCreating] = useState(false)

  // ─── Migration localStorage (one-shot) ───
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (drafts.loading) return  // attendre que la 1ère fetch soit OK
    const raw = localStorage.getItem(STORAGE_LEGACY_KEY)
    if (!raw) return
    try {
      const legacy = JSON.parse(raw) as Array<{
        platform: SocialPlatform
        title: string
        content: string
        scheduledAt: string | null
      }>
      if (!Array.isArray(legacy) || legacy.length === 0) {
        localStorage.removeItem(STORAGE_LEGACY_KEY)
        return
      }
      const ok = window.confirm(
        `Importer ${legacy.length} brouillon${legacy.length > 1 ? 's' : ''} sauvegardé${legacy.length > 1 ? 's' : ''} localement dans Bloom ?`
      )
      if (ok) {
        Promise.all(
          legacy.map((d) =>
            drafts
              .create({
                platform: d.platform,
                title: d.title,
                content: d.content,
                scheduledAt: d.scheduledAt,
              })
              .catch(() => null)
          )
        ).finally(() => {
          localStorage.removeItem(STORAGE_LEGACY_KEY)
        })
      } else {
        localStorage.removeItem(STORAGE_LEGACY_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_LEGACY_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts.loading])

  // ─── Streak ───
  const streaks = useMemo(
    () =>
      computeStreakByPlatform(
        drafts.publishedByPlatform,
        targets.targetsByPlatform
      ),
    [drafts.publishedByPlatform, targets.targetsByPlatform]
  )

  return (
    <>
      <PageHeader
        eyebrow="Content planner"
        title="Brouillons & calendrier"
        right={
          tab === 'list' ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCreating((c) => !c)}
            >
              + Nouveau brouillon
            </button>
          ) : undefined
        }
      />

      {/* Streak hero */}
      <StreakHero streaks={streaks} targets={targets.targetsByPlatform} />

      {/* Tabs */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bloom-surface-2)',
          border: '1px solid var(--bloom-border)',
          borderRadius: 10,
          padding: 3,
          gap: 1,
          marginBottom: 18,
        }}
      >
        {(['list', 'calendar', 'targets'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? 'var(--bloom-surface)' : 'transparent',
              color: tab === t ? 'var(--bloom-text)' : 'var(--bloom-text-muted)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 7,
              cursor: 'pointer',
            }}
          >
            {t === 'list' ? 'Liste' : t === 'calendar' ? 'Calendrier' : 'Objectifs'}
          </button>
        ))}
      </div>

      {/* Content selon tab */}
      {tab === 'list' && (
        <ListTab
          drafts={drafts}
          filter={filter}
          setFilter={setFilter}
          creating={creating}
          setCreating={setCreating}
        />
      )}
      {tab === 'calendar' && (
        <CalendarTab
          drafts={drafts}
          targets={targets.targetsByPlatform}
        />
      )}
      {tab === 'targets' && (
        <TargetsTab targets={targets} />
      )}
    </>
  )
}

// ──────────────── Streak hero ────────────────

function StreakHero({
  streaks,
  targets,
}: {
  streaks: Map<SocialPlatform, { current: number; longest: number }>
  targets: Map<SocialPlatform, { perDay: number }>
}) {
  const active = PLATFORMS.filter((p) => (targets.get(p)?.perDay ?? 0) > 0)
  if (active.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid var(--bloom-border)',
          borderRadius: 14,
          padding: 18,
          marginBottom: 18,
          color: 'var(--bloom-text-muted)',
          fontSize: 13,
        }}
      >
        <strong style={{ color: 'var(--bloom-text)' }}>
          🎯 Définis tes objectifs
        </strong>{' '}
        — combien de posts par jour par plateforme ? Va dans l&apos;onglet
        Objectifs pour activer le suivi de streak.
      </div>
    )
  }
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 18,
        marginBottom: 18,
        display: 'flex',
        gap: 22,
        flexWrap: 'wrap',
      }}
    >
      {active.map((p) => {
        const s = streaks.get(p) ?? { current: 0, longest: 0 }
        const isHot = s.current >= 3
        return (
          <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--bloom-text-faint)',
              }}
            >
              {PLATFORM_EMOJI[p]} {PLATFORM_LABEL[p]}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 28,
                fontWeight: 800,
                color: isHot ? '#FF8A1A' : 'var(--bloom-text)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {isHot && '🔥 '}
              {s.current}
              <span
                style={{
                  fontSize: 13,
                  opacity: 0.5,
                  marginLeft: 4,
                  fontWeight: 600,
                }}
              >
                jour{s.current > 1 ? 's' : ''}
              </span>
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--bloom-text-muted)',
              }}
            >
              record : {s.longest}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ──────────────── Onglet Liste ────────────────

function ListTab({
  drafts,
  filter,
  setFilter,
  creating,
  setCreating,
}: {
  drafts: ReturnType<typeof useSocialDrafts>
  filter: 'all' | SocialDraftStatus
  setFilter: (f: 'all' | SocialDraftStatus) => void
  creating: boolean
  setCreating: (b: boolean) => void
}) {
  const counts = useMemo(() => {
    return {
      all: drafts.data.length,
      brouillon: drafts.data.filter((d) => d.status === 'brouillon').length,
      planifie: drafts.data.filter((d) => d.status === 'planifie').length,
      publie: drafts.data.filter((d) => d.status === 'publie').length,
    }
  }, [drafts.data])

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? drafts.data
        : drafts.data.filter((d) => d.status === filter),
    [drafts.data, filter]
  )

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all', 'brouillon', 'planifie', 'publie'] as const).map((f) => (
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
      </div>

      {creating && (
        <DraftForm
          onCancel={() => setCreating(false)}
          onSave={async (input) => {
            await drafts.create(input).catch(() => {})
            setCreating(false)
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {drafts.loading && filtered.length === 0 && (
          <p style={{ color: 'var(--bloom-text-muted)', fontSize: 13 }}>
            Chargement…
          </p>
        )}
        {!drafts.loading && filtered.length === 0 && !creating && (
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
              ? 'Aucun brouillon — démarre par le premier.'
              : 'Rien dans cette catégorie.'}
          </div>
        )}
        {filtered.map((d) => (
          <DraftRow
            key={d.id}
            draft={d}
            onStatusChange={(s) => void drafts.update(d.id, { status: s })}
            onMarkPublished={() => void drafts.markPublished(d.id)}
            onRemove={() => void drafts.remove(d.id)}
          />
        ))}
      </div>
    </>
  )
}

function DraftForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: (input: {
    platform: SocialPlatform
    title: string
    content: string
    scheduledAt: string | null
  }) => Promise<void> | void
}) {
  const [platform, setPlatform] = useState<SocialPlatform>('linkedin')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSave({
        platform,
        title: title.trim(),
        content: content.trim(),
        scheduledAt: scheduledAt || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
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
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--bloom-text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Plateforme :
        </span>
        {PLATFORMS.map((p) => {
          const active = platform === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
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
              {PLATFORM_EMOJI[p]} {PLATFORM_LABEL[p]}
            </button>
          )
        })}
      </div>
      <input
        autoFocus
        type="text"
        placeholder="Titre du post"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={200}
        style={inputStyle}
      />
      <textarea
        placeholder="Contenu du post…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={5}
        maxLength={5000}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
      />
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        style={{ ...inputStyle, maxWidth: 280 }}
        aria-label="Date de publication"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !title.trim() || !content.trim()}
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn btn-ghost-dark" onClick={onCancel}>
          Annuler
        </button>
        {error && (
          <span style={{ fontSize: 12.5, color: '#FCA5A5' }}>{error}</span>
        )}
      </div>
    </form>
  )
}

function DraftRow({
  draft,
  onStatusChange,
  onMarkPublished,
  onRemove,
}: {
  draft: SocialDraft
  onStatusChange: (s: SocialDraftStatus) => void
  onMarkPublished: () => void
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
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <span
          style={{
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
            📅{' '}
            {new Date(draft.scheduledAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        )}
        {draft.publishedAt && (
          <span style={{ fontSize: 11.5, color: '#22C55E' }}>
            ✓ Publié le{' '}
            {new Date(draft.publishedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {draft.status !== 'publie' && (
            <button
              type="button"
              onClick={onMarkPublished}
              style={ghostBtnStyle}
              title="J'ai publié ce post"
            >
              ✓ Publié
            </button>
          )}
          <select
            value={draft.status}
            onChange={(e) => onStatusChange(e.target.value as SocialDraftStatus)}
            style={{
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
            <option value="publie">Publié</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (confirm('Supprimer ce brouillon ?')) onRemove()
            }}
            style={{ ...ghostBtnStyle, color: '#FCA5A5' }}
            title="Supprimer"
          >
            ×
          </button>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bloom-text)', marginBottom: 4 }}>
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

// ──────────────── Onglet Calendrier ────────────────

function CalendarTab({
  drafts,
  targets,
}: {
  drafts: ReturnType<typeof useSocialDrafts>
  targets: Map<SocialPlatform, { perDay: number }>
}) {
  // 30 derniers jours en colonnes (J-29 → J0)
  const days = useMemo(() => {
    const arr: { iso: string; date: Date }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      arr.push({ iso: localIso(d), date: d })
    }
    return arr
  }, [])

  // Map<platform, Map<iso, count>>
  const countsByPlatformDay = useMemo(() => {
    const m = new Map<SocialPlatform, Map<string, number>>()
    for (const p of PLATFORMS) m.set(p, new Map())
    for (const d of drafts.data) {
      if (!d.publishedAt) continue
      const iso = localIso(new Date(d.publishedAt))
      const pm = m.get(d.platform)
      if (!pm) continue
      pm.set(iso, (pm.get(iso) ?? 0) + 1)
    }
    return m
  }, [drafts.data])

  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 18,
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 800 }}>
        {/* Headers : jours */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `100px repeat(30, 1fr)`,
            gap: 2,
            paddingLeft: 4,
          }}
        >
          <div />
          {days.map((d, idx) => (
            <div
              key={d.iso}
              style={{
                fontSize: 9,
                color: 'var(--bloom-text-faint)',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {idx % 5 === 0 || idx === 29 ? d.date.getDate() : ''}
            </div>
          ))}
        </div>

        {/* Lignes par plateforme */}
        {PLATFORMS.map((p) => {
          const target = targets.get(p)?.perDay ?? 0
          const counts = countsByPlatformDay.get(p)!
          return (
            <div
              key={p}
              style={{
                display: 'grid',
                gridTemplateColumns: `100px repeat(30, 1fr)`,
                gap: 2,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--bloom-text-muted)',
                  paddingRight: 4,
                }}
              >
                {PLATFORM_EMOJI[p]} {PLATFORM_LABEL[p]}
              </span>
              {days.map((day) => {
                const count = counts.get(day.iso) ?? 0
                const color = cellColor(count, target)
                return (
                  <div
                    key={day.iso}
                    title={`${day.iso} — ${count} post${count > 1 ? 's' : ''}${target ? ` (objectif : ${target})` : ''}`}
                    style={{
                      height: 22,
                      borderRadius: 4,
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: color.fg,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {count > 0 ? count : ''}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Légende */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 12,
            fontSize: 11,
            color: 'var(--bloom-text-muted)',
            paddingLeft: 4,
          }}
        >
          <LegendDot color="#22C55E" label="Objectif atteint" />
          <LegendDot color="#FBBF24" label="Partiel" />
          <LegendDot color="rgba(239,68,68,0.5)" label="Raté" />
          <LegendDot color="rgba(255,255,255,0.06)" label="Pas d'objectif" />
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      {label}
    </span>
  )
}

function cellColor(
  count: number,
  target: number
): { bg: string; border: string; fg: string } {
  if (target === 0) {
    if (count > 0)
      return {
        bg: 'rgba(155,155,159,0.18)',
        border: 'rgba(155,155,159,0.3)',
        fg: 'var(--bloom-text)',
      }
    return {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.06)',
      fg: 'transparent',
    }
  }
  if (count >= target) {
    return {
      bg: 'rgba(34,197,94,0.25)',
      border: 'rgba(34,197,94,0.4)',
      fg: '#22C55E',
    }
  }
  if (count > 0) {
    return {
      bg: 'rgba(251,191,36,0.22)',
      border: 'rgba(251,191,36,0.4)',
      fg: '#FBBF24',
    }
  }
  // Past day with no posts but target set → rouge léger
  return {
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.3)',
    fg: 'transparent',
  }
}

// ──────────────── Onglet Objectifs ────────────────

function TargetsTab({ targets }: { targets: ReturnType<typeof useSocialTargets> }) {
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--bloom-text)',
          marginBottom: 6,
        }}
      >
        Objectifs de publication
      </h2>
      <p style={{ fontSize: 12.5, color: 'var(--bloom-text-muted)', marginBottom: 18 }}>
        Combien de posts par jour / par semaine sur chaque plateforme ? Le
        suivi de streak commence dès que tu définis un objectif quotidien &gt; 0.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLATFORMS.map((p) => {
          const current = targets.data.find((t) => t.platform === p)
          return (
            <TargetRow
              key={p}
              platform={p}
              perDay={current?.targetPerDay ?? 0}
              perWeek={current?.targetPerWeek ?? 0}
              onSave={(perDay, perWeek) =>
                void targets.upsert({
                  platform: p,
                  targetPerDay: perDay,
                  targetPerWeek: perWeek,
                })
              }
            />
          )
        })}
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          color: 'var(--bloom-text-faint)',
        }}
      >
        Note : Bloom ne publie pas à ta place. Tu publies manuellement sur
        chaque réseau puis tu cliques « ✓ Publié » sur ton brouillon.
        Zéro API, 100% à toi.
      </p>

      <p
        style={{
          marginTop: 8,
          fontSize: 11,
          color: 'var(--bloom-text-faint)',
        }}
      >
        Pas de plateforme dans la liste ? Demande-la sur{' '}
        <Link href="/settings" style={{ color: 'var(--bloom-accent)' }}>
          /settings
        </Link>
        .
      </p>
    </div>
  )
}

function TargetRow({
  platform,
  perDay: initialDay,
  perWeek: initialWeek,
  onSave,
}: {
  platform: SocialPlatform
  perDay: number
  perWeek: number
  onSave: (perDay: number, perWeek: number) => void
}) {
  const [perDay, setPerDay] = useState(initialDay)
  const [perWeek, setPerWeek] = useState(initialWeek)
  const [busy, setBusy] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const dirty = perDay !== initialDay || perWeek !== initialWeek

  const save = async () => {
    setBusy(true)
    onSave(perDay, perWeek)
    setSavedFlash(true)
    setBusy(false)
    setTimeout(() => setSavedFlash(false), 1400)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        background: 'var(--bloom-surface-2)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 10,
      }}
    >
      <span
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          background: `${PLATFORM_COLOR[platform]}22`,
          color: PLATFORM_COLOR[platform],
          fontSize: 12,
          fontWeight: 700,
          minWidth: 100,
        }}
      >
        {PLATFORM_EMOJI[platform]} {PLATFORM_LABEL[platform]}
      </span>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          color: 'var(--bloom-text-muted)',
        }}
      >
        <input
          type="number"
          min={0}
          max={20}
          value={perDay}
          onChange={(e) => setPerDay(Math.max(0, parseInt(e.target.value || '0')))}
          style={{
            width: 56,
            background: 'var(--bloom-surface-3)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 6,
            color: 'var(--bloom-text)',
            padding: '4px 8px',
            fontSize: 13,
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        />
        /jour
      </label>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          color: 'var(--bloom-text-muted)',
        }}
      >
        <input
          type="number"
          min={0}
          max={100}
          value={perWeek}
          onChange={(e) => setPerWeek(Math.max(0, parseInt(e.target.value || '0')))}
          style={{
            width: 56,
            background: 'var(--bloom-surface-3)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 6,
            color: 'var(--bloom-text)',
            padding: '4px 8px',
            fontSize: 13,
            fontFamily: 'inherit',
            textAlign: 'center',
          }}
        />
        /semaine
      </label>
      {dirty && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={busy}
          style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 12 }}
        >
          Enregistrer
        </button>
      )}
      {savedFlash && (
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#22C55E' }}>
          ✓ enregistré
        </span>
      )}
    </div>
  )
}

// ──────────────── Helpers ────────────────

function localIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

const ghostBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--bloom-border)',
  borderRadius: 6,
  color: 'var(--bloom-text-muted)',
  padding: '3px 10px',
  fontSize: 11,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
