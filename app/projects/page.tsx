'use client'

/**
 * Projects — liste des projets actifs/archivés du scope (solo ou team).
 *
 * UI : header avec titre + bouton "Nouveau projet" → ouvre un formulaire
 * inline ; grille de cards (`.proj-card`) avec progress bar et lien vers
 * `/projects/[id]`.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'
import { useCurrentTeam, useProjects, useTasks } from '@/hooks'
import type { Project, Task } from '@/lib/v3-types'

export default function ProjectsPage() {
  return (
    <DashboardShell screenLabel="Projects">
      <ProjectsContent />
    </DashboardShell>
  )
}

function ProjectsContent() {
  const { teamId } = useCurrentTeam()
  const { data: projects, loading, create, refetch } = useProjects({ teamId })
  const { data: tasks } = useTasks()
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active')

  const tasksByProject = useMemo<Map<string, Task[]>>(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      const arr = m.get(t.projectId) ?? []
      arr.push(t)
      m.set(t.projectId, arr)
    }
    return m
  }, [tasks])

  const filtered = useMemo<Project[]>(() => {
    if (filter === 'all') return projects
    return projects.filter((p) => p.status === filter)
  }, [projects, filter])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setBusy(true)
    try {
      await create({ name: name.trim(), teamId: teamId ?? undefined })
      setName('')
      setCreating(false)
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création échouée')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={teamId ? 'Équipe' : 'Solo'}
        title="Projets"
        right={
          <>
            <FilterPill value="active" current={filter} onChange={setFilter}>
              Actifs
            </FilterPill>
            <FilterPill value="archived" current={filter} onChange={setFilter}>
              Archivés
            </FilterPill>
            <FilterPill value="all" current={filter} onChange={setFilter}>
              Tous
            </FilterPill>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCreating((c) => !c)}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 2v9M2 6.5h9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Nouveau projet
            </button>
          </>
        }
      />

      {creating && (
        <form
          onSubmit={submit}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Nom du projet — ex : Refonte landing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            maxLength={120}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--ink)',
              padding: '10px 12px',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Création…' : 'Créer'}
          </button>
          <button
            type="button"
            className="btn btn-ghost-dark"
            onClick={() => {
              setCreating(false)
              setName('')
              setError(null)
            }}
            disabled={busy}
          >
            Annuler
          </button>
          {error && (
            <span
              role="alert"
              style={{ fontSize: 13, color: '#FCA5A5', marginLeft: 8 }}
            >
              {error}
            </span>
          )}
        </form>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {loading && filtered.length === 0 && (
          <div className="proj-card" style={{ opacity: 0.5 }}>
            <div className="top">
              <span className="name">Chargement…</span>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && !creating && (
          <button
            type="button"
            className="widget add"
            style={{ minHeight: 160 }}
            onClick={() => setCreating(true)}
          >
            <span className="plus">
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="lab">
              {filter === 'archived'
                ? 'Aucun projet archivé'
                : 'Créer ton premier projet'}
            </span>
          </button>
        )}

        {filtered.map((p) => {
          const t = tasksByProject.get(p.id) ?? []
          const total = t.length
          const done = t.filter((x) => x.status === 'done').length
          const pct = total === 0 ? 0 : Math.round((done / total) * 100)
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="proj-card"
              style={{ textDecoration: 'none', minHeight: 110 }}
            >
              <div className="top">
                <span className="name">{p.name}</span>
                <span className="tasks">
                  {done}/{total} tâche{total > 1 ? 's' : ''}
                </span>
              </div>
              {p.description && (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(236,236,236,0.6)',
                    margin: '4px 0 8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.description}
                </p>
              )}
              <div className="row-end">
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span className="pct">{pct}%</span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

function FilterPill({
  value,
  current,
  onChange,
  children,
}: {
  value: 'active' | 'archived' | 'all'
  current: string
  onChange: (v: 'active' | 'archived' | 'all') => void
  children: React.ReactNode
}) {
  const active = value === current
  return (
    <button
      type="button"
      className={`btn ${active ? 'btn-secondary' : 'btn-ghost-dark'}`}
      onClick={() => onChange(value)}
      style={active ? { background: 'var(--ink)', color: '#fff' } : undefined}
    >
      {children}
    </button>
  )
}
