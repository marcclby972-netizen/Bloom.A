'use client'

import { useState } from 'react'
import { store } from '@/lib/store'
import { CalendarHeader } from '@/components/layout/CalendarHeader'
import { DayView } from '@/components/calendar/DayView'
import { WeekView } from '@/components/calendar/WeekView'
import { MonthView } from '@/components/calendar/MonthView'

export type CalendarView = 'jour' | 'semaine' | 'mois'

export default function CalendrierPage() {
  const [view, setView] = useState<CalendarView>(() => {
    const settings = store.getSettings()
    return settings.defaultView || 'jour'
  })

  return (
    <>
      <CalendarHeader view={view} onViewChange={setView} />
      <div className="flex-1 overflow-auto">
        {view === 'jour' && <DayView />}
        {view === 'semaine' && <WeekView />}
        {view === 'mois' && <MonthView />}
      </div>
    </>
  )
}
