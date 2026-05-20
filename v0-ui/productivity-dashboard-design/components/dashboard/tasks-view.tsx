"use client"

import { useState } from "react"
import { Plus, Filter, Search, FolderKanban, MoreHorizontal, Calendar, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface Task {
  id: number
  title: string
  done: boolean
  priority: "high" | "medium" | "low"
  project: string
  projectColor: string
  dueDate: string | null
}

const initialTasks: Task[] = [
  { id: 1, title: "Finaliser maquette homepage", done: true, priority: "high", project: "Site web", projectColor: "#F97316", dueDate: "2025-01-20" },
  { id: 2, title: "Intégrer composant header", done: false, priority: "high", project: "Site web", projectColor: "#F97316", dueDate: "2025-01-21" },
  { id: 3, title: "Review PR #234", done: false, priority: "medium", project: "App mobile", projectColor: "#3B82F6", dueDate: "2025-01-22" },
  { id: 4, title: "Corriger bug navigation", done: false, priority: "high", project: "App mobile", projectColor: "#3B82F6", dueDate: null },
  { id: 5, title: "Écrire newsletter janvier", done: false, priority: "low", project: "Marketing", projectColor: "#22C55E", dueDate: "2025-01-25" },
  { id: 6, title: "Préparer présentation client", done: false, priority: "high", project: "Site web", projectColor: "#F97316", dueDate: "2025-01-23" },
  { id: 7, title: "Optimiser images landing page", done: true, priority: "medium", project: "Site web", projectColor: "#F97316", dueDate: null },
  { id: 8, title: "Test unitaires module auth", done: false, priority: "medium", project: "App mobile", projectColor: "#3B82F6", dueDate: "2025-01-24" },
  { id: 9, title: "Mise à jour documentation API", done: false, priority: "low", project: "App mobile", projectColor: "#3B82F6", dueDate: null },
  { id: 10, title: "Créer visuels réseaux sociaux", done: false, priority: "medium", project: "Marketing", projectColor: "#22C55E", dueDate: "2025-01-26" },
]

const projects = [
  { name: "Tous", color: null },
  { name: "Site web", color: "#F97316" },
  { name: "App mobile", color: "#3B82F6" },
  { name: "Marketing", color: "#22C55E" },
]

const priorityConfig = {
  high: { label: "Urgent", color: "text-red-400 bg-red-500/20" },
  medium: { label: "Normal", color: "text-amber-400 bg-amber-500/20" },
  low: { label: "Bas", color: "text-blue-400 bg-blue-500/20" },
}

export function TasksView() {
  const [tasks, setTasks] = useState(initialTasks)
  const [filterProject, setFilterProject] = useState("Tous")
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "done">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newTask, setNewTask] = useState("")

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskObj: Task = {
        id: Date.now(),
        title: newTask,
        done: false,
        priority: "medium",
        project: filterProject === "Tous" ? "Personnel" : filterProject,
        projectColor: projects.find(p => p.name === filterProject)?.color || "#71717A",
        dueDate: null,
      }
      setTasks([newTaskObj, ...tasks])
      setNewTask("")
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesProject = filterProject === "Tous" || task.project === filterProject
    const matchesStatus = filterStatus === "all" || (filterStatus === "done" ? task.done : !task.done)
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesProject && matchesStatus && matchesSearch
  })

  const todoCount = tasks.filter(t => !t.done).length
  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tâches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {todoCount} à faire · {doneCount} terminées
          </p>
        </div>
        <Button className="bg-primary hover:bg-orange-muted text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Task List */}
        <div className="col-span-3 space-y-4">
          {/* Filters Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="pl-10 bg-secondary border-border focus:ring-primary"
              />
            </div>

            <div className="flex bg-secondary rounded-lg p-1">
              {(["all", "todo", "done"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    filterStatus === status
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status === "all" ? "Toutes" : status === "todo" ? "À faire" : "Terminées"}
                </button>
              ))}
            </div>
          </div>

          {/* Add Task Input */}
          <div className="flex gap-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Ajouter une nouvelle tâche..."
              className="bg-card border-border focus:ring-primary"
            />
            <Button 
              onClick={addTask}
              className="bg-primary hover:bg-orange-muted text-primary-foreground px-6"
            >
              Ajouter
            </Button>
          </div>

          {/* Tasks List */}
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Aucune tâche trouvée</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors",
                    task.done && "opacity-60"
                  )}
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className={cn(
                        "text-sm font-medium text-foreground",
                        task.done && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        priorityConfig[task.priority].color
                      )}>
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.projectColor }}
                        />
                        <span className="text-xs text-muted-foreground">{task.project}</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short"
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="shrink-0 hover:bg-secondary">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Projects Filter */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Projets
            </h3>
            <div className="space-y-1">
              {projects.map((project) => {
                const count = project.name === "Tous" 
                  ? tasks.length 
                  : tasks.filter(t => t.project === project.name).length
                return (
                  <button
                    key={project.name}
                    onClick={() => setFilterProject(project.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      filterProject === project.name
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span>{project.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Priority Legend */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-primary" />
              Priorités
            </h3>
            <div className="space-y-2">
              {(["high", "medium", "low"] as const).map((priority) => {
                const count = tasks.filter(t => t.priority === priority && !t.done).length
                return (
                  <div key={priority} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        priorityConfig[priority].color
                      )}>
                        {priorityConfig[priority].label}
                      </span>
                    </div>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-4">Cette semaine</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Créées</span>
                <span className="text-sm font-medium text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terminées</span>
                <span className="text-sm font-medium text-emerald-500">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En retard</span>
                <span className="text-sm font-medium text-red-500">2</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: "67%" }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">67% de complétion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
