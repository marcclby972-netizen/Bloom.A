'use client'

/**
 * Login page — UI identique à l'onboarding (card sombre + brand top bar).
 *
 * Réutilise `app/onboard.css` (mêmes tokens, mêmes classes : .shell, .top,
 * .brand, .right, .card, .step.active, .eyebrow, .step-title, .accent,
 * .subtitle, .signup-grid, .oauth-btn, .divider, .field, .input,
 * .btn.btn-primary.btn-lg, .terms).
 *
 * Connexion email/password via Supabase. OAuth Google/Apple via
 * `signInWithOAuth` (provider doit être configuré côté Supabase).
 *
 * Route inclue dans PUBLIC_ROUTES (AppShell) → rendu sans sidebar.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import '../onboard.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<
    'google' | 'linkedin' | null
  >(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion échouée')
    } finally {
      setLoading(false)
    }
  }

  const signInWith = async (provider: 'google' | 'linkedin') => {
    setError(null)
    setOauthLoading(provider)
    try {
      const supabase = createClient()
      // Supabase utilise `linkedin_oidc` comme provider key pour LinkedIn
      // Sign in with OpenID Connect (déprécié `linkedin` legacy).
      const sbProvider: 'google' | 'linkedin_oidc' =
        provider === 'linkedin' ? 'linkedin_oidc' : 'google'
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: sbProvider,
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      })
      if (authError) throw authError
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} échoué`)
      setOauthLoading(null)
    }
  }

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/reset`
              : undefined,
        }
      )
      if (resetError) throw resetError
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shell" data-screen-label="Login">
      {/* ── Top bar ── */}
      <div className="top">
        <Link href="/" className="brand">
          <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <defs>
              <linearGradient
                id="bg-login"
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
              fill="url(#bg-login)"
            />
            <path
              d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z"
              fill="url(#bg-login)"
            />
            <path
              d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z"
              fill="url(#bg-login)"
            />
            <path
              d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z"
              fill="url(#bg-login)"
            />
            <circle cx="14" cy="14" r="2.4" fill="#ECECEC" />
          </svg>
          Bloom
        </Link>
        <div className="right">
          Pas encore de compte ? <Link href="/onboard">S&apos;inscrire</Link>
        </div>
      </div>

      {/* ── Stage ── */}
      <div className="stage">
        <div className="card step active">
          <div className="eyebrow">Connexion</div>
          <h1 className="step-title">
            Bon retour sur <span className="accent">Bloom.</span>
          </h1>
          <p className="subtitle">
            Connectez-vous à votre espace pour reprendre vos projets, votre
            chrono et vos décisions.
          </p>

          <form onSubmit={submit} className="signup-grid">
            <button
              type="button"
              className="oauth-btn"
              onClick={() => signInWith('google')}
              disabled={oauthLoading !== null || loading}
            >
              <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M17.6 9.2c0-.6-.05-1.2-.14-1.7H9v3.2h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.7c1.6-1.4 2.5-3.6 2.5-6.3z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.3 0 4.2-.8 5.6-2.1l-2.7-2.1c-.7.5-1.7.9-2.9.9-2.2 0-4.1-1.5-4.8-3.5H1.4v2.2C2.8 16.2 5.7 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M4.2 11.2C4 10.7 3.9 10.1 3.9 9.5s.1-1.2.3-1.7V5.6H1.4C.8 6.8.4 8.1.4 9.5s.4 2.7 1 3.9l2.8-2.2z"
                  fill="#FBBC04"
                />
                <path
                  d="M9 3.6c1.3 0 2.4.4 3.3 1.3l2.4-2.4C13.2.9 11.3 0 9 0 5.7 0 2.8 1.8 1.4 4.6l2.8 2.2C5 4.6 6.8 3.6 9 3.6z"
                  fill="#EA4335"
                />
              </svg>
              {oauthLoading === 'google'
                ? 'Redirection…'
                : 'Continuer avec Google'}
            </button>
            <button
              type="button"
              className="oauth-btn"
              onClick={() => signInWith('linkedin')}
              disabled={oauthLoading !== null || loading}
            >
              <svg viewBox="0 0 18 18" fill="#0A66C2" aria-hidden="true">
                <path d="M3.5 1.5C2.4 1.5 1.5 2.4 1.5 3.5S2.4 5.5 3.5 5.5 5.5 4.6 5.5 3.5 4.6 1.5 3.5 1.5zM2 7v9.5h3V7H2zM7 7v9.5h3v-5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v5h3v-5.5c0-2.2-1.8-4-4-4-1 0-1.9.4-2.5 1V7H7z" />
              </svg>
              {oauthLoading === 'linkedin'
                ? 'Redirection…'
                : 'Continuer avec LinkedIn'}
            </button>

            <div className="divider">ou avec un email</div>

            <div className="field" style={{ margin: 0 }}>
              <input
                type="email"
                className="input"
                id="login-email"
                placeholder="vous@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <input
                type="password"
                className="input"
                id="login-pw"
                placeholder="Mot de passe"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 18 }}
              disabled={loading || oauthLoading !== null}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
              {!loading && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </form>

          {/* Mot de passe oublié — toggle reset mode */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            {!resetMode ? (
              <button
                type="button"
                onClick={() => {
                  setResetMode(true)
                  setResetSent(false)
                  setError(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(236,236,236,0.55)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Mot de passe oublié ?
              </button>
            ) : resetSent ? (
              <p style={{ fontSize: 13, color: '#86EFAC' }}>
                ✓ Email de réinitialisation envoyé à <strong>{email}</strong>.
                Vérifie ta boîte mail.
              </p>
            ) : (
              <form
                onSubmit={submitReset}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(236,236,236,0.55)',
                  }}
                >
                  Entre ton email ci-dessus et clique pour recevoir un lien
                  de réinitialisation.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !email.includes('@')}
                  >
                    {loading ? '…' : 'Envoyer le lien'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost-dark"
                    onClick={() => setResetMode(false)}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

          {error && (
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

          <p className="terms">
            En vous connectant, vous acceptez les <a href="/terms">CGU</a> et la{' '}
            <a href="/privacy">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
