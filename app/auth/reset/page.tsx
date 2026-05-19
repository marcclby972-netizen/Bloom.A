'use client'

/**
 * /auth/reset — page de finalisation du reset password.
 *
 * Supabase envoie un magic link qui pose une session "recovery" sur cette
 * route. L'utilisateur entre son nouveau mot de passe → on appelle
 * `supabase.auth.updateUser({ password })` puis redirect vers /dashboard.
 *
 * Si pas de session active (link expiré ou invalide) → message + lien
 * retour vers /login.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import '../../onboard.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(data.session !== null)
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pw1.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pw1 !== pw2) {
      setError('La confirmation ne correspond pas.')
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({
      password: pw1,
    })
    setBusy(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setSuccess(true)
    window.setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1200)
  }

  return (
    <div className="shell" data-screen-label="Reset password">
      <div className="top">
        <Link href="/" className="brand">
          <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <defs>
              <linearGradient
                id="bg-reset"
                x1="0"
                y1="0"
                x2="28"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#E37520" />
                <stop offset="1" stopColor="#FBBE4D" />
              </linearGradient>
            </defs>
            <path
              d="M14 2C16.5 5 16.5 8 14 11C11.5 8 11.5 5 14 2Z"
              fill="url(#bg-reset)"
            />
            <path
              d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z"
              fill="url(#bg-reset)"
            />
            <path
              d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z"
              fill="url(#bg-reset)"
            />
            <path
              d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z"
              fill="url(#bg-reset)"
            />
            <circle cx="14" cy="14" r="2.4" fill="#ECECEC" />
          </svg>
          Bloom
        </Link>
      </div>

      <div className="stage">
        <div className="card step active">
          <div className="eyebrow">Réinitialisation</div>
          <h1 className="step-title">
            Choisis un nouveau <span className="accent">mot de passe.</span>
          </h1>
          <p className="subtitle">
            8 caractères minimum. Sera utilisé pour ta prochaine connexion.
          </p>

          {hasSession === null && (
            <p
              style={{
                fontSize: 13,
                color: 'rgba(236,236,236,0.6)',
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              Vérification du lien…
            </p>
          )}

          {hasSession === false && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 13,
                  color: '#FCA5A5',
                  marginBottom: 16,
                }}
              >
                Le lien de réinitialisation est invalide ou expiré.
              </p>
              <Link href="/login" className="btn btn-primary">
                Retour à la connexion
              </Link>
            </div>
          )}

          {hasSession === true && !success && (
            <form onSubmit={submit} className="signup-grid">
              <div className="field" style={{ margin: 0 }}>
                <input
                  autoFocus
                  type="password"
                  className="input"
                  placeholder="Nouveau mot de passe"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirmer"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 6 }}
                disabled={busy || pw1.length < 8 || pw1 !== pw2}
              >
                {busy ? 'Mise à jour…' : 'Confirmer le nouveau mot de passe'}
              </button>
            </form>
          )}

          {success && (
            <p
              style={{
                fontSize: 14,
                color: '#86EFAC',
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              ✓ Mot de passe mis à jour. Redirection vers le dashboard…
            </p>
          )}

          {error && hasSession === true && (
            <p
              role="alert"
              style={{
                marginTop: 14,
                fontSize: 13,
                color: '#FCA5A5',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
