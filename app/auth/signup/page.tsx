'use client'

/**
 * Signup page (v3 — minimaliste).
 *
 * Form email + password → supabase.auth.signUp.
 * Redirect /onboard après succès (le user choisit solo/team).
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // If email confirmation is required, no session is returned
      if (!data.session) {
        setNeedsConfirm(true)
      } else {
        router.push('/onboard')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription échouée')
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirm) {
    return (
      <main style={{ padding: 24, maxWidth: 400, margin: '40px auto' }}>
        <h1>Vérifie ton email</h1>
        <p>Un lien de confirmation a été envoyé à <strong>{email}</strong>.</p>
        <p>Clique sur le lien pour activer ton compte, puis retourne te connecter.</p>
        <Link href="/login">→ Aller à la connexion</Link>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 400, margin: '40px auto' }}>
      <h1>Créer un compte</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          autoComplete="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="mot de passe (8 caractères min)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
      <p style={{ marginTop: 24 }}>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </main>
  )
}
