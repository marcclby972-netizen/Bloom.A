'use client'

/**
 * Calendrier — vue mois fonctionnelle.
 *
 * Données : `useEvents({ from, to, teamId })` recharge à chaque navigation
 * de mois. Création via click sur une case, édition via click sur l'event.
 *
 * Lien possible vers projet/tâche via `EventModal`. Bouton dédié
 * "+ Créer une tâche depuis cet évènement" qui pré-remplit une nouvelle
 * Task avec le titre + dueDate.
 */

import { useMemo, useState } from 'react'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useEvents } from '@/hooks'
import { MonthGrid } from './_components/MonthGrid'
import { EventModal } from './_components/EventModal'
import type { Event } from '@/lib/v3-types'

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const

function isoMonthRange(year: number, month: number): { from: string; to: string } {
  // On élargit la fenêtre de quelques jours pour capturer les évènements
  // visibles sur les cellules débordant des semaines voisines.
  const from = new Date(year, month, 1)
  from.setDate(from.getDate() - 7)
  const to = new Date(year, month + 1, 1)
  to.setDate(to.getDate() + 7)
  return { from: from.toISOString(), to: to.toISOString() }
}

export default function CalendrierPage() {
  return (
    <DashboardShell screenLabel="Calendrier">
      <CalendrierContent />
    </DashboardShell>
  )
}

function CalendrierContent() {
  const { teamId } = useDashboardShell()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const range = useMemo(() => isoMonthRange(year, month), [year, month])
  const {
    data: events,
    loading,
    create,
    update,
    remove,
  } = useEvents({ from: range.from, to: range.to, teamId })

  const [modalState, setModalState] = useState<
    | { mode: 'create'; initialDate?: string }
    | { mode: 'edit'; event: Event }
    | null
  >(null)

  const goPrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else setMonth(month - 1)
  }
  const goNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else setMonth(month + 1)
  }
  const goToday = () => {
    const d = new Date()
    setMonth(d.getMonth())
    setYear(d.getFullYear())
  }

  const handleSave = async (input: {
    title: string
    description: string | null
    startsAt: string
    endsAt: string
    allDay: boolean
    projectId: string | null
    taskId: string | null
    color: string | null
  }) => {
    if (modalState?.mode === 'edit') {
      await update(modalState.event.id, { ...input, teamId })
    } else {
      await create({ ...input, teamId })
    }
  }

  const handleDelete = async () => {
    if (modalState?.mode !== 'edit') return
    await remove(modalState.event.id)
  }

  const total = events.length

  return (
    <>
      <PageHeader
        eyebrow="Vue mois"
        title={`${MONTHS[month]} ${year}`}
        right={
          <>
            <button type="button" className="btn btn-ghost-dark" onClick={goPrev}>
              ←
            </button>
            <button type="button" className="btn btn-ghost-dark" onClick={goToday}>
              Aujourd&apos;hui
            </button>
            <button type="button" className="btn btn-ghost-dark" onClick={goNext}>
              →
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalState({ mode: 'create' })}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6.5 2v9M2 6.5h9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Nouvel évènement
            </button>
          </>
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--bloom-text-muted)',
          }}
        >
          {loading
            ? 'Chargement…'
            : `${total} évènement${total > 1 ? 's' : ''} ce mois`}
        </span>
      </div>

      <MonthGrid
        year={year}
        month={month}
        events={events}
        onCreateOnDay={(iso) => setModalState({ mode: 'create', initialDate: iso })}
        onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
      />

      {modalState && (
        <EventModal
          mode={modalState.mode}
          event={modalState.mode === 'edit' ? modalState.event : null}
          initialDate={
            modalState.mode === 'create' ? modalState.initialDate : undefined
          }
          teamId={teamId}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={modalState.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </>
  )
}
