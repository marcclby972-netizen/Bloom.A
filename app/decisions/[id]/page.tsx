'use client'

/**
 * Decision detail — voir le détail, voter, voir le tally computed live.
 *
 * Vote optimiste : on garde localement le dernier vote pour griser les
 * autres boutons. Le compute API recalcule à chaque vote.
 */

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../../dashboard/_components/DashboardShell'
import { useCurrentTeam, useDecisions } from '@/hooks'
import type {
  DecisionComputedStatus,
  DecisionKind,
  DecisionStatus,
  VoteValue,
} from '@/lib/v3-types'

const KIND_LABEL: Record<DecisionKind, string> = {
  expense: 'Dépense',
  rule_change: 'Changement de règle',
  distribution: 'Distribution',
  equity_change: 'Parts / equity',
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

export default function DecisionDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(props.params)
  return (
    <DashboardShell screenLabel="Decision detail">
      <DecisionDetail id={id} />
    </DashboardShell>
  )
}

function DecisionDetail({ id }: { id: string }) {
  const team = useCurrentTeam()
  const decisions = useDecisions(team.teamId)
  const decision = decisions.data.find((d) => d.id === id)

  const [computed, setComputed] = useState<DecisionComputedStatus | null>(null)
  const [computing, setComputing] = useState(false)
  const [voted, setVoted] = useState<VoteValue | null>(null)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = async () => {
    setComputing(true)
    try {
      const status = await decisions.computeStatus(id)
      setComputed(status)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setComputing(false)
    }
  }

  useEffect(() => {
    if (decision) void refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, decision?.id])

  const handleVote = async (value: VoteValue) => {
    setError(null)
    setVoting(true)
    try {
      await decisions.vote(id, value)
      setVoted(value)
      await refreshStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote échoué')
    } finally {
      setVoting(false)
    }
  }

  const cents = useMemo(
    () =>
      decision?.amountCents != null
        ? (decision.amountCents / 100).toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + ' €'
        : null,
    [decision]
  )

  if (decisions.loading && !decision) {
    return <p style={{ color: 'rgba(236,236,236,0.55)' }}>Chargement…</p>
  }

  if (!decision) {
    return (
      <>
        <PageHeader
          eyebrow="Erreur"
          title="Décision introuvable"
          right={
            <Link href="/decisions" className="btn btn-ghost-dark">
              ← Retour
            </Link>
          }
        />
        <p style={{ color: 'rgba(236,236,236,0.55)' }}>
          Cette décision a peut-être été annulée.
        </p>
      </>
    )
  }

  const statusColor = STATUS_COLOR[decision.status]

  return (
    <>
      <PageHeader
        eyebrow={team.currentTeam?.name ?? 'Équipe'}
        title={decision.title}
        right={
          <>
            <Link href="/decisions" className="btn btn-ghost-dark">
              ← Décisions
            </Link>
            <span
              className="tag"
              style={{ background: statusColor.bg, color: statusColor.color }}
            >
              {STATUS_LABEL[decision.status]}
            </span>
          </>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
        }}
      >
        {/* MAIN colonne — description + vote */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-card)',
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: 'rgba(236,236,236,0.6)',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 18 }}>{KIND_EMOJI[decision.kind]}</span>
              <span>{KIND_LABEL[decision.kind]}</span>
              {cents && <span>· {cents}</span>}
              <span>
                · Créée le{' '}
                {new Date(decision.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {decision.description ? (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {decision.description}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(236,236,236,0.4)',
                  fontStyle: 'italic',
                }}
              >
                Pas de description.
              </p>
            )}
          </div>

          {/* Vote */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-card)',
              padding: 20,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 14,
              }}
            >
              Mon vote
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['for', 'against', 'abstain'] as VoteValue[]).map((v) => {
                const variant = v === 'for' ? 'yes' : v === 'against' ? 'no' : ''
                const label =
                  v === 'for' ? 'Pour' : v === 'against' ? 'Contre' : 'Abstention'
                const isSelected = voted === v
                return (
                  <button
                    key={v}
                    type="button"
                    className={`vote-btn ${variant}`}
                    onClick={() => void handleVote(v)}
                    disabled={voting || decision.status !== 'pending'}
                    style={{
                      flex: 1,
                      ...(isSelected
                        ? {
                            background: 'var(--ink)',
                            color: '#fff',
                            borderColor: 'var(--ink)',
                          }
                        : voted !== null
                          ? { opacity: 0.4 }
                          : {}),
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {decision.status !== 'pending' && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: 'rgba(236,236,236,0.5)',
                }}
              >
                Cette décision est {STATUS_LABEL[decision.status].toLowerCase()}
                . Les votes sont clôturés.
              </p>
            )}
            {error && (
              <p
                role="alert"
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: '#FCA5A5',
                }}
              >
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Side colonne — tally */}
        <aside
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
            padding: 20,
            alignSelf: 'flex-start',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            Tally live
            <button
              type="button"
              className="w-link"
              onClick={() => void refreshStatus()}
              disabled={computing}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {computing ? '…' : '↻'}
            </button>
          </h3>

          {!computed && computing && (
            <p style={{ fontSize: 13, color: 'rgba(236,236,236,0.55)' }}>
              Calcul…
            </p>
          )}

          {computed && (
            <>
              <div
                style={{
                  marginBottom: 14,
                  fontSize: 12,
                  color: 'rgba(236,236,236,0.55)',
                  lineHeight: 1.5,
                }}
              >
                Status calculé :{' '}
                <strong
                  style={{
                    color:
                      computed.status === 'approved'
                        ? '#22C55E'
                        : computed.status === 'rejected'
                          ? '#EF4444'
                          : computed.status === 'expired'
                            ? 'rgba(236,236,236,0.6)'
                            : '#F59E0B',
                  }}
                >
                  {STATUS_LABEL[computed.status]}
                </strong>
              </div>

              <TallyBar
                label="Pour"
                count={computed.tally.for}
                total={computed.tally.totalEligible}
                color="#22C55E"
              />
              <TallyBar
                label="Contre"
                count={computed.tally.against}
                total={computed.tally.totalEligible}
                color="#EF4444"
              />
              <TallyBar
                label="Abstention"
                count={computed.tally.abstain}
                total={computed.tally.totalEligible}
                color="rgba(236,236,236,0.4)"
              />

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'rgba(236,236,236,0.55)',
                }}
              >
                Seuil requis : <strong>{computed.tally.requiredFor}</strong> sur{' '}
                {computed.tally.totalEligible} éligible
                {computed.tally.totalEligible > 1 ? 's' : ''}.
              </div>

              {computed.reason && (
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: 'rgba(236,236,236,0.55)',
                    fontStyle: 'italic',
                  }}
                >
                  {computed.reason}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  )
}

function TallyBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'rgba(236,236,236,0.7)',
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
          {count}
          <span style={{ opacity: 0.5, fontWeight: 500 }}>/{total}</span>
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
