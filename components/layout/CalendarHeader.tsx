'use client'

import { useApp } from '@/lib/context'
import { formatDateFr, parseISO, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, toDateString } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
// Inline type — formerly exported from app/calendrier/page (now a placeholder).
// Kept here so legacy CalendarHeader compiles.
type CalendarView = 'jour' | 'semaine' | 'mois'

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'jour', label: 'Jour' },
  { value: 'semaine', label: 'Semaine' },
  { value: 'mois', label: 'Mois' },
]

type CalendarHeaderProps = {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
}

export function CalendarHeader({ view, onViewChange }: CalendarHeaderProps) {
  const { selectedDate, setSelectedDate } = useApp()
  const date = parseISO(selectedDate)

  const navigate = (direction: 'prev' | 'next') => {
    const fn = direction === 'prev'
      ? view === 'semaine' ? subWeeks : view === 'mois' ? subMonths : subDays
      : view === 'semaine' ? addWeeks : view === 'mois' ? addMonths : addDays
    setSelectedDate(toDateString(fn(date, 1)))
  }

  const goToday = () => setSelectedDate(toDateString(new Date()))

  const title = view === 'semaine'
    ? formatDateFr(date, "'Semaine du' d MMMM yyyy")
    : view === 'mois'
      ? formatDateFr(date, 'MMMM yyyy')
      : formatDateFr(date, 'EEEE d MMMM yyyy')

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </div>
        <h1 className="text-lg font-semibold capitalize">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* View switcher */}
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                view === v.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={goToday}>
          Aujourd&apos;hui
        </Button>
      </div>
    </div>
  )
}
