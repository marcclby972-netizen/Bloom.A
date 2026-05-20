"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Square, Clock, CheckSquare, Zap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface RightPanelProps {
  selectedDate: Date
}

const todayTasks = [
  { id: 1, title: "Finaliser maquette homepage", done: true, priority: "high", project: "Site web" },
  { id: 2, title: "Review PR #234", done: false, priority: "medium", project: "App mobile" },
  { id: 3, title: "Écrire newsletter", done: false, priority: "low", project: "Marketing" },
  { id: 4, title: "Préparer présentation", done: false, priority: "high", project: "Site web" },
]

const recentSessions = [
  { project: "Site web", duration: "2h 15m", time: "Ce matin" },
  { project: "App mobile", duration: "1h 30m", time: "Hier" },
  { project: "Marketing", duration: "45m", time: "Hier" },
]

const priorityColors: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-blue-500/20 text-blue-400",
}

export function RightPanel({ selectedDate }: RightPanelProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [tasks, setTasks] = useState(todayTasks)
  const [newTask, setNewTask] = useState("")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        title: newTask,
        done: false,
        priority: "medium",
        project: "Personnel"
      }])
      setNewTask("")
    }
  }

  const completedCount = tasks.filter(t => t.done).length

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Today Summary */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">{"Aujourd'hui"}</h2>
          <span className="text-xs text-muted-foreground">
            {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckSquare className="w-4 h-4" />
              <span className="text-xs">Tâches</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {completedCount}/{tasks.length}
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Focus</span>
            </div>
            <div className="text-lg font-semibold text-foreground">4h 32m</div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground">Chrono</h3>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded">
            Site web
          </span>
        </div>

        <div className="bg-secondary rounded-xl p-4 mb-3">
          <div className="text-4xl font-mono font-bold text-center text-foreground mb-4">
            {formatTime(timerSeconds)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={cn(
                "w-12 h-12 rounded-full",
                isTimerRunning 
                  ? "bg-amber-500 hover:bg-amber-600 text-white" 
                  : "bg-primary hover:bg-orange-muted text-primary-foreground"
              )}
            >
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setIsTimerRunning(false)
                setTimerSeconds(0)
              }}
              className="w-10 h-10 rounded-full border-border hover:bg-secondary"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sessions récentes</p>
          {recentSessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{session.project}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{session.duration}</span>
                <span className="text-xs text-muted-foreground">{session.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Summary */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cette semaine</span>
            <span className="font-semibold text-foreground">18h 45m</span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Tâches du jour</h3>
          <span className="text-xs text-muted-foreground">{completedCount} terminées</span>
        </div>

        <div className="space-y-2 mb-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg bg-secondary/50 transition-opacity",
                task.done && "opacity-50"
              )}
            >
              <Checkbox 
                checked={task.done}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm text-foreground",
                  task.done && "line-through"
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{task.project}</span>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    priorityColors[task.priority]
                  )}>
                    {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Normal" : "Bas"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Task */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Ajouter une tâche..."
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button 
            size="icon" 
            onClick={addTask}
            className="bg-primary hover:bg-orange-muted text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-foreground hover:bg-secondary"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pomodoro
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-foreground hover:bg-secondary"
          >
            <Zap className="w-4 h-4 mr-2" />
            Focus
          </Button>
        </div>
      </div>
    </aside>
  )
}
