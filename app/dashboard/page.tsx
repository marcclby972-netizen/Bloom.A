'use client'

/**
 * Dashboard v3 — minimaliste, consomme les hooks v3.
 *
 * Sections : salutation · workspace switcher · timer actif · projets actifs ·
 * tâches assignées · décisions en attente · notifications non lues.
 * Markup ultra-simple (h2, ul, button) — design plus tard.
 */

import Link from 'next/link'
import {
  useCurrentUser,
  useCurrentTeam,
  useProjects,
  useTimer,
  useTasks,
  useDecisions,
  useNotifications,
  formatElapsed,
} from '@/hooks'

export default function DashboardPage() {
  const { data: user } = useCurrentUser()
  const team = useCurrentTeam()
  const projects = useProjects({ teamId: team.teamId ?? null })
  const timer = useTimer()
  const tasks = useTasks()
  const decisions = useDecisions(team.teamId)
  const notif = useNotifications()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 13) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  })()

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>
        {greeting}{user?.name ? `, ${user.name}` : ''}
      </h1>

      {/* ── Workspace switcher ── */}
      <section style={{ marginTop: 16 }}>
        <label>Espace : </label>
        <select
          value={team.isSolo ? '__solo__' : team.teamId ?? ''}
          onChange={(e) => {
            const v = e.target.value
            if (v === '__solo__') team.setCurrentTeam(null)
            else {
              const t = team.teams.find((x) => x.id === v)
              if (t) team.setCurrentTeam(t)
            }
          }}
          disabled={team.loading}
        >
          <option value="__solo__">Solo</option>
          {team.teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {!team.loading && team.teams.length === 0 && (
          <span>
            {' '}— <Link href="/onboard">Créer une équipe</Link>
          </span>
        )}
      </section>

      {/* ── Timer actif ── */}
      <section style={{ marginTop: 24 }}>
        <h2>Chrono</h2>
        {timer.loading && <p>…</p>}
        {!timer.loading && !timer.isRunning && (
          <p>
            Aucun timer en cours. <Link href="/chrono">Démarrer →</Link>
          </p>
        )}
        {!timer.loading && timer.isRunning && (
          <p>
            En cours : <strong>{formatElapsed(timer.elapsedSeconds)}</strong>{' '}
            <button onClick={() => void timer.stop()}>Stop</button>
          </p>
        )}
      </section>

      {/* ── Projets actifs ── */}
      <section style={{ marginTop: 24 }}>
        <h2>Projets actifs</h2>
        {projects.loading ? <p>…</p> : null}
        {!projects.loading && projects.data.length === 0 && (
          <p>Aucun projet. <Link href="/projects">En créer un →</Link></p>
        )}
        <ul>
          {projects.data
            .filter((p) => p.status === 'active')
            .slice(0, 5)
            .map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`}>{p.name}</Link>
              </li>
            ))}
        </ul>
      </section>

      {/* ── Mes tâches ── */}
      <section style={{ marginTop: 24 }}>
        <h2>Mes tâches assignées</h2>
        {tasks.loading ? <p>…</p> : null}
        {!tasks.loading && tasks.data.length === 0 && (
          <p>Aucune tâche assignée. <Link href="/tasks">Voir tout →</Link></p>
        )}
        <ul>
          {tasks.data.slice(0, 5).map((t) => (
            <li key={t.id}>
              [{t.status}] {t.title}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Décisions en attente (team only) ── */}
      <section style={{ marginTop: 24 }}>
        <h2>Décisions</h2>
        {team.isSolo && (
          <p>Pas de décisions en mode solo.</p>
        )}
        {!team.isSolo && decisions.loading && <p>…</p>}
        {!team.isSolo && !decisions.loading && (
          <p>
            {decisions.data.filter((d) => d.status === 'pending').length} en attente —{' '}
            <Link href="/decisions">Voir les décisions →</Link>
          </p>
        )}
      </section>

      {/* ── Notifications ── */}
      <section style={{ marginTop: 24 }}>
        <h2>Notifications</h2>
        <p>
          {notif.unreadCount} non lue{notif.unreadCount > 1 ? 's' : ''}
          {notif.unreadCount > 0 && (
            <>
              {' '}
              <button onClick={() => void notif.markAllRead()}>Tout marquer lu</button>
            </>
          )}
        </p>
        <ul>
          {notif.data.slice(0, 3).map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong>
              {n.body ? ` — ${n.body}` : ''}
              {n.readAt === null && ' (non lue)'}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
