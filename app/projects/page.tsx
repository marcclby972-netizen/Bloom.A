'use client'

/**
 * Projects list — minimal v3.
 * useProjects scoped to current team (solo if isSolo).
 */

import { useState } from 'react'
import Link from 'next/link'
import { useCurrentTeam, useProjects } from '@/hooks'

export default function ProjectsPage() {
  const team = useCurrentTeam()
  const scope = team.isSolo ? { teamId: null } : { teamId: team.teamId ?? undefined }
  const projects = useProjects(scope)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await projects.create({
        name: name.trim(),
        description: desc.trim() || undefined,
        teamId: team.isSolo ? null : team.teamId,
      })
      setName('')
      setDesc('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Projets {team.isSolo ? '(solo)' : team.currentTeam ? `· ${team.currentTeam.name}` : ''}</h1>

      {/* Create form */}
      <form onSubmit={submit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          required
          minLength={1}
          maxLength={120}
          placeholder="nom du projet"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="description (optionnel)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button type="submit" disabled={creating || !name.trim()}>
          {creating ? 'Création…' : '+ Créer projet'}
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>

      {/* List */}
      <section style={{ marginTop: 24 }}>
        <h2>Liste ({projects.data.length})</h2>
        {projects.loading && <p>…</p>}
        {projects.error && <p style={{ color: 'crimson' }}>{projects.error.message}</p>}
        {!projects.loading && projects.data.length === 0 && <p>Aucun projet.</p>}
        <ul>
          {projects.data.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`}>{p.name}</Link>
              {' '}— [{p.status}]
              {p.description && ` · ${p.description}`}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
