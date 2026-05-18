'use client'

/**
 * Decision detail — vote + computed status.
 */

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCurrentTeam, useDecisions } from '@/hooks'
import type { DecisionComputedStatus, VoteValue } from '@/lib/v3-types'

export default function DecisionDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const team = useCurrentTeam()
  const decisions = useDecisions(team.teamId)

  const decision = decisions.data.find((d) => d.id === id)

  const [computed, setComputed] = useState<DecisionComputedStatus | null>(null)
  const [computing, setComputing] = useState(false)
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

  const vote = async (value: VoteValue) => {
    try {
      await decisions.vote(id, value)
      void refreshStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote échoué')
    }
  }

  if (decisions.loading) return <main style={{ padding: 24 }}>…</main>
  if (!decision) {
    return (
      <main style={{ padding: 24 }}>
        <p>Décision introuvable.</p>
        <Link href="/decisions">← Retour</Link>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <p><Link href="/decisions">← Décisions</Link></p>
      <h1>{decision.title}</h1>
      <p>
        Kind: <strong>{decision.kind}</strong>
        {decision.amountCents != null && ` · Montant : ${(decision.amountCents / 100).toFixed(2)} €`}
      </p>
      <p>Statut stocké : <strong>{decision.status}</strong></p>

      {decision.description && (
        <section style={{ marginTop: 16 }}>
          <h2>Description</h2>
          <p>{decision.description}</p>
        </section>
      )}

      {/* Computed status */}
      <section style={{ marginTop: 24 }}>
        <h2>Statut calculé (live)</h2>
        {computing && <p>…</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        {computed && (
          <div>
            <p>Status : <strong>{computed.status}</strong></p>
            <p>
              Tally : pour {computed.tally.for} ·
              contre {computed.tally.against} ·
              abstention {computed.tally.abstain}
              {' '}({computed.tally.requiredFor}/{computed.tally.totalEligible} requis)
            </p>
            <p style={{ fontStyle: 'italic' }}>{computed.reason}</p>
            <button onClick={() => void refreshStatus()} disabled={computing}>
              Recalculer
            </button>
          </div>
        )}
      </section>

      {/* Vote buttons */}
      <section style={{ marginTop: 24 }}>
        <h2>Mon vote</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void vote('for')}>Pour</button>
          <button onClick={() => void vote('against')}>Contre</button>
          <button onClick={() => void vote('abstain')}>Abstention</button>
        </div>
      </section>
    </main>
  )
}
