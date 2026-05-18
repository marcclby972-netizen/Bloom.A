'use client'

/**
 * Settings v3 — minimaliste.
 * Profile : name, langue, timezone.
 * Plus tard : équipe / facturation / notifications (séparés).
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks'
import { createClient } from '@/lib/supabase/client'

const TIMEZONES = [
  'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
  'Asia/Tokyo', 'UTC',
]

export default function SettingsPage() {
  const router = useRouter()
  const { data: user, loading, updateProfile, refetch } = useCurrentUser()

  const [name, setName] = useState('')
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hydrate from current user
  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setLanguage(user.settings.language ?? 'fr')
    setTimezone(user.settings.timezone ?? 'Europe/Paris')
  }, [user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await updateProfile({
        name: name.trim(),
        settings: { language, timezone },
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde échouée')
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) return <main style={{ padding: 24 }}>…</main>
  if (!user) return <main style={{ padding: 24 }}>Non authentifié.</main>

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>Paramètres</h1>
      <p>Email : <code>{user.email}</code> · Rôle : <code>{user.role}</code></p>

      <form onSubmit={submit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Nom
          <br />
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Langue
          <br />
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          Fuseau horaire
          <br />
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        {savedAt && <p>Sauvegardé.</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>

      <hr style={{ margin: '32px 0' }} />

      <button onClick={() => void refetch()}>Rafraîchir profil</button>
      {' '}
      <button onClick={() => void signOut()} style={{ color: 'crimson' }}>
        Se déconnecter
      </button>
    </main>
  )
}
