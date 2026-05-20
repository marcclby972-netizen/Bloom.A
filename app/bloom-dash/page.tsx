'use client'

import { useState, useCallback } from 'react'
import type { CalendarView, Section, Project, Task, TimerSession } from './data'
import {
  INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_SESSIONS, INITIAL_DRAFTS,
  NAV_ITEMS,
} from './data'
import { NavIcon, SearchIcon, BellIcon, PlusIcon, LogoutIcon } from './icons'
import { CalendarSection } from './calendar'
import { ProjectsSection, TasksSection, DraftsSection, StatsSection } from './sections'
import { TimerPanel, TodaySummary, QuickActions, NewProjectModal } from './panels'

export default function BloomDashPage() {
  // ── Core State ──
  const [section, setSection] = useState<Section>('calendrier')
  const [calView, setCalView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appMode, setAppMode] = useState<'solo' | 'equipe'>('solo')

  // ── Data State ──
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [sessions, setSessions] = useState<TimerSession[]>(INITIAL_SESSIONS)
  const [drafts] = useState(INITIAL_DRAFTS)
  const events = INITIAL_EVENTS

  // ── UI State ──
  const [showNewProject, setShowNewProject] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications] = useState(3)
  const [timerTotal, setTimerTotal] = useState(0)

  // ── Handlers ──
  const handleToggleTask = useCallback((id: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [])

  const handleAddTask = useCallback((title: string) => {
    setTasks(ts => [...ts, {
      id: `t${Date.now()}`,
      title,
      priority: 'moyenne',
      done: false,
      projectId: null,
      dueDate: '2026-05-20',
    }])
  }, [])

  const handleCreateProject = useCallback((data: { name: string; description: string; mode: 'solo' | 'equipe'; color: string; deadline: string }) => {
    setProjects(ps => [...ps, {
      id: `p${Date.now()}`,
      ...data,
      tasks: 0,
      completedTasks: 0,
    }])
    setSection('projets')
  }, [])

  const handleSessionEnd = useCallback((session: TimerSession) => {
    setSessions(ss => [session, ...ss])
    setTimerTotal(t => t + session.duration)
  }, [])

  // ── Sidebar Items ──
  const BOTTOM_ITEMS = NAV_ITEMS.slice(-1) // Paramètres
  const MAIN_ITEMS = NAV_ITEMS.slice(0, -1)

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0B0B0C', fontFamily: 'var(--font-body, Montserrat, system-ui, sans-serif)' }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside style={{ background: '#0E0E10', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        className="w-[64px] flex flex-col items-center py-4 shrink-0 z-20">

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E37520, #FBBE4D)' }}>
            <span style={{ fontFamily: 'var(--font-brand, serif)', fontSize: 16, color: '#111', fontWeight: 400 }}>B</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
          {MAIN_ITEMS.map(item => {
            const active = section === item.id
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  color: active ? '#E8E8E8' : '#5A5A5E',
                  background: active ? '#1C1C20' : 'transparent',
                }}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'linear-gradient(to bottom, #E37520, #FBBE4D)' }} />}
                <NavIcon type={item.icon} />
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-1 w-full px-2">
          <div className="w-10 h-px mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {BOTTOM_ITEMS.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ color: section === item.id ? '#E8E8E8' : '#5A5A5E', background: section === item.id ? '#1C1C20' : 'transparent' }}>
              <NavIcon type={item.icon} />
            </button>
          ))}
          <button title="Déconnexion" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ color: '#5A5A5E' }}>
            <LogoutIcon />
          </button>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center mt-1 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #E37520, #FBBE4D)', color: '#111' }}>MA</div>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── HEADER ── */}
        <header className="h-14 flex items-center gap-4 px-5 shrink-0"
          style={{ background: '#0E0E10', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Page Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-[#E8E8E8]">
              {NAV_ITEMS.find(n => n.id === section)?.label ?? 'Dashboard'}
            </span>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center rounded-full p-1 relative" style={{ background: '#121214', border: '1px solid #1E1E22' }}>
            <div className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(227,117,32,0.9), rgba(251,190,77,0.8))',
                left: appMode === 'solo' ? 4 : '50%',
                width: 'calc(50% - 4px)',
              }} />
            {(['solo', 'equipe'] as const).map(m => (
              <button key={m} onClick={() => setAppMode(m)}
                className="relative z-10 px-4 py-1 text-xs font-bold capitalize rounded-full transition-colors"
                style={{ color: appMode === m ? '#111' : '#8A8A8E' }}>
                {m === 'equipe' ? 'Équipe' : 'Solo'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2 h-8 px-3 rounded-xl cursor-text"
              style={{ background: '#121214', border: '1px solid #1E1E22', color: '#5A5A5E' }}>
              <SearchIcon />
              <span className="text-xs">Rechercher...</span>
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#1C1C20', color: '#5A5A5E' }}>⌘K</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* New Project CTA */}
            <button onClick={() => setShowNewProject(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #E37520, #FBBE4D)', color: '#111' }}>
              <PlusIcon /> Nouveau projet
            </button>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: '#121214', border: '1px solid #1E1E22', color: '#8A8A8E' }}>
              <BellIcon />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#EF4444', border: '2px solid #0E0E10' }} />
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-xl cursor-pointer transition-colors hover:border-[#2A2A2E]"
              style={{ background: '#121214', border: '1px solid #1E1E22' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #E37520, #FBBE4D)', color: '#111' }}>MA</div>
              <span className="text-xs font-semibold" style={{ color: '#E8E8E8' }}>Marc A.</span>
            </div>
          </div>
        </header>

        {/* ── CENTER + RIGHT PANEL ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Center */}
          <main className="flex-1 flex flex-col min-w-0 overflow-auto">
            {section === 'calendrier' && (
              <CalendarSection
                events={events}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                view={calView}
                onViewChange={setCalView}
              />
            )}
            {section === 'dashboard' && (
              <DashboardOverview projects={projects} tasks={tasks} sessions={sessions} />
            )}
            {section === 'projets' && (
              <ProjectsSection projects={projects} onNewProject={() => setShowNewProject(true)} />
            )}
            {section === 'taches' && (
              <TasksSection tasks={tasks} projects={projects} onToggle={handleToggleTask} onAdd={handleAddTask} />
            )}
            {section === 'brouillons' && (
              <DraftsSection drafts={drafts} />
            )}
            {section === 'stats' && (
              <StatsSection tasks={tasks} timerTotal={timerTotal} />
            )}
            {section === 'chrono' && (
              <ChronoSection sessions={sessions} projects={projects} onSessionEnd={handleSessionEnd} timerTotal={timerTotal} />
            )}
            {section === 'parametres' && (
              <SettingsSection />
            )}
          </main>

          {/* Right Panel */}
          <aside className="w-[260px] shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-l"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0B0B0C' }}>
            <TodaySummary tasks={tasks} onNewProject={() => setShowNewProject(true)} onNewTask={() => setSection('taches')} />
            <TimerPanel sessions={sessions} projects={projects} onSessionEnd={handleSessionEnd} />
            <QuickActions onNewProject={() => setShowNewProject(true)} onNewTask={() => setSection('taches')} />
          </aside>
        </div>
      </div>

      {/* ═══════════ MODAL ═══════════ */}
      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onSave={handleCreateProject} />
      )}
    </div>
  )
}

// ─── Dashboard Overview ───
function DashboardOverview({ projects, tasks, sessions }: { projects: Project[]; tasks: Task[]; sessions: TimerSession[] }) {
  const openTasks = tasks.filter(t => !t.done).length
  const doneTasks = tasks.filter(t => t.done).length
  const totalTime = sessions.reduce((a, b) => a + b.duration, 0)
  const h = Math.floor(totalTime / 3600)
  const m = Math.floor((totalTime % 3600) / 60)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-black text-[#E8E8E8] mb-1">Bonjour, Marc 👋</h2>
        <p className="text-sm text-[#5A5A5E]">Voici un aperçu de ta journée</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Projets actifs', value: projects.length, color: '#E37520' },
          { label: 'Tâches ouvertes', value: openTasks, color: '#3B82F6' },
          { label: 'Tâches terminées', value: doneTasks, color: '#22C55E' },
          { label: 'Temps tracké', value: `${h}h ${m}m`, color: '#FBBE4D' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: '#121214', border: '1px solid #1E1E22' }}>
            <p className="text-2xl font-black tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[11px] mt-1" style={{ color: '#5A5A5E' }}>{kpi.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {projects.slice(0, 4).map(p => {
          const pct = p.tasks > 0 ? Math.round((p.completedTasks / p.tasks) * 100) : 0
          return (
            <div key={p.id} className="rounded-2xl p-4 cursor-pointer hover:border-[#2A2A2E] transition-colors" style={{ background: '#121214', border: '1px solid #1E1E22' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-sm font-bold text-[#E8E8E8] truncate">{p.name}</span>
              </div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: '#1C1C20' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px]" style={{ color: '#5A5A5E' }}>{pct}% fait</span>
                <span className="text-[10px]" style={{ color: '#5A5A5E' }}>Échéance: {new Date(p.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chrono Full Section ───
function ChronoSection({ sessions, projects, onSessionEnd, timerTotal }: {
  sessions: TimerSession[]; projects: Project[]; onSessionEnd: (s: TimerSession) => void; timerTotal: number
}) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-[#E8E8E8] mb-5">Chrono</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <TimerPanel sessions={sessions} projects={projects} onSessionEnd={onSessionEnd} />
        </div>
        <div className="rounded-2xl p-4 space-y-2" style={{ background: '#121214', border: '1px solid #1E1E22' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5E] mb-3">Toutes les sessions</p>
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: '#1E1E22' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#E8E8E8] truncate">{s.project}</p>
                <p className="text-[10px] text-[#5A5A5E]">{s.task} · {s.date}</p>
              </div>
              <span className="text-xs font-black tabular-nums text-[#8A8A8E]">{Math.floor(s.duration / 3600)}h {Math.floor((s.duration % 3600) / 60)}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings Placeholder ───
function SettingsSection() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-[#E8E8E8] mb-5">Paramètres</h2>
      <div className="rounded-2xl p-6 text-center" style={{ background: '#121214', border: '1px solid #1E1E22' }}>
        <p className="text-sm text-[#5A5A5E]">Paramètres à venir</p>
      </div>
    </div>
  )
}
