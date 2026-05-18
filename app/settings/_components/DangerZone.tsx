'use client'

/**
 * DangerZone — suppression du compte avec confirmation par texte tapé.
 * Soft-delete côté Bloom (memberships → inactive, settings supprimées,
 * sign-out). La row auth.users reste et sera purgée par admin (TODO infra).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Section,
  Field,
  Input,
  GhostButton,
  FieldError,
} from './Section'
import { deleteCurrentAccountAction } from '@/lib/actions/users'
import { useCurrentUser } from '@/hooks'

export function DangerZone() {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Section
      id="danger"
      eyebrow="Irréversible"
      title="Zone de danger"
      description="Supprime définitivement ton compte et toutes tes données associées."
    >
      <div
        style={{
          padding: 16,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 14,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#FCA5A5',
            marginBottom: 6,
          }}
        >
          Supprimer mon compte
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--bloom-text-muted)',
            lineHeight: 1.55,
            marginBottom: 14,
          }}
        >
          Tes projets, tâches, votes, memberships et préférences seront
          immédiatement supprimés. Cette action est irréversible.
        </p>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          style={{
            background: '#EF4444',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Supprimer mon compte…
        </button>
      </div>

      {dialogOpen && (
        <DeleteAccountDialog
          email={user?.email ?? ''}
          onClose={() => setDialogOpen(false)}
          onDeleted={() => {
            router.push('/')
            router.refresh()
          }}
        />
      )}
    </Section>
  )
}

function DeleteAccountDialog({
  email,
  onClose,
  onDeleted,
}: {
  email: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Plus strict que "RETIRER" : on tape son propre email
  const expected = email.trim()
  const isMatch = confirm.trim().toLowerCase() === expected.toLowerCase() && expected !== ''

  const submit = async () => {
    if (!isMatch) return
    setBusy(true)
    setError(null)
    const r = await deleteCurrentAccountAction()
    setBusy(false)
    if (r.ok) onDeleted()
    else setError(r.error.message)
  }

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--bloom-surface)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 18,
          padding: 24,
          maxWidth: 480,
          width: '100%',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: '#FCA5A5',
            marginBottom: 8,
          }}
        >
          Suppression définitive
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--bloom-text-muted)',
            marginBottom: 16,
            lineHeight: 1.55,
          }}
        >
          Toutes tes données vont être purgées. Tu ne pourras plus te
          connecter avec <strong style={{ color: 'var(--bloom-text)' }}>{email}</strong>.
        </p>
        <Field
          label={`Tape ton email pour confirmer :`}
          htmlFor="confirm-delete"
        >
          <Input
            id="confirm-delete"
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={email}
            autoFocus
            disabled={busy}
            autoComplete="off"
          />
        </Field>
        <FieldError error={error} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={submit}
            disabled={!isMatch || busy}
            style={{
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: !isMatch || busy ? 'not-allowed' : 'pointer',
              opacity: !isMatch || busy ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {busy ? '…' : 'Supprimer mon compte définitivement'}
          </button>
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            Annuler
          </GhostButton>
        </div>
      </div>
    </div>
  )
}
