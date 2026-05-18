'use client'

/**
 * NotificationsSection — toggles email / push via updateUserProfileAction.
 * Auto-save sur chaque toggle (optimiste).
 */

import { useEffect, useState } from 'react'
import { Section, Toggle, FieldError, FieldSuccess } from './Section'
import { useCurrentUser } from '@/hooks'

export function NotificationsSection() {
  const { data: user, updateProfile, refetch } = useCurrentUser()
  const [email, setEmail] = useState(true)
  const [push, setPush] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user?.settings.notifications) {
      setEmail(user.settings.notifications.email ?? true)
      setPush(user.settings.notifications.push ?? false)
    }
  }, [user])

  const persist = async (next: { email: boolean; push: boolean }) => {
    setError(null)
    setBusy(true)
    try {
      await updateProfile({ settings: { notifications: next } })
      await refetch()
      setSuccess('Préférences enregistrées.')
      window.setTimeout(() => setSuccess(null), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde échouée')
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = (v: boolean) => {
    setEmail(v)
    void persist({ email: v, push })
  }
  const handlePush = (v: boolean) => {
    setPush(v)
    void persist({ email, push: v })
  }

  return (
    <Section
      id="notifications"
      eyebrow="Préférences"
      title="Notifications"
      description="Choisis où tu veux être averti — emails et notifs navigateur."
    >
      <Toggle
        on={email}
        onChange={handleEmail}
        label="Email"
        description="Décisions à voter, tâches assignées, rappels chrono."
        disabled={busy}
      />
      <Toggle
        on={push}
        onChange={handlePush}
        label="Notifications push (navigateur)"
        description="Notifications instantanées dans ton navigateur (nécessite ton autorisation)."
        disabled={busy}
      />

      <div style={{ marginTop: 12 }}>
        <FieldError error={error} />
        <FieldSuccess success={success} />
      </div>
    </Section>
  )
}
