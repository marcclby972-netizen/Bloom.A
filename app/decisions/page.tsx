'use client'

/**
 * Decisions — liste des décisions de l'équipe active, avec création
 * inline et filtres par status.
 *
 * Solo → empty state pointant vers /onboard.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useCurrentTeam, useDecisions } from '@/hooks'
import type {
  Decision,
  DecisionKind,
  DecisionStatus,
} from '@/lib/v3-types'

const KIND_LABEL: Record<DecisionKind, string> = {
  expense: 'Dépense',
  rule_change: 'Règle',
  distribution: 'Distribution',
  equity_change: 'Parts',
  other: 'Autre',
}

const KIND_EMOJI: Record<DecisionKind, string> = {
  expense: '💰',
  rule_change: '📜',
  distribution: '🏦',
  equity_change: '📈',
  other: '📌',
}

const STATUS_LABEL: Record<DecisionStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
  expired: 'Expirée',
}

const STATUS_COLOR: Record<DecisionStatus, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.18)', color: '#B45309' },
  approved: { bg: 'rgba(34,197,94,0.18)', color: '#15803D' },
  rejected: { bg: 'rgba(239,68,68,0.18)', color: '#B91C1C' },
  cancelled: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(236,236,236,0.6)' },
  expired: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(236,236,236,0.6)' },
}

type Filter = 'all' | DecisionStatus

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Toutes',
  pending: 'En attente',
  approved: 'Approuvées',
  rejected: 'Rejetées',
  cancelled: 'Annulées',
  expired: 'Expirées',
}

export default function DecisionsPage() {
  return (
    <DashboardShell screenLabel="Decisions">
      <DecisionsContent />
    </DashboardShell>
  )
}

function DecisionsContent() {
  const { teamId, currentTeam, isSolo } = useCurrentTeam()
  const decisions = useDecisions(teamId)
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DecisionKind>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: decisions.data.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      expired: 0,
    }
    for (const d of decisions.data) c[d.status]++
    return c
  }, [decisions.data])

  const filtered = useMemo<Decision[]>(() => {
    if (filter === 'all') return decisions.data
    return decisions.data.filter((d) => d.status === filter)
  }, [decisions.data, filter])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const parsed = amount.trim()
        ? Math.round(parseFloat(amount.replace(',', '.')) * 100)
        : null
      await decisions.create({
        title: title.trim(),
        kind,
        amountCents:
          parsed !== null && Number.isFinite(parsed) ? parsed : null,
        description: description.trim() || undefined,
      })
      setTitle('')
      setAmount('')
      setDescription('')
      setCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setBusy(false)
    }
  }

  if (isSolo) {
    return (
      <>
        <PageHeader eyebrow="Mode solo" title="Décisions" />
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'rgba(236,236,236,0.75)',
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Les décisions sont une feature de gouvernance équipe. Crée une
            équipe pour voter avec tes associés.
          </p>
          <Link href="/onboard" className="btn btn-primary">
            Créer une équipe
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={currentTeam?.name ?? 'Équipe'}
        title="Décisions"
        right={
          <>
            {(Object.keys(FILTER_LABEL) as Filter[]).slice(0, 4).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn ${filter === f ? '' : 'btn-ghost-dark'}`}
                onClick={() => setFilter(f)}
                style={
                  filter === f
                    ? { background: 'var(--ink)', color: '#fff' }
                    : undefined
                }
              >
                {FILTER_LABEL[f]}{' '}
                <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 4 }}>
                  {counts[f]}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCreating((c) => !c)}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 2v9M2 6.5h9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Nouvelle décision
            </button>
          </>
        }
      />

      {creating && (
        <form
          onSubmit={submit}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
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
            placeholder="Titre — ex : Embaucher un Lead Dev senior"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--ink)',
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DecisionKind)}
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--ink)',
                padding: '10px 14px',
                fontSize: 14,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {(Object.keys(KIND_LABEL) as DecisionKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_EMOJI[k]} {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Montant € (optionnel)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: 220,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--ink)',
                padding: '10px 14px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <textarea
            placeholder="Contexte (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--ink)',
              padding: '10px 14px',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !title.trim()}
            >
              {busy ? 'Création…' : 'Créer la décision'}
            </button>
            <button
              type="button"
              className="btn btn-ghost-dark"
              onClick={() => {
                setCreating(false)
                setTitle('')
                setAmount('')
                setDescription('')
                setError(null)
              }}
              disabled={busy}
            >
              Annuler
            </button>
            {error && (
              <span
                role="alert"
                style={{ fontSize: 13, color: '#FCA5A5', marginLeft: 8 }}
              >
                {error}
              </span>
            )}
          </div>
        </form>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {decisions.loading && filtered.length === 0 && (
          <p style={{ color: 'rgba(236,236,236,0.55)', fontSize: 13 }}>
            Chargement…
          </p>
        )}
        {!decisions.loading && filtered.length === 0 && !creating && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-card)',
              color: 'rgba(236,236,236,0.55)',
            }}
          >
            Aucune décision {filter !== 'all' && `« ${FILTER_LABEL[filter]} »`}.
          </div>
        )}

        {filtered.map((d) => {
          const cents =
            d.amountCents != null ? (d.amountCents / 100).toFixed(0) : null
          const c = STATUS_COLOR[d.status]
          return (
            <Link
              key={d.id}
              href={`/decisions/${d.id}`}
              style={{
                display: 'block',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-card)',
                padding: 16,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--surface-2)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {KIND_EMOJI[d.kind]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: 4,
                    }}
                  >
                    {d.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'rgba(236,236,236,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{KIND_LABEL[d.kind]}</span>
                    {cents && <span>· {cents} €</span>}
                    <span>
                      · Créée le{' '}
                      {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <span
                  className="tag"
                  style={{ background: c.bg, color: c.color }}
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
