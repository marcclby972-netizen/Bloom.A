'use client'

/**
 * DayView — vue jour unique avec timeline horaire haute résolution.
 *
 * Variante stripped de WeekView : 1 seule colonne, slots plus larges,
 * bandeau all-day en haut.
 */

import type { Event } from '@/lib/v3-types'

function pad(n: number) {
  return n < 10 ? '0' + n : String(n)
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const HOUR_HEIGHT = 56

export function DayView({
  day,
  events,
  onCreateAt,
  onOpenEvent,
}: {
  day: Date
  events: Event[]
  onCreateAt: (isoDatetime: string) => void
  onOpenEvent: (event: Event) => void
}) {
  const dayIso = isoDate(day)
  const todayIso = isoDate(new Date())
  const isToday = dayIso === todayIso

  const dayEvents = events.filter((e) => isoDate(new Date(e.startsAt)) === dayIso)
  const allDay = dayEvents.filter((e) => e.allDay)
  const timed = dayEvents.filter((e) => !e.allDay)

  return (
    <div className="day-view">
      {allDay.length > 0 && (
        <div className="day-allday">
          <span className="day-allday-label">Toute la journée</span>
          <div className="day-allday-list">
            {allDay.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onOpenEvent(e)}
                className="day-allday-chip"
                style={{
                  background: `${e.color ?? '#E37520'}33`,
                  borderLeftColor: e.color ?? '#E37520',
                }}
              >
                {e.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="day-grid" style={{ height: HOUR_HEIGHT * 24 }}>
        {/* Gutter labels */}
        <div className="day-gutter">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="day-hour-label"
              style={{ top: h * HOUR_HEIGHT - 8, height: HOUR_HEIGHT }}
            >
              {h === 0 ? '' : `${pad(h)}:00`}
            </div>
          ))}
        </div>

        {/* Column */}
        <div className="day-col">
          {Array.from({ length: 24 }, (_, h) => (
            <button
              key={h}
              type="button"
              className="day-slot"
              onClick={() => {
                const dt = new Date(day)
                dt.setHours(h, 0, 0, 0)
                onCreateAt(dt.toISOString())
              }}
              aria-label={`Créer un événement à ${pad(h)}:00`}
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            />
          ))}

          {isToday && (
            <div
              className="day-now-line"
              style={{
                top:
                  ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) *
                  HOUR_HEIGHT,
              }}
            >
              <span className="day-now-dot" />
              <span className="day-now-label">
                {pad(new Date().getHours())}:{pad(new Date().getMinutes())}
              </span>
            </div>
          )}

          {timed.map((e) => {
            const startDate = new Date(e.startsAt)
            const endDate = new Date(e.endsAt)
            const startMin = startDate.getHours() * 60 + startDate.getMinutes()
            const endMin = endDate.getHours() * 60 + endDate.getMinutes()
            const top = (startMin / 60) * HOUR_HEIGHT
            const height = Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT)
            return (
              <button
                key={e.id}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onOpenEvent(e)
                }}
                className="day-event"
                style={{
                  top,
                  height,
                  background: `${e.color ?? '#E37520'}26`,
                  borderLeftColor: e.color ?? '#E37520',
                }}
              >
                <span className="day-event-time">
                  {pad(startDate.getHours())}:{pad(startDate.getMinutes())} →{' '}
                  {pad(endDate.getHours())}:{pad(endDate.getMinutes())}
                </span>
                <span className="day-event-title">{e.title}</span>
                {e.description && (
                  <span className="day-event-desc">{e.description}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
