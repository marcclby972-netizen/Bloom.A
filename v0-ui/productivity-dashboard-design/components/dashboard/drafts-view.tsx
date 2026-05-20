"use client"

import { useState } from "react"
import { Plus, Calendar, Clock, Instagram, Twitter, Linkedin, FileText, Bell, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const drafts = [
  { 
    id: 1, 
    title: "5 conseils pour booster votre productivité", 
    platform: "linkedin",
    status: "draft",
    scheduledDate: null,
    excerpt: "Découvrez comment optimiser votre temps de travail..."
  },
  { 
    id: 2, 
    title: "Nouveau produit - Teaser vidéo", 
    platform: "instagram",
    status: "scheduled",
    scheduledDate: "2025-01-22",
    excerpt: "Annonce du lancement de notre nouvelle fonctionnalité"
  },
  { 
    id: 3, 
    title: "Thread: Comment j'ai doublé ma productivité", 
    platform: "twitter",
    status: "scheduled",
    scheduledDate: "2025-01-23",
    excerpt: "1/ Cette semaine, je vais vous partager..."
  },
  { 
    id: 4, 
    title: "Newsletter Janvier", 
    platform: "email",
    status: "draft",
    scheduledDate: null,
    excerpt: "Les temps forts du mois et les nouveautés à venir"
  },
  { 
    id: 5, 
    title: "Cas client: Studio Créatif", 
    platform: "linkedin",
    status: "reminder",
    scheduledDate: "2025-01-25",
    excerpt: "Comment notre outil a transformé leur workflow"
  },
]

const reminders = [
  { id: 1, title: "Répondre aux commentaires Instagram", date: "Aujourd'hui", done: false },
  { id: 2, title: "Préparer visuel pour post LinkedIn", date: "Demain", done: false },
  { id: 3, title: "Relire article blog", date: "23 Jan", done: true },
]

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  email: FileText,
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  twitter: "bg-sky-500/20 text-sky-400",
  linkedin: "bg-blue-600/20 text-blue-400",
  email: "bg-emerald-500/20 text-emerald-400",
}

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  scheduled: "bg-primary/20 text-primary",
  reminder: "bg-amber-500/20 text-amber-400",
}

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Planifié",
  reminder: "Rappel",
}

// Simple calendar for content planning
const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1)
const scheduledDays = [5, 8, 12, 15, 18, 22, 23, 25, 28]

export function DraftsView() {
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "reminder">("all")

  const filteredDrafts = filter === "all" 
    ? drafts 
    : drafts.filter(d => d.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Brouillons & Planification</h1>
        <Button className="bg-primary hover:bg-orange-muted text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau brouillon
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Drafts List */}
        <div className="col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "draft", "scheduled", "reminder"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  filter === status
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {status === "all" ? "Tous" : statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Drafts */}
          <div className="space-y-3">
            {filteredDrafts.map((draft) => {
              const PlatformIcon = platformIcons[draft.platform]
              return (
                <div 
                  key={draft.id}
                  className="bg-card rounded-xl border border-border p-4 hover:border-border/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        platformColors[draft.platform]
                      )}>
                        <PlatformIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{draft.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            statusColors[draft.status]
                          )}>
                            {statusLabels[draft.status]}
                          </span>
                          {draft.scheduledDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(draft.scheduledDate).toLocaleDateString("fr-FR", { 
                                day: "numeric", 
                                month: "short" 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="hover:bg-secondary">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{draft.excerpt}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Janvier 2025
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                <div key={i} className="text-xs text-muted-foreground py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset (January 2025 starts on Wednesday) */}
              {[0, 1, 2].map(i => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {calendarDays.map((day) => {
                const hasContent = scheduledDays.includes(day)
                const isToday = day === 20
                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-md text-xs cursor-pointer transition-colors",
                      isToday && "bg-primary text-primary-foreground font-bold",
                      hasContent && !isToday && "bg-primary/20 text-primary",
                      !hasContent && !isToday && "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{"Aujourd'hui"}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <span className="text-muted-foreground">Planifié</span>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Rappels
            </h3>
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg bg-secondary/50",
                    reminder.done && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5",
                    reminder.done ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm text-foreground",
                      reminder.done && "line-through"
                    )}>
                      {reminder.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{reminder.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un rappel
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Ce mois</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Brouillons</span>
                <span className="text-sm font-medium text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Publiés</span>
                <span className="text-sm font-medium text-foreground">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planifiés</span>
                <span className="text-sm font-medium text-foreground">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
