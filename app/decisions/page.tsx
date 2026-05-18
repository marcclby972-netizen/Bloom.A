'use client'

/**
 * Decisions list — minimal v3.
 * Solo → message "Crée une team d'abord".
 * Team → liste + form create.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useCurrentTeam, useDecisions } from '@/hooks'
import type { DecisionKind } from '@/lib/v3-types'

export default function DecisionsPage() {
  const team = useCurrentTeam()
  const decisions = useDecisions(team.teamId)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DecisionKind>('expense')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const cents = amount.trim()
        ? Math.round(parseFloat(amount.replace(',', '.')) * 100)
        : null
      await decisions.create({
        title: title.trim(),
        kind,
        amountCents: Number.isFinite(cents as number) ? cents : null,
      })
      setTitle('')
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setCreating(false)
    }
  }

  if (team.isSolo) {
    return (
      <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
        <h1>Décisions</h1>
        <p>
          Les décisions sont une feature d&apos;équipe.
          {' '}<Link href="/onboard">Crée une team</Link> pour les utiliser.
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Décisions {team.currentTeam ? `· ${team.currentTeam.name}` : ''}</h1>

      <form onSubmit={submit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          required
          maxLength={200}
          placeholder="titre de la décision"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as DecisionKind)}>
          <option value="expense">Dépense</option>
          <option value="rule_change">Changement de règle</option>
          <option value="distribution">Distribution</option>
          <option value="equity_change">Changement d&apos;équité</option>
          <option value="other">Autre</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="montant (€, optionnel pour les dépenses)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" disabled={creating || !title.trim()}>
          {creating ? 'Création…' : '+ Créer décision'}
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>

      <section style={{ marginTop: 24 }}>
        <h2>Liste ({decisions.data.length})</h2>
        {decisions.loading && <p>…</p>}
        {!decisions.loading && decisions.data.length === 0 && <p>Aucune décision.</p>}
        <ul>
          {decisions.data.map((d) => (
            <li key={d.id} style={{ marginBottom: 4 }}>
              <Link href={`/decisions/${d.id}`}>{d.title}</Link>
              {' '}— [{d.status}] · {d.kind}
              {d.amountCents != null && ` · ${(d.amountCents / 100).toFixed(2)} €`}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
