'use client'

/**
 * Contributions — vue d'équilibre temps + € + parts pour une équipe.
 *
 * Solo → empty state.
 *
 * Affiche le score d'équité (computeEquityScorePure) calculé côté server,
 * détaille chaque membre avec son temps tracké, ses dépenses approuvées,
 * ses parts déclarées, l'écart, et un badge d'alerte si pertinent.
 *
 * UI minimaliste — l'objectif est de tester la logique d'agrégation.
 */

import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useTeamContributions } from '@/hooks'
import { PaywallEmpty } from '../dashboard/_components/PaywallEmpty'
import type { MemberContribution } from '@/lib/v3-types'

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22C55E'
  if (score >= 75) return '#FBBF24'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

export default function ContributionsPage() {
  return (
    <DashboardShell screenLabel="Contributions">
      <ContributionsContent />
    </DashboardShell>
  )
}

function ContributionsContent() {
  const { teamId, currentTeam, isSolo } = useDashboardShell()
  const { data, loading } = useTeamContributions(teamId)

  if (isSolo) {
    return (
      <>
        <PageHeader eyebrow="Mode solo" title="Contributions" />
        <PaywallEmpty
          feature="Équité"
          title="Score d'équité automatique"
          description="Bloom compare ce que chaque associé apporte (temps + €) à ses parts déclarées. Score 0-100 et alertes si déséquilibre. Inclus dans le plan Team."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={currentTeam?.name ?? 'Équipe'}
        title="Contributions & équité"
      />

      {loading && !data && (
        <p style={{ color: 'var(--bloom-text-muted)', fontSize: 13 }}>
          Calcul en cours…
        </p>
      )}

      {data && data.members.length === 0 && (
        <p style={{ color: 'var(--bloom-text-muted)', fontSize: 13 }}>
          Aucun membre actif dans cette équipe.
        </p>
      )}

      {data && data.members.length > 0 && (
        <>
          {/* ─── Score d'équité hero ─── */}
          <div
            style={{
              background: 'var(--bloom-surface)',
              border: '1px solid var(--bloom-border)',
              borderRadius: 18,
              padding: 24,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                fontFamily: 'var(--font-display), system-ui',
                color: scoreColor(data.equityScore),
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {data.equityScore}
              <span style={{ fontSize: 28, opacity: 0.5 }}>/100</span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--bloom-text-faint)',
                  marginBottom: 6,
                }}
              >
                Score d&apos;équité (30 derniers jours)
              </div>
              <div style={{ fontSize: 14, color: 'var(--bloom-text)' }}>
                {data.equityScore >= 90
                  ? 'Contributions alignées avec les parts déclarées.'
                  : data.equityScore >= 75
                    ? 'Léger déséquilibre — à surveiller.'
                    : data.equityScore >= 50
                      ? 'Déséquilibre notable — discuter au prochain rituel.'
                      : 'Fort déséquilibre — révision des parts recommandée.'}
              </div>
              {data.equityAlerts.length > 0 && (
                <ul
                  style={{
                    marginTop: 10,
                    fontSize: 12.5,
                    color: 'var(--bloom-text-muted)',
                    paddingLeft: 16,
                    listStyle: 'disc',
                  }}
                >
                  {data.equityAlerts.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ─── Per-member table ─── */}
          <div
            style={{
              background: 'var(--bloom-surface)',
              border: '1px solid var(--bloom-border)',
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 100px 100px',
                padding: '10px 16px',
                background: 'var(--bloom-surface-2)',
                borderBottom: '1px solid var(--bloom-border)',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--bloom-text-faint)',
              }}
            >
              <div>Membre</div>
              <div style={{ textAlign: 'right' }}>Temps</div>
              <div style={{ textAlign: 'right' }}>Dépenses</div>
              <div style={{ textAlign: 'right' }}>Parts</div>
              <div style={{ textAlign: 'right' }}>Rôle</div>
            </div>
            {data.members.map((m) => (
              <MemberRow key={m.userId} member={m} />
            ))}
          </div>

          <p
            style={{
              marginTop: 14,
              fontSize: 11.5,
              color: 'var(--bloom-text-faint)',
              lineHeight: 1.55,
            }}
          >
            Le calcul utilise un taux horaire de référence de 50&nbsp;€/h
            pour convertir le temps en valeur monétaire, puis compare la
            part contributive de chaque membre à ses parts déclarées.
          </p>
        </>
      )}
    </>
  )
}

function MemberRow({ member }: { member: MemberContribution }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px 100px 100px 100px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--bloom-border)',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--bloom-text)',
          fontFamily: 'var(--font-mono), monospace',
        }}
      >
        {member.userId.slice(0, 8)}…
      </div>
      <div
        style={{
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--bloom-text)',
        }}
      >
        {formatHours(member.timeSeconds)}
      </div>
      <div
        style={{
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--bloom-text)',
        }}
      >
        {formatEuros(member.expensesCents)}
      </div>
      <div
        style={{
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--bloom-text)',
        }}
      >
        {member.sharesPct !== null ? `${member.sharesPct}%` : '—'}
      </div>
      <div
        style={{
          textAlign: 'right',
          fontSize: 11,
          color: 'var(--bloom-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {member.role}
      </div>
    </div>
  )
}
