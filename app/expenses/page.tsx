'use client'

/**
 * Expenses — page minimale fonctionnelle (mode équipe uniquement).
 *
 * Solo → empty state.
 *
 * Liste les dépenses avec status colorés. Le formulaire crée une dépense ;
 * si le montant dépasse une règle `spending_threshold`, le serveur crée
 * automatiquement une décision liée et marque le status à 'pending' avec
 * un message d'info à l'utilisateur.
 *
 * UI volontairement simple — l'objectif est de tester la logique métier
 * (auto-vote trigger, listing, cancel, delete).
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useExpenses } from '@/hooks'
import { createExpenseAction } from '@/lib/actions/expenses'
import { PaywallEmpty } from '../dashboard/_components/PaywallEmpty'
import type { Expense, ExpenseStatus } from '@/lib/v3-types'

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
}

const STATUS_COLOR: Record<ExpenseStatus, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.18)', color: '#B45309' },
  approved: { bg: 'rgba(34,197,94,0.18)', color: '#15803D' },
  rejected: { bg: 'rgba(239,68,68,0.18)', color: '#B91C1C' },
  cancelled: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(236,236,236,0.6)' },
}

export default function ExpensesPage() {
  return (
    <DashboardShell screenLabel="Expenses">
      <ExpensesContent />
    </DashboardShell>
  )
}

function ExpensesContent() {
  const { teamId, currentTeam, isSolo } = useDashboardShell()
  const { data, loading, refetch, cancel, remove } = useExpenses(teamId)
  const [creating, setCreating] = useState(false)

  const monthTotal = useMemo(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    return data
      .filter(
        (e) =>
          e.status === 'approved' &&
          new Date(e.spentAt) >= monthStart
      )
      .reduce((sum, e) => sum + e.amountCents, 0)
  }, [data])

  if (isSolo) {
    return (
      <>
        <PageHeader eyebrow="Mode solo" title="Dépenses" />
        <PaywallEmpty
          feature="Finances"
          title="Dépenses + auto-vote"
          description="Déclare une dépense ; si elle dépasse le seuil de tes règles, Bloom lance automatiquement un vote entre associés. Inclus dans le plan Team."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={currentTeam?.name ?? 'Équipe'}
        title="Dépenses"
        right={
          <>
            <span
              className="tag"
              style={{ background: 'var(--bloom-surface-2)', color: 'var(--bloom-text)' }}
            >
              Mois : {(monthTotal / 100).toLocaleString('fr-FR')} €
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCreating((c) => !c)}
            >
              + Nouvelle dépense
            </button>
          </>
        }
      />

      {creating && (
        <ExpenseForm
          teamId={teamId!}
          onCancel={() => setCreating(false)}
          onSuccess={async () => {
            setCreating(false)
            await refetch()
          }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && data.length === 0 && (
          <p style={{ color: 'var(--bloom-text-muted)', fontSize: 13 }}>
            Chargement…
          </p>
        )}
        {!loading && data.length === 0 && !creating && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              background: 'var(--bloom-surface)',
              border: '1px solid var(--bloom-border)',
              borderRadius: 18,
              color: 'var(--bloom-text-muted)',
            }}
          >
            Aucune dépense pour le moment.
          </div>
        )}
        {data.map((e) => (
          <ExpenseRow key={e.id} expense={e} onCancel={cancel} onRemove={remove} />
        ))}
      </div>
    </>
  )
}

function ExpenseForm({
  teamId,
  onCancel,
  onSuccess,
}: {
  teamId: string
  onCancel: () => void
  onSuccess: () => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [spentAt, setSpentAt] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Montant invalide')
      return
    }
    setBusy(true)
    const r = await createExpenseAction({
      teamId,
      amountCents: cents,
      description: description.trim(),
      category: category.trim() || null,
      spentAt,
    })
    setBusy(false)
    if (r.ok) {
      if (r.data.triggeredVote) {
        setInfo(
          'Montant au-dessus d’un seuil → une décision a été créée. Allez voter dans Décisions.'
        )
        // On reset le form mais on laisse le message visible
        setAmount('')
        setDescription('')
        setCategory('')
        setTimeout(() => void onSuccess(), 2200)
      } else {
        await onSuccess()
      }
    } else {
      setError(r.error.message)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          placeholder="Montant €"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Catégorie (ex : SaaS)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={80}
          style={inputStyle}
        />
        <input
          type="date"
          value={spentAt}
          onChange={(e) => setSpentAt(e.target.value)}
          required
          style={inputStyle}
        />
      </div>
      <input
        type="text"
        placeholder="Description — ex : Notion équipe (abonnement annuel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={500}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !amount || !description.trim()}
        >
          {busy ? 'Création…' : 'Enregistrer la dépense'}
        </button>
        <button
          type="button"
          className="btn btn-ghost-dark"
          onClick={onCancel}
          disabled={busy}
        >
          Annuler
        </button>
        {info && (
          <span style={{ fontSize: 12.5, color: '#86EFAC' }}>
            ✓ {info}
          </span>
        )}
        {error && (
          <span style={{ fontSize: 12.5, color: '#FCA5A5' }}>
            {error}
          </span>
        )}
      </div>
    </form>
  )
}

function ExpenseRow({
  expense,
  onCancel,
  onRemove,
}: {
  expense: Expense
  onCancel: (id: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const c = STATUS_COLOR[expense.status]
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 12,
          color: 'var(--bloom-text-muted)',
          minWidth: 80,
        }}
      >
        {expense.spentAt}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bloom-text)' }}>
          {expense.description}
        </div>
        {expense.category && (
          <div style={{ fontSize: 12, color: 'var(--bloom-text-muted)' }}>
            {expense.category}
          </div>
        )}
      </div>
      <span
        style={{
          fontWeight: 700,
          color: 'var(--bloom-text)',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 90,
          textAlign: 'right',
        }}
      >
        {(expense.amountCents / 100).toLocaleString('fr-FR')} €
      </span>
      <span
        className="tag"
        style={{ background: c.bg, color: c.color, minWidth: 90, textAlign: 'center' }}
      >
        {STATUS_LABEL[expense.status]}
      </span>
      {expense.decisionId && (
        <Link
          href={`/decisions/${expense.decisionId}`}
          className="w-meta"
          style={{ fontSize: 12 }}
        >
          Voir vote →
        </Link>
      )}
      {expense.status === 'pending' && (
        <button
          type="button"
          onClick={() => void onCancel(expense.id).catch(() => {})}
          style={ghostBtnStyle}
        >
          Annuler
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (confirm('Supprimer cette dépense ?'))
            void onRemove(expense.id).catch(() => {})
        }}
        style={{ ...ghostBtnStyle, color: '#FCA5A5' }}
        title="Supprimer"
      >
        ×
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bloom-surface-2)',
  border: '1px solid var(--bloom-border)',
  borderRadius: 12,
  color: 'var(--bloom-text)',
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
}

const ghostBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--bloom-border)',
  borderRadius: 8,
  color: 'var(--bloom-text-muted)',
  padding: '4px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
