'use client'

import { useState, useEffect, useRef } from 'react'
import type { TimerSession, Project, Task } from './data'
import { formatTimer, formatDuration, PROJECT_COLORS } from './data'
import { PlayIcon, PauseIcon, StopIcon, PlusIcon, XIcon } from './icons'

// ═══════════════════════════════════════════
// TIMER PANEL
// ═══════════════════════════════════════════
interface TimerPanelProps {
  sessions: TimerSession[]
  projects: Project[]
  onSessionEnd: (session: TimerSession) => void
}

export function TimerPanel({ sessions, projects, onSessionEnd }: TimerPanelProps) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [selectedProject, setSelectedProject] = useState<string>('p1')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const handleStop = () => {
    if (elapsed === 0) return
    setRunning(false)
    const proj = projects.find(p => p.id === selectedProject)
    onSessionEnd({
      id: `s${Date.now()}`,
      project: proj?.name ?? 'Inconnu',
      task: 'Session manuelle',
      duration: elapsed,
      date: new Date().toISOString().slice(0, 10),
    })
    setElapsed(0)
  }

  const todayTotal = sessions
    .filter(s => s.date === '2026-05-20')
    .reduce((a, b) => a + b.duration, 0) + (running ? elapsed : 0)
  const weekTotal = sessions.reduce((a, b) => a + b.duration, 0) + (running ? elapsed : 0)

  return (
    <div className="bg-[#121214] border border-[#1E1E22] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E]">Chrono</p>
        {running && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#22C55E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            En cours
          </span>
        )}
      </div>

      {/* Big Timer Display */}
      <div className="text-center my-3">
        <span className="text-4xl font-black tabular-nums tracking-tight text-[#E8E8E8] font-mono">
          {formatTimer(elapsed)}
        </span>
      </div>

      {/* Project Selector */}
      <select
        value={selectedProject}
        onChange={e => setSelectedProject(e.target.value)}
        disabled={running}
        className="w-full bg-[#0F0F11] border border-[#1E1E22] rounded-lg px-3 py-2 text-xs font-semibold text-[#E8E8E8] mb-3 outline-none disabled:opacity-50 cursor-pointer"
      >
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRunning(r => !r)}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold transition-all
            ${running
              ? 'bg-[#1C1C20] border border-[#2A2A2E] text-[#E8E8E8] hover:bg-[#222224]'
              : 'bg-gradient-to-r from-[#E37520] to-[#FBBE4D] text-[#111] hover:brightness-110'}`}
        >
          {running ? <><PauseIcon /> Pause</> : <><PlayIcon /> Démarrer</>}
        </button>
        {elapsed > 0 && (
          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-xl bg-[#1C1C20] border border-[#2A2A2E] flex items-center justify-center text-[#EF4444] hover:bg-[#EF444411] transition-colors"
          >
            <StopIcon />
          </button>
        )}
      </div>

      {/* Today / Week stats */}
      <div className="flex gap-2 mt-4">
        <div className="flex-1 bg-[#0F0F11] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#5A5A5E] font-medium mb-1">Aujourd&apos;hui</p>
          <p className="text-sm font-bold text-[#E8E8E8] tabular-nums">{formatDuration(todayTotal)}</p>
        </div>
        <div className="flex-1 bg-[#0F0F11] rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#5A5A5E] font-medium mb-1">Cette semaine</p>
          <p className="text-sm font-bold text-[#E8E8E8] tabular-nums">{formatDuration(weekTotal)}</p>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] mb-2">Sessions récentes</p>
          <div className="space-y-1.5">
            {sessions.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#8A8A8E] truncate">{s.project}</p>
                  <p className="text-[10px] text-[#5A5A5E] truncate">{s.task}</p>
                </div>
                <span className="text-[10px] font-bold tabular-nums text-[#5A5A5E]">{formatDuration(s.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// TODAY SUMMARY
// ═══════════════════════════════════════════
export function TodaySummary({ tasks, onNewProject, onNewTask }: {
  tasks: Task[]
  onNewProject: () => void
  onNewTask: () => void
}) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const openToday = tasks.filter(t => !t.done && t.dueDate === '2026-05-20').length
  const doneToday = tasks.filter(t => t.done && t.dueDate === '2026-05-20').length

  return (
    <div className="bg-[#121214] border border-[#1E1E22] rounded-2xl p-4 mb-3">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] mb-1">Aujourd&apos;hui</p>
        <p className="text-sm font-semibold text-[#E8E8E8] capitalize">{dateStr}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#0F0F11] rounded-xl p-3">
          <p className="text-xl font-black text-[#E37520] tabular-nums">{openToday}</p>
          <p className="text-[10px] text-[#5A5A5E] mt-0.5">tâches restantes</p>
        </div>
        <div className="bg-[#0F0F11] rounded-xl p-3">
          <p className="text-xl font-black text-[#22C55E] tabular-nums">{doneToday}</p>
          <p className="text-[10px] text-[#5A5A5E] mt-0.5">tâches faites</p>
        </div>
      </div>
      {/* Next event */}
      <div className="flex items-center gap-2 py-2 px-3 bg-[#E3752011] border border-[#E3752022] rounded-xl">
        <div className="w-1 h-8 rounded-full bg-[#E37520] shrink-0" />
        <div>
          <p className="text-xs font-bold text-[#E8E8E8]">Réunion équipe design</p>
          <p className="text-[10px] text-[#5A5A5E]">10:00 → 11:00</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════
export function QuickActions({ onNewProject, onNewTask }: { onNewProject: () => void; onNewTask: () => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] mb-2">Actions rapides</p>
      <button onClick={onNewProject} className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl bg-[#121214] border border-[#1E1E22] hover:border-[#2A2A2E] text-xs font-semibold text-[#E8E8E8] transition-colors">
        <PlusIcon /> Nouveau projet
      </button>
      <button onClick={onNewTask} className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl bg-[#121214] border border-[#1E1E22] hover:border-[#2A2A2E] text-xs font-semibold text-[#E8E8E8] transition-colors">
        <PlusIcon /> Ajouter une tâche
      </button>
      <button className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl bg-[#121214] border border-[#1E1E22] hover:border-[#2A2A2E] text-xs font-semibold text-[#E8E8E8] transition-colors">
        <PlusIcon /> Nouveau brouillon
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// PROJECT CREATION MODAL
// ═══════════════════════════════════════════
interface NewProjectModalProps {
  onClose: () => void
  onSave: (project: { name: string; description: string; mode: 'solo' | 'equipe'; color: string; deadline: string }) => void
}

export function NewProjectModal({ onClose, onSave }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<'solo' | 'equipe'>('solo')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [deadline, setDeadline] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description, mode, color, deadline })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#121214] border border-[#1E1E22] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E8E8E8]">Nouveau projet</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A5A5E] hover:bg-[#1C1C20] hover:text-[#E8E8E8] transition-colors"><XIcon /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] block mb-1.5">Nom du projet</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Refonte Landing Page"
              className="w-full bg-[#0F0F11] border border-[#1E1E22] rounded-xl px-3 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#3A3A3E] outline-none focus:border-[#3A3A3E] transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description courte du projet..."
              rows={2}
              className="w-full bg-[#0F0F11] border border-[#1E1E22] rounded-xl px-3 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#3A3A3E] outline-none focus:border-[#3A3A3E] resize-none transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] block mb-1.5">Mode</label>
            <div className="flex gap-2">
              {(['solo', 'equipe'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all
                    ${mode === m ? 'bg-gradient-to-r from-[#E37520] to-[#FBBE4D] text-[#111]' : 'bg-[#0F0F11] border border-[#1E1E22] text-[#8A8A8E] hover:text-[#E8E8E8]'}`}>
                  {m === 'equipe' ? 'Équipe' : 'Solo'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] block mb-1.5">Couleur</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121214] scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] block mb-1.5">Échéance</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full bg-[#0F0F11] border border-[#1E1E22] rounded-xl px-3 py-2.5 text-sm text-[#E8E8E8] outline-none focus:border-[#3A3A3E] transition-colors" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl bg-[#1C1C20] border border-[#1E1E22] text-xs font-bold text-[#8A8A8E] hover:text-[#E8E8E8] transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#E37520] to-[#FBBE4D] text-xs font-bold text-[#111] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Créer le projet
          </button>
        </div>
      </div>
    </div>
  )
}
