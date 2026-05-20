"use client"

import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  CalendarDays, 
  Timer, 
  FileText, 
  BarChart3, 
  Settings,
  Plus,
  Flower2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  onNewProject: () => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projets", label: "Projets", icon: FolderKanban },
  { id: "taches", label: "Tâches", icon: CheckSquare },
  { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  { id: "chrono", label: "Chrono", icon: Timer },
  { id: "brouillons", label: "Brouillons", icon: FileText },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "parametres", label: "Paramètres", icon: Settings },
]

export function Sidebar({ activeView, setActiveView, onNewProject }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Bloom</span>
        </div>
      </div>

      {/* New Project Button */}
      <div className="p-4">
        <Button 
          onClick={onNewProject}
          className="w-full bg-primary hover:bg-orange-muted text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive && "text-primary"
              )} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Jean Dupont</p>
            <p className="text-xs text-muted-foreground truncate">jean@bloom.app</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
