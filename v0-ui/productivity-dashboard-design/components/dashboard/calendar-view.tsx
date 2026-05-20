"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
}

type ViewMode = "jour" | "semaine" | "mois" | "annee"

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

// Sample events data
const events = [
  { id: 1, title: "Réunion équipe", start: 9, duration: 1, type: "meeting", day: 1 },
  { id: 2, title: "Révision projet Alpha", start: 10, duration: 2, type: "task", day: 1 },
  { id: 3, title: "Appel client", start: 14, duration: 1, type: "meeting", day: 2 },
  { id: 4, title: "Design review", start: 11, duration: 1.5, type: "meeting", day: 3 },
  { id: 5, title: "Rédaction article", start: 9, duration: 2, type: "draft", day: 3 },
  { id: 6, title: "Focus time", start: 14, duration: 3, type: "timer", day: 4 },
  { id: 7, title: "Planning sprint", start: 10, duration: 1, type: "meeting", day: 5 },
  { id: 8, title: "Publication Instagram", start: 15, duration: 0.5, type: "draft", day: 2 },
]

const typeColors: Record<string, string> = {
  meeting: "bg-blue-500/20 border-blue-500/50 text-blue-400",
  task: "bg-primary/20 border-primary/50 text-primary",
  draft: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
  timer: "bg-amber-500/20 border-amber-500/50 text-amber-400",
}

export function CalendarView({ selectedDate, setSelectedDate }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("semaine")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })

  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8h to 19h

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(currentWeekStart.getDate() + (direction * 7))
    setCurrentWeekStart(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatDateRange = () => {
    const start = weekDays[0]
    const end = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${MONTHS_FR[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${start.getDate()} ${MONTHS_FR[start.getMonth()]} - ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${start.getFullYear()}`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Calendrier</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateWeek(-1)}
              className="hover:bg-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[220px] text-center">
              {formatDateRange()}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigateWeek(1)}
              className="hover:bg-secondary"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Tabs */}
          <div className="flex bg-secondary rounded-lg p-1">
            {(["jour", "semaine", "mois", "annee"] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => setViewMode(view)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                  viewMode === view
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {view === "annee" ? "Année" : view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          <Button 
            size="sm" 
            className="bg-primary hover:bg-orange-muted text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Week View */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-3 border-r border-border"></div>
          {weekDays.map((date, i) => (
            <div 
              key={i}
              className={cn(
                "p-3 text-center border-r border-border last:border-r-0",
                isToday(date) && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">{DAYS_FR[i]}</div>
              <div className={cn(
                "text-lg font-semibold mt-1",
                isToday(date) ? "text-primary" : "text-foreground"
              )}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Time Labels */}
            <div className="border-r border-border">
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground"
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((date, dayIndex) => (
              <div 
                key={dayIndex} 
                className={cn(
                  "relative border-r border-border last:border-r-0",
                  isToday(date) && "bg-primary/5"
                )}
              >
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-16 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  />
                ))}

                {/* Events */}
                {events
                  .filter(e => e.day === dayIndex + 1)
                  .map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-md border px-2 py-1 text-xs cursor-pointer transition-opacity hover:opacity-80",
                        typeColors[event.type]
                      )}
                      style={{
                        top: `${(event.start - 8) * 64 + 4}px`,
                        height: `${event.duration * 64 - 8}px`,
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="opacity-70">{event.start}:00</div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-muted-foreground">Réunion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-muted-foreground">Tâche</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-muted-foreground">Brouillon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-muted-foreground">Session chrono</span>
        </div>
      </div>
    </div>
  )
}
