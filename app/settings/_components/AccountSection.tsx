'use client'

/**
 * AccountSection — change email (déclenche un mail Supabase) et change
 * password (vérifie le mot de passe actuel avant update).
 */

import { useState } from 'react'
import {
  Section,
  Field,
  Input,
  PrimaryButton,
  FieldError,
  FieldSuccess,
} from './Section'
import {
  updateUserEmailAction,
  updateUserPasswordAction,
} from '@/lib/actions/users'
import { useCurrentUser } from '@/hooks'

export function AccountSection() {
  const { data: user, refetch } = useCurrentUser()

  // ─── Email change ───
  const [newEmail, setNewEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(null)
    setEmailBusy(true)
    const r = await updateUserEmailAction(newEmail)
    if (r.ok) {
      setEmailSuccess(
        'Lien de confirmation envoyé. Vérifie ta boîte mail (ancienne et nouvelle adresse) pour finaliser.'
      )
      setNewEmail('')
      await refetch()
    } else {
      setEmailError(r.error.message)
    }
    setEmailBusy(false)
  }

  // ─── Password change ───
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    if (newPw.length < 8) {
      setPwError('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('La confirmation ne correspond pas.')
      return
    }
    setPwBusy(true)
    const r = await updateUserPasswordAction({
      currentPassword: currentPw,
      newPassword: newPw,
    })
    if (r.ok) {
      setPwSuccess('Mot de passe modifié.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      window.setTimeout(() => setPwSuccess(null), 3000)
    } else {
      setPwError(r.error.message)
    }
    setPwBusy(false)
  }

  return (
    <Section
      id="account"
      eyebrow="Sécurité"
      title="Compte"
      description="Email de connexion et mot de passe."
    >
      {/* ── Email ── */}
      <form onSubmit={submitEmail} style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Email
        </h3>
        <Field
          label="Nouvelle adresse email"
          htmlFor="acc-email"
          hint={`Email actuel : ${user?.email ?? '…'}`}
        >
          <Input
            id="acc-email"
            type="email"
            placeholder="nouvel-email@exemple.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            disabled={emailBusy}
          />
        </Field>
        <PrimaryButton
          type="submit"
          disabled={emailBusy || !newEmail.includes('@')}
        >
          {emailBusy ? 'Envoi…' : 'Changer l’email'}
        </PrimaryButton>
        <FieldError error={emailError} />
        <FieldSuccess success={emailSuccess} />
      </form>

      <hr
        style={{
          border: 0,
          borderTop: '1px solid var(--bloom-border)',
          margin: '24px 0',
        }}
      />

      {/* ── Password ── */}
      <form onSubmit={submitPassword}>
        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Mot de passe
        </h3>

        <Field label="Mot de passe actuel" htmlFor="acc-pw-cur">
          <Input
            id="acc-pw-cur"
            type="password"
            placeholder="••••••••"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
            disabled={pwBusy}
          />
        </Field>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <Field
            label="Nouveau mot de passe"
            htmlFor="acc-pw-new"
            hint="Min. 8 caractères"
          >
            <Input
              id="acc-pw-new"
              type="password"
              placeholder="••••••••"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              disabled={pwBusy}
            />
          </Field>
          <Field label="Confirmer" htmlFor="acc-pw-confirm">
            <Input
              id="acc-pw-confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              disabled={pwBusy}
            />
          </Field>
        </div>

        <PrimaryButton
          type="submit"
          disabled={
            pwBusy || !currentPw || newPw.length < 8 || newPw !== confirmPw
          }
        >
          {pwBusy ? 'Mise à jour…' : 'Changer le mot de passe'}
        </PrimaryButton>
        <FieldError error={pwError} />
        <FieldSuccess success={pwSuccess} />
      </form>
    </Section>
  )
}
