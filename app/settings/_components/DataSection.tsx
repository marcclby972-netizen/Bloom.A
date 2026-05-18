'use client'

/**
 * DataSection — export RGPD-friendly de toutes les données de l'utilisateur
 * en JSON. Téléchargement immédiat côté navigateur (data: URL).
 */

import { useState } from 'react'
import {
  Section,
  PrimaryButton,
  FieldError,
  FieldSuccess,
} from './Section'
import { exportCurrentUserDataAction } from '@/lib/actions/users'

export function DataSection() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async () => {
    setError(null)
    setSuccess(null)
    setBusy(true)
    const r = await exportCurrentUserDataAction()
    setBusy(false)
    if (!r.ok) {
      setError(r.error.message)
      return
    }
    const blob = new Blob([JSON.stringify(r.data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bloom-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setSuccess('Export téléchargé.')
    window.setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <Section
      id="data"
      eyebrow="RGPD"
      title="Mes données"
      description="Télécharge un instantané JSON de toutes les données associées à ton compte (profil, projets, tâches, temps, votes, memberships)."
    >
      <PrimaryButton onClick={handleExport} disabled={busy}>
        {busy ? 'Export en cours…' : '⬇ Télécharger mon export (.json)'}
      </PrimaryButton>
      <FieldError error={error} />
      <FieldSuccess success={success} />
      <p
        style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--bloom-text-faint)',
          lineHeight: 1.55,
        }}
      >
        Cet export contient tes données personnelles. Stocke-le en lieu sûr.
      </p>
    </Section>
  )
}
