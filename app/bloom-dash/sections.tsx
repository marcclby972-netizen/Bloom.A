'use client'

import { useState, useMemo } from 'react'
import type { Project, Task, Draft, Priority } from './data'
import { PRIORITY_COLORS, STATS_BY_PROJECT, STATS_BY_DAY, INITIAL_PROJECTS, formatDuration } from './data'
import { PlusIcon, PlatformIcon } from './icons'

// ═══════════════════════════════════════════
// PROJECTS SECTION
// ═══════════════════════════════════════════
export function ProjectsSection({ projects, onNewProject }: { projects: Project[]; onNewProject: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#E8E8E8]">Projets</h2>
        <button onClick={onNewProject} className="flex items-center gap-2 h-8 px-3.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#E37520] to-[#FBBE4D] text-[#111] hover:brightness-110 transition-all">
          <PlusIcon /> Nouveau projet
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {projects.map(p => {
          const pct = p.tasks > 0 ? Math.round((p.completedTasks / p.tasks) * 100) : 0
          return (
            <div key={p.id} className="bg-[#121214] border border-[#1E1E22] rounded-xl p-4 hover:border-[#2A2A2E] transition-colors cursor-pointer group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: p.color }} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#E8E8E8] truncate group-hover:text-white transition-colors">{p.name}</h3>
                  <p className="text-xs text-[#5A5A5E] mt-0.5 truncate">{p.description}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1C1C20] text-[#5A5A5E]">{p.mode}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-[#1C1C20] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <span className="text-[10px] font-bold text-[#5A5A5E] tabular-nums">{pct}%</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-[#5A5A5E]">{p.completedTasks}/{p.tasks} tâches</span>
                <span className="text-[10px] text-[#5A5A5E]">Échéance: {new Date(p.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// TASKS SECTION
// ═══════════════════════════════════════════
type TaskFilter = 'toutes' | 'aujourdhui' | 'en_cours' | 'terminees'

export function TasksSection({ tasks, projects, onToggle, onAdd }: {
  tasks: Task[]; projects: Project[];
  onToggle: (id: string) => void; onAdd: (title: string) => void
}) {
  const [filter, setFilter] = useState<TaskFilter>('toutes')
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')

  const filtered = useMemo(() => {
    let t = [...tasks]
    if (filter === 'aujourdhui') t = t.filter(x => x.dueDate === '2026-05-20')
    else if (filter === 'en_cours') t = t.filter(x => !x.done)
    else if (filter === 'terminees') t = t.filter(x => x.done)
    if (projectFilter) t = t.filter(x => x.projectId === projectFilter)
    return t
  }, [tasks, filter, projectFilter])

  const handleAdd = () => {
    if (!newTask.trim()) return
    onAdd(newTask.trim())
    setNewTask('')
  }

  const getProjectName = (id: string | null) => {
    if (!id) return null
    return projects.find(p => p.id === id)?.name ?? null
  }
  const getProjectColor = (id: string | null) => {
    if (!id) return '#5A5A5E'
    return projects.find(p => p.id === id)?.color ?? '#5A5A5E'
  }

  const filters: { id: TaskFilter; label: string }[] = [
    { id: 'toutes', label: 'Toutes' },
    { id: 'aujourdhui', label: "Aujourd'hui" },
    { id: 'en_cours', label: 'En cours' },
    { id: 'terminees', label: 'Terminées' },
  ]

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-[#E8E8E8] mb-4">Tâches</h2>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${filter === f.id ? 'bg-[#E37520] text-white' : 'bg-[#121214] text-[#8A8A8E] hover:text-[#E8E8E8] border border-[#1E1E22]'}`}>
            {f.label}
          </button>
        ))}
        <div className="w-px h-5 bg-[#1E1E22] mx-1" />
        <button onClick={() => setProjectFilter(null)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${!projectFilter ? 'bg-[#1C1C20] text-[#E8E8E8]' : 'text-[#5A5A5E] hover:text-[#8A8A8E]'}`}>
          Tous
        </button>
        {projects.map(p => (
          <button key={p.id} onClick={() => setProjectFilter(p.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${projectFilter === p.id ? 'bg-[#1C1C20] text-[#E8E8E8]' : 'text-[#5A5A5E] hover:text-[#8A8A8E]'}`}>
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </button>
        ))}
      </div>
      {/* Task List */}
      <div className="space-y-1">
        {filtered.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#121214] transition-colors group cursor-pointer">
            <button onClick={() => onToggle(t.id)}
              className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                ${t.done ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#3A3A3E] hover:border-[#8A8A8E]'}`}>
              {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
            <span className={`flex-1 text-sm font-medium transition-colors ${t.done ? 'line-through text-[#5A5A5E]' : 'text-[#E8E8E8]'}`}>{t.title}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
              {t.priority}
            </span>
            {getProjectName(t.projectId) && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1C1C20]" style={{ color: getProjectColor(t.projectId) }}>
                {getProjectName(t.projectId)}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Add Task */}
      <div className="flex items-center gap-2 mt-4 px-3">
        <div className="w-[18px] h-[18px] rounded-md border-2 border-dashed border-[#3A3A3E] shrink-0" />
        <input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Ajouter une tâche..."
          className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#3A3A3E] outline-none" />
        {newTask && <button onClick={handleAdd} className="text-xs font-bold text-[#E37520] hover:text-[#FBBE4D] transition-colors">Ajouter</button>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// DRAFTS SECTION
// ═══════════════════════════════════════════
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: '#3A3A3E33', text: '#8A8A8E' },
  planifie: { bg: '#E3752022', text: '#E37520' },
  publie: { bg: '#22C55E22', text: '#22C55E' },
}
const STATUS_LABELS: Record<string, string> = { brouillon: 'Brouillon', planifie: 'Planifié', publie: 'Publié' }

export function DraftsSection({ drafts }: { drafts: Draft[] }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#E8E8E8]">Brouillons & Planification</h2>
        <button className="flex items-center gap-2 h-8 px-3.5 rounded-lg text-xs font-bold bg-[#1C1C20] text-[#E8E8E8] border border-[#1E1E22] hover:border-[#3A3A3E] transition-colors">
          <PlusIcon /> Nouveau brouillon
        </button>
      </div>
      <div className="space-y-2">
        {drafts.map(d => (
          <div key={d.id} className="flex items-center gap-4 bg-[#121214] border border-[#1E1E22] rounded-xl px-4 py-3 hover:border-[#2A2A2E] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C20] flex items-center justify-center text-[#8A8A8E]">
              <PlatformIcon platform={d.platform} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E8E8E8] truncate">{d.title}</p>
              <p className="text-[10px] text-[#5A5A5E] capitalize">{d.platform}</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: STATUS_COLORS[d.status]?.bg, color: STATUS_COLORS[d.status]?.text }}>
              {STATUS_LABELS[d.status]}
            </span>
            {d.scheduledDate && (
              <span className="text-[10px] text-[#5A5A5E]">
                {new Date(d.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Content Calendar */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-[#5A5A5E] uppercase tracking-wider mb-3">Calendrier de contenu — Semaine</p>
        <div className="grid grid-cols-7 gap-2">
          {['Lun 19', 'Mar 20', 'Mer 21', 'Jeu 22', 'Ven 23', 'Sam 24', 'Dim 25'].map((day, i) => {
            const scheduled = drafts.filter(d => {
              if (!d.scheduledDate) return false
              const sd = new Date(d.scheduledDate)
              return sd.getDate() === parseInt(day.split(' ')[1])
            })
            return (
              <div key={i} className="bg-[#121214] border border-[#1E1E22] rounded-lg p-2 min-h-[80px]">
                <p className="text-[10px] font-semibold text-[#5A5A5E] mb-2">{day}</p>
                {scheduled.map(s => (
                  <div key={s.id} className="text-[9px] font-medium px-1.5 py-1 rounded-md mb-1 truncate" style={{ background: '#8B5CF622', color: '#8B5CF6' }}>
                    {s.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// STATS SECTION
// ═══════════════════════════════════════════
export function StatsSection({ tasks, timerTotal }: { tasks: Task[]; timerTotal: number }) {
  const maxHours = Math.max(...STATS_BY_PROJECT.map(s => s.hours))
  const maxDay = Math.max(...STATS_BY_DAY.map(s => s.hours))
  const doneTasks = tasks.filter(t => t.done).length
  const totalWeek = STATS_BY_PROJECT.reduce((a, b) => a + b.hours, 0)

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-[#E8E8E8] mb-5">Statistiques</h2>
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Temps cette semaine', value: `${totalWeek.toFixed(1)}h`, color: '#E37520' },
          { label: 'Tâches terminées', value: `${doneTasks}`, color: '#22C55E' },
          { label: 'Projets actifs', value: `${INITIAL_PROJECTS.length}`, color: '#3B82F6' },
          { label: 'Temps aujourd\'hui', value: formatDuration(timerTotal + 8100 + 5400), color: '#FBBE4D' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#121214] border border-[#1E1E22] rounded-xl p-4">
            <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[10px] text-[#5A5A5E] mt-1 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>
      {/* Time per Project */}
      <div className="bg-[#121214] border border-[#1E1E22] rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-[#5A5A5E] uppercase tracking-wider mb-4">Temps par projet</p>
        <div className="space-y-3">
          {STATS_BY_PROJECT.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#E8E8E8]">{s.name}</span>
                <span className="text-xs font-bold tabular-nums text-[#8A8A8E]">{s.hours}h</span>
              </div>
              <div className="h-2 rounded-full bg-[#1C1C20] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(s.hours / maxHours) * 100}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Productivity by Day */}
      <div className="bg-[#121214] border border-[#1E1E22] rounded-xl p-5">
        <p className="text-xs font-semibold text-[#5A5A5E] uppercase tracking-wider mb-4">Productivité par jour</p>
        <div className="flex items-end gap-3 h-32">
          {STATS_BY_DAY.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold tabular-nums text-[#5A5A5E]">{s.hours > 0 ? `${s.hours}h` : ''}</span>
              <div className="w-full rounded-t-md transition-all" style={{
                height: `${maxDay > 0 ? (s.hours / maxDay) * 100 : 0}%`,
                minHeight: s.hours > 0 ? 4 : 0,
                background: i === 1 ? '#E37520' : '#1C1C20',
              }} />
              <span className={`text-[10px] font-semibold ${i === 1 ? 'text-[#E37520]' : 'text-[#5A5A5E]'}`}>{s.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
