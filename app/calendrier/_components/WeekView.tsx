'use client'

/**
 * WeekView — vue 7 colonnes avec timeline horaire verticale.
 *
 * Affiche 7 jours (Lun → Dim) avec heures 0-23 en gauche. Chaque event
 * est positionné en absolute selon start/end. Click sur un slot vide →
 * onCreateAt(iso datetime). Click sur un event → onOpenEvent(event).
 *
 * Events all-day affichés en haut en bandeau séparé.
 */

import type { Event } from '@/lib/v3-types'

function pad(n: number) {
  return n < 10 ? '0' + n : String(n)
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
const HOUR_HEIGHT = 48 // px / hour

export function WeekView({
  start,
  events,
  onCreateAt,
  onOpenEvent,
}: {
  /** Date du lundi de la semaine affichée (00:00:00 local). */
  start: Date
  events: Event[]
  onCreateAt: (isoDatetime: string) => void
  onOpenEvent: (event: Event) => void
}) {
  // Build 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  const todayIso = isoDate(new Date())

  // Group events per day-iso for column layout
  const eventsByDay = new Map<string, Event[]>()
  const allDayByDay = new Map<string, Event[]>()
  for (const e of events) {
    const dayIso = isoDate(new Date(e.startsAt))
    if (e.allDay) {
      const arr = allDayByDay.get(dayIso) ?? []
      arr.push(e)
      allDayByDay.set(dayIso, arr)
    } else {
      const arr = eventsByDay.get(dayIso) ?? []
      arr.push(e)
      eventsByDay.set(dayIso, arr)
    }
  }

  return (
    <div className="week-view">
      {/* Header : day columns */}
      <div className="week-header">
        <div className="week-gutter" />
        {days.map((d) => {
          const iso = isoDate(d)
          const isToday = iso === todayIso
          return (
            <div key={iso} className={`week-day-head ${isToday ? 'today' : ''}`}>
              <span className="week-day-name">{DAY_LABELS[(d.getDay() + 6) % 7]}</span>
              <span className="week-day-num">{d.getDate()}</span>
            </div>
          )
        })}
      </div>

      {/* All-day strip */}
      {[...allDayByDay.values()].some((arr) => arr.length > 0) && (
        <div className="week-allday">
          <div className="week-gutter week-allday-label">Toute la journée</div>
          {days.map((d) => {
            const iso = isoDate(d)
            const dayEvents = allDayByDay.get(iso) ?? []
            return (
              <div key={iso} className="week-allday-cell">
                {dayEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onOpenEvent(e)}
                    className="week-allday-chip"
                    style={{
                      background: `${e.color ?? '#E37520'}33`,
                      borderLeftColor: e.color ?? '#E37520',
                    }}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Hour grid */}
      <div className="week-grid">
        {/* Gutter : hours */}
        <div className="week-gutter">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="week-hour-label">
              {h === 0 ? '' : `${pad(h)}:00`}
            </div>
          ))}
        </div>

        {days.map((d) => {
          const iso = isoDate(d)
          const isToday = iso === todayIso
          const dayEvents = eventsByDay.get(iso) ?? []
          return (
            <div
              key={iso}
              className={`week-col ${isToday ? 'today' : ''}`}
              style={{ height: HOUR_HEIGHT * 24 }}
            >
              {/* Hour slots — click to create */}
              {Array.from({ length: 24 }, (_, h) => (
                <button
                  key={h}
                  type="button"
                  className="week-slot"
                  onClick={() => {
                    const dt = new Date(d)
                    dt.setHours(h, 0, 0, 0)
                    onCreateAt(dt.toISOString())
                  }}
                  aria-label={`Créer un événement à ${pad(h)}:00`}
                  style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                />
              ))}

              {/* Now line */}
              {isToday && <NowLine />}

              {/* Events absolute */}
              {dayEvents.map((e) => {
                const startDate = new Date(e.startsAt)
                const endDate = new Date(e.endsAt)
                const startMinutes =
                  startDate.getHours() * 60 + startDate.getMinutes()
                const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
                const top = (startMinutes / 60) * HOUR_HEIGHT
                const height = Math.max(
                  24,
                  ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT
                )
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onOpenEvent(e)
                    }}
                    className="week-event"
                    style={{
                      top,
                      height,
                      background: `${e.color ?? '#E37520'}26`,
                      borderLeftColor: e.color ?? '#E37520',
                    }}
                  >
                    <span className="week-event-time">
                      {pad(startDate.getHours())}:{pad(startDate.getMinutes())}
                    </span>
                    <span className="week-event-title">{e.title}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NowLine() {
  const now = new Date()
  const top =
    ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT
  return (
    <div className="week-now-line" style={{ top }}>
      <span className="week-now-dot" />
    </div>
  )
}
