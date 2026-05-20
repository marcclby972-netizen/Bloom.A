'use client'

/**
 * Calendrier — vue mois / semaine / jour avec switcher.
 *
 * Nav prev/today/next adapte la fenêtre selon la vue active.
 * Tous les clics (case mois, slot jour/semaine, ou bouton "Nouvel
 * événement") ouvrent EventModal.
 */

import { useMemo, useState } from 'react'
import {
  DashboardShell,
  PageHeader,
  useDashboardShell,
} from '../dashboard/_components/DashboardShell'
import { useEvents } from '@/hooks'
import { MonthGrid } from './_components/MonthGrid'
import { WeekView } from './_components/WeekView'
import { DayView } from './_components/DayView'
import { EventModal } from './_components/EventModal'
import type { Event } from '@/lib/v3-types'

type ViewMode = 'day' | 'week' | 'month'

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

function startOfWeek(d: Date): Date {
  const w = new Date(d)
  const day = w.getDay()
  const diff = day === 0 ? -6 : 1 - day
  w.setDate(w.getDate() + diff)
  w.setHours(0, 0, 0, 0)
  return w
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatWeekHeader(start: Date): string {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 4)}. – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 4)}. ${end.getFullYear()}`
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
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => new Date())

  // ─── Range pour fetch ───
  const range = useMemo(() => {
    if (view === 'day') {
      const start = startOfDay(cursor)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { from: start.toISOString(), to: end.toISOString() }
    }
    if (view === 'week') {
      const start = startOfWeek(cursor)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { from: start.toISOString(), to: end.toISOString() }
    }
    // month — élargi à ±7j pour les cellules débordantes
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    start.setDate(start.getDate() - 7)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    end.setDate(end.getDate() + 7)
    return { from: start.toISOString(), to: end.toISOString() }
  }, [view, cursor])

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

  // ─── Navigation ───
  const goPrev = () => {
    const d = new Date(cursor)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCursor(d)
  }
  const goNext = () => {
    const d = new Date(cursor)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCursor(d)
  }
  const goToday = () => setCursor(new Date())

  // ─── Title selon la vue ───
  const title =
    view === 'day'
      ? formatDayHeader(cursor)
      : view === 'week'
        ? formatWeekHeader(startOfWeek(cursor))
        : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`

  // ─── Save / delete handlers ───
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

  return (
    <>
      <PageHeader
        eyebrow={
          view === 'day' ? 'Jour' : view === 'week' ? 'Semaine' : 'Mois'
        }
        title={title}
        right={
          <>
            {/* Switch view */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bloom-surface-2)',
                border: '1px solid var(--bloom-border)',
                borderRadius: 999,
                padding: 3,
                gap: 2,
              }}
            >
              {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className="btn"
                  style={
                    view === v
                      ? {
                          background: 'var(--bloom-surface-3)',
                          color: 'var(--bloom-text)',
                          padding: '6px 14px',
                          fontSize: 12.5,
                          fontWeight: 600,
                          borderRadius: 999,
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--bloom-text-muted)',
                          padding: '6px 14px',
                          fontSize: 12.5,
                          fontWeight: 600,
                          borderRadius: 999,
                        }
                  }
                >
                  {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

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
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
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
          fontSize: 12.5,
          color: 'var(--bloom-text-muted)',
          marginBottom: 14,
        }}
      >
        {loading
          ? 'Chargement…'
          : `${events.length} évènement${events.length > 1 ? 's' : ''} dans la vue`}
      </div>

      {view === 'month' && (
        <MonthGrid
          year={cursor.getFullYear()}
          month={cursor.getMonth()}
          events={events}
          onCreateOnDay={(iso) =>
            setModalState({ mode: 'create', initialDate: iso })
          }
          onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
        />
      )}

      {view === 'week' && (
        <WeekView
          start={startOfWeek(cursor)}
          events={events}
          onCreateAt={(iso) =>
            setModalState({ mode: 'create', initialDate: iso.slice(0, 10) })
          }
          onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
        />
      )}

      {view === 'day' && (
        <DayView
          day={cursor}
          events={events}
          onCreateAt={(iso) =>
            setModalState({ mode: 'create', initialDate: iso.slice(0, 10) })
          }
          onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
        />
      )}

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
