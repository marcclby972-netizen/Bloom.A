"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CalendarView } from "@/components/dashboard/calendar-view"
import { RightPanel } from "@/components/dashboard/right-panel"
import { ProjectModal } from "@/components/dashboard/project-modal"
import { StatsView } from "@/components/dashboard/stats-view"
import { DraftsView } from "@/components/dashboard/drafts-view"
import { TasksView } from "@/components/dashboard/tasks-view"

export default function Dashboard() {
  const [activeView, setActiveView] = useState("calendrier")
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [mode, setMode] = useState<"solo" | "equipe">("solo")
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        onNewProject={() => setIsProjectModalOpen(true)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header mode={mode} setMode={setMode} />
        
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            {activeView === "calendrier" && (
              <CalendarView 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeView === "stats" && <StatsView />}
            {activeView === "brouillons" && <DraftsView />}
            {activeView === "taches" && <TasksView />}
            {activeView === "dashboard" && (
              <CalendarView 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeView === "projets" && <TasksView />}
            {activeView === "chrono" && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold text-foreground mb-4">00:00:00</div>
                  <p className="text-muted-foreground">Démarrez le chrono depuis le panneau de droite</p>
                </div>
              </div>
            )}
            {activeView === "parametres" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>
                <div className="grid gap-4 max-w-2xl">
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h3 className="font-medium text-foreground mb-2">Profil</h3>
                    <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h3 className="font-medium text-foreground mb-2">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Configurez vos préférences de notification</p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h3 className="font-medium text-foreground mb-2">Intégrations</h3>
                    <p className="text-sm text-muted-foreground">Connectez vos applications tierces</p>
                  </div>
                </div>
              </div>
            )}
          </main>
          
          <RightPanel selectedDate={selectedDate} />
        </div>
      </div>

      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)}
        mode={mode}
      />
    </div>
  )
}
