'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addDays, subDays,
  isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CalendarView, CalEvent } from './data'
import { ChevLeftIcon, ChevRightIcon } from './icons'

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7h-20h

interface CalendarProps {
  events: CalEvent[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
  view: CalendarView
  onViewChange: (v: CalendarView) => void
}

export function CalendarSection({ events, selectedDate, onSelectDate, view, onViewChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const navigate = (dir: number) => {
    if (view === 'month' || view === 'year') setCurrentDate(d => addMonths(d, dir))
    else if (view === 'week') setCurrentDate(d => addDays(d, dir * 7))
    else setCurrentDate(d => addDays(d, dir))
  }

  const goToday = () => { setCurrentDate(new Date()); onSelectDate(new Date()) }

  const headerLabel = useMemo(() => {
    if (view === 'year') return format(currentDate, 'yyyy')
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: fr })
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(ws, 'd', { locale: fr })} – ${format(we, 'd MMMM yyyy', { locale: fr })}`
    }
    return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
  }, [currentDate, view])

  // Events for selected date
  const selectedEvents = useMemo(() => {
    const ds = format(selectedDate, 'yyyy-MM-dd')
    return events.filter(e => e.date === ds)
  }, [events, selectedDate])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#E8E8E8] capitalize">{headerLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8A8E] hover:bg-[#1C1C20] hover:text-[#E8E8E8] transition-colors"><ChevLeftIcon /></button>
            <button onClick={() => navigate(1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8A8E] hover:bg-[#1C1C20] hover:text-[#E8E8E8] transition-colors"><ChevRightIcon /></button>
          </div>
          <button onClick={goToday} className="text-xs font-semibold text-[#8A8A8E] hover:text-[#E8E8E8] px-2.5 py-1 rounded-md hover:bg-[#1C1C20] transition-colors">Aujourd&apos;hui</button>
        </div>
        <div className="flex items-center bg-[#121214] border border-[#1E1E22] rounded-lg p-0.5">
          {(['day', 'week', 'month', 'year'] as CalendarView[]).map(v => (
            <button key={v} onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${view === v ? 'bg-[#E37520] text-white' : 'text-[#8A8A8E] hover:text-[#E8E8E8]'}`}>
              {{ day: 'Jour', week: 'Semaine', month: 'Mois', year: 'Année' }[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        {view === 'month' && <MonthView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={onSelectDate} events={events} />}
        {view === 'week' && <WeekView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={onSelectDate} events={events} />}
        {view === 'day' && <DayView currentDate={currentDate} events={events} />}
        {view === 'year' && <YearView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={(d) => { onSelectDate(d); setCurrentDate(d); onViewChange('month') }} events={events} />}
      </div>

      {/* Selected Day Detail */}
      {selectedEvents.length > 0 && view === 'month' && (
        <div className="px-6 pb-4">
          <div className="bg-[#121214] border border-[#1E1E22] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#5A5A5E] uppercase tracking-wider mb-3">
              {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </p>
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-1 h-6 rounded-full" style={{ background: ev.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#E8E8E8] truncate">{ev.title}</p>
                    <p className="text-xs text-[#5A5A5E]">{ev.startHour}:{ev.startMin.toString().padStart(2,'0')} – {ev.endHour}:{ev.endMin.toString().padStart(2,'0')}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: ev.color + '22', color: ev.color }}>
                    {{ meeting: 'Réunion', task: 'Tâche', timer: 'Chrono', draft: 'Contenu' }[ev.type]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ MONTH VIEW ═══
function MonthView({ currentDate, selectedDate, onSelectDate, events }: { currentDate: Date; selectedDate: Date; onSelectDate: (d: Date) => void; events: CalEvent[] }) {
  const days = useMemo(() => {
    const ms = startOfMonth(currentDate)
    const me = endOfMonth(currentDate)
    const cs = startOfWeek(ms, { weekStartsOn: 1 })
    const ce = endOfWeek(me, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: cs, end: ce })
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    events.forEach(e => {
      const arr = m.get(e.date) ?? []
      arr.push(e)
      m.set(e.date, arr)
    })
    return m
  }, [events])

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#5A5A5E] uppercase tracking-widest py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[#1E1E22] rounded-xl overflow-hidden">
        {days.map((day, i) => {
          const ds = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(ds) ?? []
          const inMonth = isSameMonth(day, currentDate)
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)
          return (
            <button key={i} onClick={() => onSelectDate(day)}
              className={`relative flex flex-col items-center py-2.5 min-h-[72px] transition-colors
                ${inMonth ? 'bg-[#0F0F11]' : 'bg-[#0B0B0C]'}
                ${selected ? 'bg-[#17171A] ring-1 ring-[#E37520] ring-inset' : ''}
                hover:bg-[#17171A]`}>
              <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                ${!inMonth ? 'text-[#3A3A3E]' : today ? 'bg-[#E37520] text-white' : selected ? 'text-[#E8E8E8]' : 'text-[#8A8A8E]'}`}>
                {format(day, 'd')}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.color }} />
                  ))}
                  {dayEvents.length > 3 && <span className="text-[8px] text-[#5A5A5E]">+{dayEvents.length - 3}</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══ WEEK VIEW ═══
function WeekView({ currentDate, selectedDate, onSelectDate, events }: { currentDate: Date; selectedDate: Date; onSelectDate: (d: Date) => void; events: CalEvent[] }) {
  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  }, [currentDate])

  const weekEvents = useMemo(() => {
    const dateStrs = new Set(weekDays.map(d => format(d, 'yyyy-MM-dd')))
    return events.filter(e => dateStrs.has(e.date))
  }, [events, weekDays])

  return (
    <div className="overflow-auto">
      {/* Day Headers */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] sticky top-0 z-10 bg-[#0B0B0C]">
        <div />
        {weekDays.map((d, i) => (
          <button key={i} onClick={() => onSelectDate(d)}
            className={`text-center py-2 border-b border-[#1E1E22] ${isSameDay(d, selectedDate) ? 'bg-[#17171A]' : ''}`}>
            <div className="text-[10px] font-semibold text-[#5A5A5E] uppercase">{WEEK_DAYS[i]}</div>
            <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full
              ${isToday(d) ? 'bg-[#E37520] text-white' : 'text-[#8A8A8E]'}`}>
              {format(d, 'd')}
            </div>
          </button>
        ))}
      </div>
      {/* Time Grid */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] relative">
        {HOURS.map(h => (
          <div key={h} className="contents">
            <div className="h-14 flex items-start justify-end pr-2 pt-0 text-[10px] font-medium text-[#5A5A5E] border-r border-[#1E1E22]">{h}:00</div>
            {weekDays.map((d, di) => {
              const ds = format(d, 'yyyy-MM-dd')
              const slotEvents = weekEvents.filter(e => e.date === ds && e.startHour === h)
              return (
                <div key={di} className="h-14 border-b border-[#1E1E22] border-r border-r-[#1E1E22] relative">
                  {slotEvents.map(ev => {
                    const durMin = (ev.endHour * 60 + ev.endMin) - (ev.startHour * 60 + ev.startMin)
                    const hPx = Math.max((durMin / 60) * 56, 20)
                    const topOff = (ev.startMin / 60) * 56
                    return (
                      <div key={ev.id} className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold overflow-hidden z-10 cursor-pointer hover:brightness-110 transition-all"
                        style={{ background: ev.color + '33', borderLeft: `2px solid ${ev.color}`, color: ev.color, top: topOff, height: hPx }}>
                        {ev.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══ DAY VIEW ═══
function DayView({ currentDate, events }: { currentDate: Date; events: CalEvent[] }) {
  const ds = format(currentDate, 'yyyy-MM-dd')
  const dayEvents = events.filter(e => e.date === ds)

  return (
    <div>
      <div className="grid grid-cols-[48px_1fr]">
        {HOURS.map(h => {
          const slotEvents = dayEvents.filter(e => e.startHour === h)
          return (
            <div key={h} className="contents">
              <div className="h-16 flex items-start justify-end pr-3 text-[11px] font-medium text-[#5A5A5E]">{h}:00</div>
              <div className="h-16 border-b border-[#1E1E22] relative">
                {slotEvents.map(ev => {
                  const durMin = (ev.endHour * 60 + ev.endMin) - (ev.startHour * 60 + ev.startMin)
                  const hPx = Math.max((durMin / 60) * 64, 28)
                  const topOff = (ev.startMin / 60) * 64
                  return (
                    <div key={ev.id} className="absolute left-0 right-0 rounded-lg px-3 py-1.5 overflow-hidden z-10"
                      style={{ background: ev.color + '22', borderLeft: `3px solid ${ev.color}`, top: topOff, height: hPx }}>
                      <p className="text-xs font-bold" style={{ color: ev.color }}>{ev.title}</p>
                      <p className="text-[10px] text-[#8A8A8E]">{ev.startHour}:{ev.startMin.toString().padStart(2,'0')} – {ev.endHour}:{ev.endMin.toString().padStart(2,'0')}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══ YEAR VIEW ═══
function YearView({ currentDate, selectedDate, onSelectDate, events }: { currentDate: Date; selectedDate: Date; onSelectDate: (d: Date) => void; events: CalEvent[] }) {
  const months = useMemo(() => {
    const year = currentDate.getFullYear()
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
  }, [currentDate])

  return (
    <div className="grid grid-cols-4 gap-4">
      {months.map((m, mi) => {
        const ms = startOfMonth(m)
        const me = endOfMonth(m)
        const cs = startOfWeek(ms, { weekStartsOn: 1 })
        const ce = endOfWeek(me, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start: cs, end: ce })
        const isCurrentMonth = isSameMonth(m, new Date())
        return (
          <div key={mi} className={`bg-[#121214] border rounded-xl p-3 cursor-pointer hover:border-[#2A2A2E] transition-colors ${isCurrentMonth ? 'border-[#E37520]/30' : 'border-[#1E1E22]'}`}
            onClick={() => onSelectDate(ms)}>
            <p className={`text-xs font-bold mb-2 capitalize ${isCurrentMonth ? 'text-[#E37520]' : 'text-[#8A8A8E]'}`}>
              {format(m, 'MMMM', { locale: fr })}
            </p>
            <div className="grid grid-cols-7 gap-px">
              {days.slice(0, 42).map((d, di) => (
                <div key={di} className={`text-[8px] w-4 h-4 flex items-center justify-center rounded-sm
                  ${!isSameMonth(d, m) ? 'text-[#2A2A2E]' : isToday(d) ? 'bg-[#E37520] text-white font-bold' : 'text-[#5A5A5E]'}`}>
                  {format(d, 'd')}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
