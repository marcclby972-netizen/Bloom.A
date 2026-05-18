'use client'

/**
 * Onboard v3 — 2 steps minimum.
 *
 * Step 1: solo OR team
 *   Solo  → localStorage 'bloom_active_team_id' = '__solo__' → /dashboard
 *   Team  → step 2
 *
 * Step 2 (team only): nom team + emails à inviter
 *   → createTeam({ name }) puis inviteMemberAction × emails
 *   → /dashboard
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentTeam } from '@/hooks'
import { inviteMemberAction } from '@/lib/actions/teams'

type Step = 'mode' | 'team'

export default function OnboardPage() {
  const router = useRouter()
  const { createTeam } = useCurrentTeam()
  const [step, setStep] = useState<Step>('mode')
  const [teamName, setTeamName] = useState('')
  const [emails, setEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickSolo = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bloom_active_team_id', '__solo__')
    }
    router.push('/dashboard')
  }
  const pickTeam = () => setStep('team')

  const addEmailRow = () => setEmails((prev) => [...prev, ''])
  const updateEmail = (i: number, v: string) =>
    setEmails((prev) => prev.map((e, idx) => (idx === i ? v : e)))

  const submitTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const team = await createTeam({ name: teamName.trim() })
      const validEmails = emails.map((e) => e.trim()).filter((e) => e.includes('@'))
      for (const email of validEmails) {
        await inviteMemberAction({ teamId: team.id, email, role: 'associate' })
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: '40px auto' }}>
      <h1>Configuration</h1>

      {step === 'mode' && (
        <section>
          <p>Tu travailles seul ou avec des associés ?</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="button" onClick={pickSolo}>Seul (mode solo)</button>
            <button type="button" onClick={pickTeam}>Avec des associés</button>
          </div>
        </section>
      )}

      {step === 'team' && (
        <form onSubmit={submitTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="teamName">Nom de l&apos;équipe</label>
            <br />
            <input
              id="teamName"
              required
              minLength={1}
              maxLength={80}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="ex: BloomCo"
            />
          </div>

          <fieldset>
            <legend>Inviter des associés (optionnel)</legend>
            {emails.map((email, i) => (
              <input
                key={i}
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => updateEmail(i, e.target.value)}
                style={{ display: 'block', marginBottom: 6 }}
              />
            ))}
            <button type="button" onClick={addEmailRow}>+ ajouter un email</button>
          </fieldset>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setStep('mode')} disabled={loading}>
              ← Retour
            </button>
            <button type="submit" disabled={loading || !teamName.trim()}>
              {loading ? 'Création…' : "Créer l'équipe"}
            </button>
          </div>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </form>
      )}
    </main>
  )
}
