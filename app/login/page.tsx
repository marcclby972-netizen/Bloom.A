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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(
    null
  )
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

  const signInWith = async (provider: 'google' | 'apple') => {
    setError(null)
    setOauthLoading(provider)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
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
              onClick={() => signInWith('apple')}
              disabled={oauthLoading !== null || loading}
            >
              <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <path d="M14.6 13.7c-.3.6-.6 1.2-1.1 1.8-.6.8-1.2 1.4-1.7 1.6-.6.3-1.3.3-2 0-.5-.2-1-.3-1.5-.3s-1 .1-1.5.3c-.7.3-1.3.3-2 0-.5-.3-1.1-.8-1.7-1.6-.6-.8-1.1-1.8-1.5-2.9C1 11.4.8 10.2.8 9c0-1.4.3-2.6.9-3.5.5-.8 1.1-1.4 1.9-1.8.8-.4 1.6-.7 2.5-.7.5 0 1.1.1 1.7.3.6.2 1 .3 1.2.3.1 0 .5-.1 1.3-.3.7-.2 1.4-.3 1.9-.3 1.5.1 2.6.7 3.4 1.7-1.3.8-2 2-2 3.6 0 1.2.4 2.2 1.3 3 .4.4.8.7 1.3.9-.1.3-.2.6-.3.9zm-3.4-12c0 1-.4 1.9-1.1 2.7-.9 1-2 1.5-3.2 1.4 0-1 .4-1.9 1.1-2.7C8.7 2.5 9.5 2 10.4 1.8c.4-.1.6-.1.8-.1z" />
              </svg>
              {oauthLoading === 'apple'
                ? 'Redirection…'
                : 'Continuer avec Apple'}
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
