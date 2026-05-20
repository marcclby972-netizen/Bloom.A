'use client'

/**
 * Gouvernance — vue consolidée team-only des règles + décisions.
 *
 * 2 sections empilées :
 *  1. Règles de gouvernance actives (depuis getGovernanceRulesAction)
 *  2. Décisions récentes (depuis useDecisions, top 5)
 *
 * CTA pour aller créer une nouvelle décision → /decisions
 *
 * Pas de logique métier nouvelle ici — c'est une page de lecture qui
 * agrège ce qui existe déjà. La création de règle se fait dans /settings
 * (TODO v3.1) ou en SQL en attendant.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useDecisions } from '@/hooks'
import { getGovernanceRulesAction } from '@/lib/actions/governance'
import type {
  GovernanceRule,
  GovernanceRuleType,
  ValidationMode,
  DecisionStatus,
} from '@/lib/v3-types'

const TYPE_LABEL: Record<GovernanceRuleType, string> = {
  spending_threshold: 'Dépense au-dessus du seuil',
  hiring: 'Recrutement',
  equity_change: 'Dilution / parts',
  distribution: 'Distribution / dividendes',
  other: 'Autre',
}

const MODE_LABEL: Record<ValidationMode, string> = {
  single_owner: 'Décision fondateur',
  majority_vote: 'Vote majoritaire',
  unanimous: 'Unanimité requise',
}

const MODE_COLOR: Record<ValidationMode, { bg: string; fg: string }> = {
  single_owner: { bg: 'rgba(155,155,159,0.18)', fg: '#9B9B9F' },
  majority_vote: { bg: 'rgba(59,130,246,0.18)', fg: '#3B82F6' },
  unanimous: { bg: 'rgba(168,85,247,0.18)', fg: '#A855F7' },
}

const STATUS_COLOR: Record<DecisionStatus, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(255,138,26,0.18)', fg: '#FF8A1A' },
  approved: { bg: 'rgba(34,197,94,0.18)', fg: '#22C55E' },
  rejected: { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444' },
  cancelled: { bg: 'rgba(155,155,159,0.18)', fg: '#9B9B9F' },
  expired: { bg: 'rgba(155,155,159,0.18)', fg: '#9B9B9F' },
}

const STATUS_LABEL: Record<DecisionStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
  expired: 'Expirée',
}

function formatThreshold(cents: number | null): string {
  if (cents == null) return '—'
  const euros = cents / 100
  if (euros >= 1000) return `> ${(euros / 1000).toFixed(0)} k€`
  return `> ${euros.toFixed(0)} €`
}

export default function GouvernancePage() {
  return (
    <DashboardShell screenLabel="Gouvernance">
      <GouvernanceContent />
    </DashboardShell>
  )
}

function GouvernanceContent() {
  const { teamId, currentTeam, isSolo } = useDashboardShell()
  const decisions = useDecisions(teamId)

  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!teamId) {
      setRules([])
      setRulesLoading(false)
      return
    }
    setRulesLoading(true)
    void getGovernanceRulesAction(teamId).then((r) => {
      if (cancelled) return
      if (r.ok) setRules(r.data.filter((g) => g.active))
      setRulesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [teamId])

  const recentDecisions = useMemo(
    () => decisions.data.slice(0, 6),
    [decisions.data]
  )

  if (isSolo || !teamId) {
    return (
      <>
        <PageHeader eyebrow="Mode solo" title="Gouvernance" />
        <div
          style={{
            background: 'var(--bloom-surface)',
            border: '1px solid var(--bloom-border)',
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
            color: 'var(--bloom-text-muted)',
          }}
        >
          <p style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.55 }}>
            La gouvernance et les décisions sont des features d&apos;équipe.
            Crée une équipe pour définir tes règles et lancer des votes.
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
        title="Gouvernance"
        right={
          <>
            <Link href="/decisions" className="btn btn-ghost-dark">
              Toutes les décisions →
            </Link>
            <Link href="/decisions" className="btn btn-primary">
              + Nouvelle décision
            </Link>
          </>
        }
      />

      {/* ── Règles actives ── */}
      <section
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid var(--bloom-border)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <header style={{ marginBottom: 14 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--bloom-text)',
              marginBottom: 4,
            }}
          >
            Règles de gouvernance actives
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--bloom-text-muted)' }}>
            Conditions qui déclenchent un vote ou requièrent l&apos;unanimité.
          </p>
        </header>
        {rulesLoading && rules.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--bloom-text-muted)' }}>
            Chargement…
          </p>
        )}
        {!rulesLoading && rules.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--bloom-text-faint)' }}>
            Aucune règle active — la team valide chaque décision au cas par cas.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map((r) => {
            const mc = MODE_COLOR[r.validationMode]
            const title =
              r.type === 'spending_threshold'
                ? `Dépenses ${formatThreshold(r.thresholdAmountCents)}`
                : TYPE_LABEL[r.type]
            return (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  background: 'var(--bloom-surface-2)',
                  border: '1px solid var(--bloom-border)',
                  borderRadius: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--bloom-text)',
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{ fontSize: 12, color: 'var(--bloom-text-muted)' }}
                  >
                    {MODE_LABEL[r.validationMode]}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: mc.bg,
                    color: mc.fg,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {MODE_LABEL[r.validationMode]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Décisions récentes ── */}
      <section
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid var(--bloom-border)',
          borderRadius: 14,
          padding: 20,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--bloom-text)',
                marginBottom: 4,
              }}
            >
              Décisions récentes
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--bloom-text-muted)' }}>
              Top {recentDecisions.length} — toutes les décisions →{' '}
              <Link
                href="/decisions"
                style={{ color: 'var(--bloom-accent)', fontWeight: 600 }}
              >
                /decisions
              </Link>
            </p>
          </div>
        </header>
        {decisions.loading && recentDecisions.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--bloom-text-muted)' }}>
            Chargement…
          </p>
        )}
        {!decisions.loading && recentDecisions.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--bloom-text-faint)' }}>
            Aucune décision encore. Lance ton premier vote.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentDecisions.map((d) => {
            const sc = STATUS_COLOR[d.status]
            return (
              <Link
                key={d.id}
                href={`/decisions/${d.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  background: 'var(--bloom-surface-2)',
                  border: '1px solid var(--bloom-border)',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 130ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bloom-border-strong)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bloom-border)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--bloom-text)',
                    }}
                  >
                    {d.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--bloom-text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {new Date(d.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {d.amountCents != null
                      ? ` · ${(d.amountCents / 100).toLocaleString('fr-FR')} €`
                      : ''}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: sc.bg,
                    color: sc.fg,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </>
  )
}
