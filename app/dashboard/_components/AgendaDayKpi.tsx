'use client'

/**
 * AgendaDayKpi — KPI compact pour les évènements du jour.
 *
 * Affiche le 1er event à venir (titre + heure), ou "Aucun événement"
 * sinon. Le label du jour (Mardi 19 Mai) est mis en couleur accent.
 */

import { useMemo } from 'react'
import { KpiCard } from './KpiCard'
import { useEvents } from '@/hooks'

const DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const

const MONTHS_SHORT = [
  'Jan',
  'Fév',
  'Mars',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sept',
  'Oct',
  'Nov',
  'Déc',
] as const

function todayRange(): { from: string; to: string } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function AgendaDayKpi({ teamId }: { teamId: string | null }) {
  const range = useMemo(todayRange, [])
  const { data: events } = useEvents({ from: range.from, to: range.to, teamId })

  const today = new Date()
  const todayLabel = `${DAYS[today.getDay()]} ${today.getDate()} ${MONTHS_SHORT[today.getMonth()]}`

  const upcoming = events
    .filter((e) => new Date(e.startsAt) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
  const next = upcoming[0]
  const remaining = upcoming.length - 1

  return (
    <KpiCard href="/calendrier">
      <div className="agenda-day">
        <div className="agenda-day-date">
          <span className="agenda-day-accent">{DAYS[today.getDay()]}</span>{' '}
          <span className="agenda-day-num">{today.getDate()}</span>{' '}
          {MONTHS_SHORT[today.getMonth()]}
        </div>
        {next ? (
          <>
            <div className="agenda-day-event">{next.title}</div>
            <div className="agenda-day-meta">
              {new Date(next.startsAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {remaining > 0 && ` · ${remaining} autre${remaining > 1 ? 's' : ''}`}
            </div>
          </>
        ) : (
          <div className="agenda-day-empty">Aucun événement à venir</div>
        )}
      </div>
    </KpiCard>
  )
}
