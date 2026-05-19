'use client'

/**
 * MonthGrid — vue mois 7×N comme Google Calendar.
 *
 * Click sur une case vide → onCreateOnDay(isoDate)
 * Click sur un event chip → onOpenEvent(event)
 *
 * Calcule la grille à partir du 1er du mois, aligné sur Lundi.
 * Affiche les 3 premiers events par jour, puis "+N" si overflow.
 */

import { useMemo } from 'react'
import type { Event } from '@/lib/v3-types'

function pad(n: number) {
  return n < 10 ? '0' + n : String(n)
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1, 0, 0, 0, 0)
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const

function eventsByDay(events: Event[]): Map<string, Event[]> {
  const m = new Map<string, Event[]>()
  for (const e of events) {
    const start = new Date(e.startsAt)
    const end = new Date(e.endsAt)
    // Iterate days from start to end inclusive
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    while (cursor <= last) {
      const k = isoDate(cursor)
      const arr = m.get(k) ?? []
      arr.push(e)
      m.set(k, arr)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return m
}

export function MonthGrid({
  year,
  month, // 0-11
  events,
  onCreateOnDay,
  onOpenEvent,
}: {
  year: number
  month: number
  events: Event[]
  onCreateOnDay: (iso: string) => void
  onOpenEvent: (event: Event) => void
}) {
  const firstOfMonth = startOfMonth(year, month)
  // Grille démarre lundi : ajuste pour que Mon=0
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - startWeekday)

  const byDay = useMemo(() => eventsByDay(events), [events])
  const todayIso = isoDate(new Date())
  const monthIdx = month

  // Build 6 rows x 7 cols
  const cells: Array<{ date: Date; iso: string }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({ date: d, iso: isoDate(d) })
  }

  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      {/* Header: weekday labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          background: 'var(--bloom-surface-2)',
          borderBottom: '1px solid var(--bloom-border)',
        }}
      >
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              padding: '12px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--bloom-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textAlign: 'left',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: 'minmax(110px, 1fr)',
        }}
      >
        {cells.map((c) => {
          const inMonth = c.date.getMonth() === monthIdx
          const isToday = c.iso === todayIso
          const dayEvents = byDay.get(c.iso) ?? []
          const visible = dayEvents.slice(0, 3)
          const overflow = dayEvents.length - visible.length

          return (
            <div
              key={c.iso}
              onClick={() => onCreateOnDay(c.iso)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateOnDay(c.iso)
              }}
              style={{
                padding: 6,
                borderRight: '1px solid var(--bloom-border)',
                borderBottom: '1px solid var(--bloom-border)',
                opacity: inMonth ? 1 : 0.4,
                cursor: 'pointer',
                background: isToday
                  ? 'rgba(227,117,32,0.06)'
                  : 'transparent',
                transition: 'background 120ms ease',
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                if (!isToday)
                  e.currentTarget.style.background = 'var(--bloom-surface-2)'
              }}
              onMouseLeave={(e) => {
                if (!isToday) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? 'var(--orange)' : 'var(--bloom-text)',
                  }}
                >
                  {c.date.getDate()}
                </span>
              </div>

              {visible.map((e) => (
                <button
                  type="button"
                  key={e.id}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onOpenEvent(e)
                  }}
                  style={{
                    width: '100%',
                    background: e.color
                      ? `${e.color}33`
                      : 'rgba(227,117,32,0.18)',
                    borderLeft: `3px solid ${e.color ?? '#E37520'}`,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius: 6,
                    borderBottomRightRadius: 6,
                    border: 'none',
                    borderLeftWidth: 3,
                    borderLeftStyle: 'solid',
                    borderLeftColor: e.color ?? '#E37520',
                    padding: '3px 6px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--bloom-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'inherit',
                  }}
                  title={`${e.title}${e.allDay ? '' : ` · ${pad(new Date(e.startsAt).getHours())}:${pad(new Date(e.startsAt).getMinutes())}`}`}
                >
                  {!e.allDay && (
                    <span
                      style={{
                        marginRight: 4,
                        opacity: 0.7,
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 10,
                      }}
                    >
                      {pad(new Date(e.startsAt).getHours())}h
                    </span>
                  )}
                  {e.title}
                </button>
              ))}

              {overflow > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--bloom-text-muted)',
                    fontWeight: 600,
                    paddingLeft: 4,
                  }}
                >
                  + {overflow} autre{overflow > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
