// ══════════════════════════════════════════════════════
// BLOOM DASHBOARD — Types & Sample Data
// ══════════════════════════════════════════════════════

export type CalendarView = 'day' | 'week' | 'month' | 'year'
export type Section = 'dashboard' | 'projets' | 'taches' | 'calendrier' | 'chrono' | 'brouillons' | 'stats' | 'parametres'
export type Priority = 'haute' | 'moyenne' | 'basse'
export type DraftStatus = 'brouillon' | 'planifie' | 'publie'
export type Platform = 'instagram' | 'linkedin' | 'twitter' | 'blog'

export interface Project {
  id: string
  name: string
  description: string
  mode: 'solo' | 'equipe'
  color: string
  deadline: string
  tasks: number
  completedTasks: number
}

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  projectId: string | null
  dueDate: string
}

export interface CalEvent {
  id: string
  title: string
  date: string
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  type: 'meeting' | 'task' | 'timer' | 'draft'
  color: string
}

export interface TimerSession {
  id: string
  project: string
  task: string
  duration: number
  date: string
}

export interface Draft {
  id: string
  title: string
  platform: Platform
  status: DraftStatus
  scheduledDate: string | null
}

// ── Colors ──
export const PROJECT_COLORS = ['#E37520', '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899']
export const EVENT_COLORS: Record<string, string> = {
  meeting: '#E37520',
  task: '#3B82F6',
  timer: '#22C55E',
  draft: '#8B5CF6',
}
export const PRIORITY_COLORS: Record<Priority, string> = {
  haute: '#EF4444',
  moyenne: '#F59E0B',
  basse: '#6B7280',
}

// ── Sample Projects ──
export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Refonte Site Web', description: 'Refonte complète du site vitrine', mode: 'equipe', color: '#E37520', deadline: '2026-06-15', tasks: 12, completedTasks: 7 },
  { id: 'p2', name: 'App Mobile v2', description: 'Nouvelle version de l\'app iOS/Android', mode: 'equipe', color: '#3B82F6', deadline: '2026-06-30', tasks: 18, completedTasks: 5 },
  { id: 'p3', name: 'Campagne Été', description: 'Campagne marketing été 2026', mode: 'solo', color: '#22C55E', deadline: '2026-06-22', tasks: 8, completedTasks: 3 },
  { id: 'p4', name: 'Dashboard Analytics', description: 'Tableau de bord données internes', mode: 'equipe', color: '#8B5CF6', deadline: '2026-07-10', tasks: 15, completedTasks: 2 },
]

// ── Sample Tasks ──
export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Finaliser maquettes Figma', priority: 'haute', done: false, projectId: 'p1', dueDate: '2026-05-20' },
  { id: 't2', title: 'Corriger bug navigation', priority: 'haute', done: false, projectId: 'p2', dueDate: '2026-05-20' },
  { id: 't3', title: 'Rédiger brief créatif', priority: 'moyenne', done: false, projectId: 'p3', dueDate: '2026-05-21' },
  { id: 't4', title: 'Préparer réunion client', priority: 'haute', done: false, projectId: null, dueDate: '2026-05-20' },
  { id: 't5', title: 'Mettre à jour documentation', priority: 'basse', done: false, projectId: 'p4', dueDate: '2026-05-22' },
  { id: 't6', title: 'Revue de code PR #42', priority: 'moyenne', done: true, projectId: 'p1', dueDate: '2026-05-19' },
  { id: 't7', title: 'Configurer CI/CD pipeline', priority: 'haute', done: false, projectId: 'p2', dueDate: '2026-05-21' },
  { id: 't8', title: 'Créer visuels réseaux sociaux', priority: 'moyenne', done: false, projectId: 'p3', dueDate: '2026-05-23' },
  { id: 't9', title: 'Optimiser requêtes SQL', priority: 'basse', done: true, projectId: 'p4', dueDate: '2026-05-18' },
  { id: 't10', title: 'Tester responsive mobile', priority: 'moyenne', done: false, projectId: 'p1', dueDate: '2026-05-22' },
  { id: 't11', title: 'Écrire tests unitaires', priority: 'haute', done: false, projectId: 'p2', dueDate: '2026-05-20' },
  { id: 't12', title: 'Planifier sprint prochain', priority: 'moyenne', done: false, projectId: null, dueDate: '2026-05-23' },
]

// ── Sample Events (May 2026) ──
export const INITIAL_EVENTS: CalEvent[] = [
  { id: 'e1', title: 'Sprint planning', date: '2026-05-19', startHour: 9, startMin: 0, endHour: 10, endMin: 0, type: 'meeting', color: '#E37520' },
  { id: 'e2', title: 'Réunion équipe design', date: '2026-05-20', startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting', color: '#E37520' },
  { id: 'e3', title: 'Call client Nextera', date: '2026-05-20', startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'meeting', color: '#E37520' },
  { id: 'e4', title: 'Sprint review', date: '2026-05-20', startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'task', color: '#3B82F6' },
  { id: 'e5', title: 'Workshop UX', date: '2026-05-21', startHour: 9, startMin: 30, endHour: 11, endMin: 30, type: 'meeting', color: '#E37520' },
  { id: 'e6', title: 'Maquettes mobile', date: '2026-05-21', startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'task', color: '#3B82F6' },
  { id: 'e7', title: 'Stand-up', date: '2026-05-22', startHour: 9, startMin: 0, endHour: 9, endMin: 15, type: 'meeting', color: '#E37520' },
  { id: 'e8', title: 'Demo produit', date: '2026-05-22', startHour: 15, startMin: 0, endHour: 16, endMin: 0, type: 'meeting', color: '#E37520' },
  { id: 'e9', title: 'Rétrospective', date: '2026-05-23', startHour: 14, startMin: 0, endHour: 15, endMin: 30, type: 'meeting', color: '#E37520' },
  { id: 'e10', title: 'Session chrono — Intégration', date: '2026-05-20', startHour: 11, startMin: 30, endHour: 13, endMin: 0, type: 'timer', color: '#22C55E' },
  { id: 'e11', title: 'Rédaction article blog', date: '2026-05-22', startHour: 10, startMin: 0, endHour: 12, endMin: 0, type: 'draft', color: '#8B5CF6' },
  { id: 'e12', title: 'Sync marketing', date: '2026-05-26', startHour: 10, startMin: 0, endHour: 10, endMin: 45, type: 'meeting', color: '#E37520' },
  { id: 'e13', title: 'Review design system', date: '2026-05-27', startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'task', color: '#3B82F6' },
  { id: 'e14', title: 'Planning contenu juin', date: '2026-05-28', startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'draft', color: '#8B5CF6' },
]

// ── Timer Sessions ──
export const INITIAL_SESSIONS: TimerSession[] = [
  { id: 's1', project: 'Refonte Site Web', task: 'Maquettes Figma', duration: 8100, date: '2026-05-20' },
  { id: 's2', project: 'App Mobile v2', task: 'Tests navigation', duration: 5400, date: '2026-05-20' },
  { id: 's3', project: 'Dashboard Analytics', task: 'Intégration API', duration: 2700, date: '2026-05-19' },
]

// ── Drafts ──
export const INITIAL_DRAFTS: Draft[] = [
  { id: 'd1', title: 'Lancement nouvelle feature', platform: 'instagram', status: 'planifie', scheduledDate: '2026-05-22' },
  { id: 'd2', title: 'Tips productivité #7', platform: 'linkedin', status: 'brouillon', scheduledDate: null },
  { id: 'd3', title: 'Behind the scenes — sprint', platform: 'twitter', status: 'brouillon', scheduledDate: null },
  { id: 'd4', title: 'Notre stack technique 2026', platform: 'blog', status: 'planifie', scheduledDate: '2026-05-25' },
  { id: 'd5', title: 'Témoignage client Nextera', platform: 'linkedin', status: 'publie', scheduledDate: '2026-05-18' },
  { id: 'd6', title: 'Annonce partenariat', platform: 'instagram', status: 'planifie', scheduledDate: '2026-05-28' },
]

// ── Stats Data ──
export const STATS_BY_PROJECT = [
  { name: 'Refonte Site Web', hours: 24.5, color: '#E37520' },
  { name: 'App Mobile v2', hours: 18.2, color: '#3B82F6' },
  { name: 'Campagne Été', hours: 8.7, color: '#22C55E' },
  { name: 'Dashboard Analytics', hours: 12.3, color: '#8B5CF6' },
]
export const STATS_BY_DAY = [
  { day: 'Lun', hours: 7.2 },
  { day: 'Mar', hours: 8.5 },
  { day: 'Mer', hours: 6.1 },
  { day: 'Jeu', hours: 9.3 },
  { day: 'Ven', hours: 7.8 },
  { day: 'Sam', hours: 2.1 },
  { day: 'Dim', hours: 0 },
]

// ── Navigation Items ──
export const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'projets', label: 'Projets', icon: 'folder' },
  { id: 'taches', label: 'Tâches', icon: 'check' },
  { id: 'calendrier', label: 'Calendrier', icon: 'calendar' },
  { id: 'chrono', label: 'Chrono', icon: 'timer' },
  { id: 'brouillons', label: 'Brouillons', icon: 'file' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
  { id: 'parametres', label: 'Paramètres', icon: 'settings' },
]

// ── Helpers ──
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}min`
  return `${h}h${m > 0 ? ` ${m.toString().padStart(2, '0')}min` : ''}`
}
