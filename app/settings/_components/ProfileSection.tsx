'use client'

/**
 * ProfileSection — nom, langue, timezone via updateUserProfileAction.
 * "Dirty" state tracked localement, save bar collante en bas pendant
 * la modification (cf. layout principal).
 */

import { useEffect, useState } from 'react'
import {
  Section,
  Field,
  Input,
  Select,
  PrimaryButton,
  GhostButton,
  FieldError,
  FieldSuccess,
} from './Section'
import { useCurrentUser } from '@/hooks'

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
] as const

const TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Africa/Casablanca',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
] as const

export function ProfileSection() {
  const { data: user, updateProfile, refetch } = useCurrentUser()

  const [name, setName] = useState('')
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Hydrate from user
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setLanguage((user.settings.language as 'fr' | 'en') ?? 'fr')
      setTimezone(user.settings.timezone ?? 'Europe/Paris')
    }
  }, [user])

  const dirty =
    user !== null &&
    ((user.name ?? '') !== name.trim() ||
      (user.settings.language ?? 'fr') !== language ||
      (user.settings.timezone ?? 'Europe/Paris') !== timezone)

  const reset = () => {
    if (!user) return
    setName(user.name ?? '')
    setLanguage((user.settings.language as 'fr' | 'en') ?? 'fr')
    setTimezone(user.settings.timezone ?? 'Europe/Paris')
    setError(null)
    setSuccess(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      await updateProfile({
        name: name.trim(),
        settings: { language, timezone },
      })
      await refetch()
      setSuccess('Profil enregistré.')
      window.setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sauvegarde échouée')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      id="profile"
      eyebrow="Identité"
      title="Profil"
      description="Comment tu apparais sur Bloom — visible par toi et tes associés."
    >
      <form onSubmit={submit}>
        <Field label="Nom complet" htmlFor="prof-name">
          <Input
            id="prof-name"
            type="text"
            placeholder="ex : Marc Camara"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            disabled={busy}
          />
        </Field>

        <Field label="Email" htmlFor="prof-email" hint="Modifie ton email dans la section « Compte ».">
          <Input
            id="prof-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Langue" htmlFor="prof-lang">
            <Select
              id="prof-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
              disabled={busy}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fuseau horaire" htmlFor="prof-tz">
            <Select
              id="prof-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={busy}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 8,
            alignItems: 'center',
          }}
        >
          <PrimaryButton
            type="submit"
            disabled={!dirty || busy}
            style={{ opacity: !dirty || busy ? 0.6 : 1 }}
          >
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </PrimaryButton>
          {dirty && (
            <GhostButton type="button" onClick={reset} disabled={busy}>
              Annuler
            </GhostButton>
          )}
          <FieldSuccess success={success} />
        </div>

        <FieldError error={error} />
      </form>
    </Section>
  )
}
