'use client'

/**
 * Greet row : "Bonjour Marc 👋" + date du jour + actions rapides.
 *
 * Actions :
 *  - "Nouveau projet" → push /projects
 *  - "Nouvelle tâche" → push /tasks
 *  - "Démarrer chrono" → push /chrono (le bouton démarre côté /chrono pour
 *    pouvoir choisir un projet ; le widget Chrono actif gère le stop)
 */

import { useRouter } from 'next/navigation'

const DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

function formatToday(d = new Date()): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function GreetRow({
  userName,
}: {
  userName: string | null
}) {
  const router = useRouter()
  const firstName = userName?.split(/\s+/)[0] ?? 'là'

  return (
    <div className="greet-row">
      <div className="greet">
        <h1>
          Bonjour {firstName} <span className="wave">👋</span>
        </h1>
        <div className="date">
          <span>{formatToday()}</span>
        </div>
      </div>
      <div className="quick-actions">
        <button
          type="button"
          className="btn btn-ghost-dark"
          onClick={() => router.push('/projects')}
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
        <button
          type="button"
          className="btn btn-ghost-dark"
          onClick={() => router.push('/tasks')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 2v9M2 6.5h9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Nouvelle tâche
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push('/chrono')}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
            <path d="M2 1v9l7-4.5L2 1z" />
          </svg>
          Démarrer chrono
        </button>
      </div>
    </div>
  )
}
