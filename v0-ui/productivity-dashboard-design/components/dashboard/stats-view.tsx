"use client"

import { BarChart3, Clock, TrendingUp, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const weeklyData = [
  { day: "Lun", hours: 6.5, tasks: 8 },
  { day: "Mar", hours: 7.2, tasks: 12 },
  { day: "Mer", hours: 5.8, tasks: 6 },
  { day: "Jeu", hours: 8.1, tasks: 10 },
  { day: "Ven", hours: 6.0, tasks: 9 },
  { day: "Sam", hours: 2.5, tasks: 3 },
  { day: "Dim", hours: 0, tasks: 0 },
]

const projectStats = [
  { name: "Site web", hours: 18.5, color: "#F97316", percentage: 45 },
  { name: "App mobile", hours: 12.2, color: "#3B82F6", percentage: 30 },
  { name: "Marketing", hours: 6.8, color: "#22C55E", percentage: 17 },
  { name: "Autre", hours: 3.2, color: "#71717A", percentage: 8 },
]

const maxHours = Math.max(...weeklyData.map(d => d.hours))

export function StatsView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Statistiques</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Cette semaine</span>
          </div>
          <div className="text-3xl font-bold text-foreground">36.1h</div>
          <div className="text-sm text-emerald-500 mt-1">+12% vs semaine précédente</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">Tâches terminées</span>
          </div>
          <div className="text-3xl font-bold text-foreground">48</div>
          <div className="text-sm text-emerald-500 mt-1">+8% vs semaine précédente</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Productivité</span>
          </div>
          <div className="text-3xl font-bold text-foreground">87%</div>
          <div className="text-sm text-emerald-500 mt-1">+5% vs semaine précédente</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-muted-foreground">Jours actifs</span>
          </div>
          <div className="text-3xl font-bold text-foreground">6/7</div>
          <div className="text-sm text-muted-foreground mt-1">Série en cours: 12 jours</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-6">Activité hebdomadaire</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative flex-1 flex items-end">
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      data.hours > 0 ? "bg-primary" : "bg-secondary"
                    )}
                    style={{ 
                      height: data.hours > 0 ? `${(data.hours / maxHours) * 100}%` : "4px",
                      minHeight: "4px"
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{data.day}</span>
                <span className="text-xs font-medium text-foreground">{data.hours}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time by Project */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-6">Temps par projet</h3>
          <div className="space-y-4">
            {projectStats.map((project, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-foreground">{project.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{project.hours}h</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${project.percentage}%`,
                      backgroundColor: project.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pie Chart Representation */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {(() => {
                  let offset = 0
                  return projectStats.map((project, i) => {
                    const dashArray = `${project.percentage} ${100 - project.percentage}`
                    const currentOffset = offset
                    offset += project.percentage
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={project.color}
                        strokeWidth="3"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-currentOffset}
                        className="transition-all"
                      />
                    )
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">40.7h</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Heatmap */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-6">Productivité par jour</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const intensity = Math.random()
            return (
              <div
                key={i}
                className="aspect-square rounded-md transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50"
                style={{
                  backgroundColor: intensity > 0.7 
                    ? "#F97316" 
                    : intensity > 0.4 
                      ? "rgba(249, 115, 22, 0.5)" 
                      : intensity > 0.1 
                        ? "rgba(249, 115, 22, 0.2)" 
                        : "#1C1C20"
                }}
                title={`Jour ${i + 1}`}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Moins</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-[#1C1C20]" />
            <div className="w-4 h-4 rounded bg-primary/20" />
            <div className="w-4 h-4 rounded bg-primary/50" />
            <div className="w-4 h-4 rounded bg-primary" />
          </div>
          <span>Plus</span>
        </div>
      </div>
    </div>
  )
}
