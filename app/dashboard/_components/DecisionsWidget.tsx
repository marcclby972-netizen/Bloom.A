'use client'

/**
 * Widget team-only "Décisions à voter" — liste les décisions `pending`
 * de la team active. Boutons "Pour / Contre / Abstention" appellent
 * `useDecisions(teamId).vote(decisionId, value)`.
 *
 * Vue : 3 décisions max ; au-delà → lien /decisions.
 */

import Link from 'next/link'
import { useState } from 'react'
import type { Decision, VoteValue, DecisionKind } from '@/lib/v3-types'
import { useDecisions } from '@/hooks'

const KIND_EMOJI: Record<DecisionKind, string> = {
  expense: '💰',
  rule_change: '📜',
  distribution: '🏦',
  equity_change: '📈',
  other: '📌',
}

const KIND_LABEL: Record<DecisionKind, string> = {
  expense: 'Dépense',
  rule_change: 'Changement de règle',
  distribution: 'Distribution',
  equity_change: 'Parts / equity',
  other: 'Décision',
}

function formatCents(cents: number | null): string | null {
  if (cents == null) return null
  const euros = cents / 100
  if (euros >= 1000) return `${(euros / 1000).toFixed(1).replace('.0', '')} k€`
  return `${euros.toFixed(0)} €`
}

function CTAButton({
  decision,
  value,
  label,
  variant,
  onVote,
  pending,
  done,
}: {
  decision: Decision
  value: VoteValue
  label: string
  variant: 'yes' | 'no' | undefined
  onVote: (d: Decision, v: VoteValue) => void
  pending: boolean
  done: VoteValue | null
}) {
  const isThisOne = done === value
  return (
    <button
      type="button"
      className={`vote-btn${variant ? ' ' + variant : ''}`}
      disabled={pending || done !== null}
      onClick={() => onVote(decision, value)}
      style={
        isThisOne
          ? {
              background: 'var(--ink)',
              color: '#fff',
              borderColor: 'var(--ink)',
            }
          : done !== null
            ? { opacity: 0.4 }
            : undefined
      }
    >
      {label}
    </button>
  )
}

export function DecisionsWidget({ teamId }: { teamId: string | null }) {
  const { data: decisions, vote, loading } = useDecisions(teamId)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [voted, setVoted] = useState<Record<string, VoteValue>>({})

  if (!teamId) {
    return null // Solo mode → ce widget n'a pas de sens
  }

  const pending = decisions.filter((d) => d.status === 'pending').slice(0, 3)

  const handle = async (d: Decision, value: VoteValue) => {
    setPendingId(d.id)
    try {
      await vote(d.id, value)
      setVoted((prev) => ({ ...prev, [d.id]: value }))
    } catch {
      /* error caught in hook */
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="widget w-span-8 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M4.5 7l2 2 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Décisions à voter
        </div>
        <span className="w-meta">{pending.length} en attente</span>
      </div>

      {loading && pending.length === 0 && (
        <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)' }}>Chargement…</p>
      )}
      {!loading && pending.length === 0 && (
        <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)' }}>
          Aucune décision à voter pour le moment.{' '}
          <Link href="/decisions" className="w-link" style={{ display: 'inline' }}>
            Créer →
          </Link>
        </p>
      )}

      {pending.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {pending.map((d, idx) => {
            const span = pending.length === 1 || idx === pending.length - 1 && pending.length === 3
              ? { gridColumn: '1 / -1' }
              : undefined
            const cents = formatCents(d.amountCents)
            const userVote = voted[d.id] ?? null
            return (
              <div className="decision" key={d.id} style={span}>
                <div className="dh">
                  <div className="title">{d.title}</div>
                  <span className="tag warn">PENDING</span>
                </div>
                <div className="meta">
                  <span>
                    {KIND_EMOJI[d.kind]} {KIND_LABEL[d.kind]}
                  </span>
                  {cents && <span>· {cents}</span>}
                </div>
                <div className="actions">
                  <CTAButton
                    decision={d}
                    value="for"
                    label="Pour"
                    variant="yes"
                    onVote={handle}
                    pending={pendingId === d.id}
                    done={userVote}
                  />
                  <CTAButton
                    decision={d}
                    value="against"
                    label="Contre"
                    variant="no"
                    onVote={handle}
                    pending={pendingId === d.id}
                    done={userVote}
                  />
                  <CTAButton
                    decision={d}
                    value="abstain"
                    label="Abstention"
                    variant={undefined}
                    onVote={handle}
                    pending={pendingId === d.id}
                    done={userVote}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
