'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { store } from './store'
import { useTimer } from './use-timer'
import { requestNotificationPermission, sendNotification } from './notifications'
import { initCloudSync, refreshFromCloud, isCloudSyncReady, flushPending, refreshFromCloudWithStatus } from './cloud-sync'
import type {
  Task, Category, TimeEntry, Goal,
  Contact, Interaction, Post, Project, ProjectNote, VocalProject, VocalNote, PromptNote,
  TodoItem,
} from './types'

type AppContextType = {
  // TaskFlow state
  tasks: Task[]
  categories: Category[]
  timeEntries: TimeEntry[]
  goals: Goal[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  timer: ReturnType<typeof useTimer>
  createTask: (task: Omit<Task, 'id'>) => Task
  createTaskWithTodo: (task: Omit<Task, 'id'>, autoCreateTodo?: boolean) => Task
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (id: string) => void
  createCategory: (name: string, color: string) => Category
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => void
  createTimeEntry: (entry: Omit<TimeEntry, 'id'>) => TimeEntry
  updateTimeEntry: (id: string, updates: Partial<Omit<TimeEntry, 'id'>>) => void
  // Todos
  todos: TodoItem[]
  createTodo: (data: Omit<TodoItem, 'id' | 'createdAt'>) => TodoItem
  updateTodo: (id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>) => void
  deleteTodo: (id: string) => void
  // CRM state
  contacts: Contact[]
  posts: Post[]
  projects: Project[]
  vocalProjects: VocalProject[]
  refresh: () => void
  createContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Contact
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  getInteractions: (contactId: string) => Interaction[]
  createInteraction: (data: Omit<Interaction, 'id'>) => Interaction
  deleteInteraction: (id: string) => void
  createPost: (data: Omit<Post, 'id'>) => Post
  updatePost: (id: string, data: Partial<Post>) => void
  deletePost: (id: string) => void
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'linkedTaskIds' | 'linkedContactIds' | 'linkedPostIds' | 'revenue' | 'collaborators'> & { linkedTaskIds?: string[]; linkedContactIds?: string[]; linkedPostIds?: string[]; revenue?: number; collaborators?: string[] }) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  getProjectNotes: (projectId: string) => ProjectNote[]
  createProjectNote: (data: Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>) => ProjectNote
  updateProjectNote: (id: string, data: Partial<Omit<ProjectNote, 'id'>>) => void
  deleteProjectNote: (id: string) => void
  createVocalProject: (data: Omit<VocalProject, 'id' | 'createdAt'>) => VocalProject
  updateVocalProject: (id: string, data: Partial<VocalProject>) => void
  deleteVocalProject: (id: string) => void
  getVocalNotes: (projectId: string) => VocalNote[]
  createVocalNote: (data: Omit<VocalNote, 'id' | 'createdAt'>) => VocalNote
  updateVocalNote: (id: string, data: Partial<Omit<VocalNote, 'id' | 'createdAt'>>) => void
  deleteVocalNote: (id: string) => void
  getPromptNotes: (projectId: string) => PromptNote[]
  getLatestPrompt: (projectId: string) => PromptNote | undefined
  createPromptNote: (data: Omit<PromptNote, 'id' | 'createdAt' | 'updatedAt'>) => PromptNote
  updatePromptNote: (id: string, data: Partial<PromptNote>) => void
  markPromptUsed: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // TaskFlow state
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [chatOpen, setChatOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const timer = useTimer()

  // Todos
  const [todos, setTodos] = useState<TodoItem[]>([])

  // CRM state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [vocalProjects, setVocalProjects] = useState<VocalProject[]>([])

  const refresh = useCallback(() => {
    setTasks(store.getTasks())
    setCategories(store.getCategories())
    setTimeEntries(store.getTimeEntries())
    setGoals(store.getGoals())
    setTodos(store.getTodos())
    setContacts(store.getContacts())
    setPosts(store.getPosts())
    setProjects(store.getProjects())
    setVocalProjects(store.getVocalProjects())
  }, [])

  // Cloud sync — pull from Supabase on mount, then refresh local state
  useEffect(() => {
    let cancelled = false
    const initSync = async () => {
      const { ok } = await initCloudSync()
      if (cancelled) return
      if (ok) {
        // Refresh React state from the now-up-to-date localStorage cache
        refresh()
      }
    }
    initSync()

    // Re-pull on window focus (cross-device sync)
    const handleFocus = async () => {
      if (!isCloudSyncReady()) return
      await refreshFromCloudWithStatus()
      refresh()
    }
    window.addEventListener('focus', handleFocus)

    // Periodic poll every 60s to catch changes made on other devices
    const pollInterval = setInterval(async () => {
      if (!isCloudSyncReady()) return
      if (document.visibilityState !== 'visible') return // skip when tab is hidden
      await refreshFromCloudWithStatus()
      refresh()
    }, 60_000)

    // Flush pending cloud writes before the tab is closed/refreshed
    const handleUnload = () => {
      if (!isCloudSyncReady()) return
      flushPending()
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
    // Also flush when tab becomes hidden (mobile back, switching apps)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && isCloudSyncReady()) {
        flushPending()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  // Task reminders — check every minute for upcoming tasks
  useEffect(() => {
    refresh()
    requestNotificationPermission()

    const checkReminders = () => {
      const settings = store.getSettings()
      if (!settings.notifications.taskReminders) return
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const allTasks = store.getTasks()
      const reminderKey = 'bloom_last_reminders'
      const sentRaw = localStorage.getItem(reminderKey)
      const sent: string[] = sentRaw ? JSON.parse(sentRaw) : []
      const newSent = [...sent]

      for (const task of allTasks) {
        if (task.date !== todayStr || task.status === 'done') continue
        const [h, m] = task.startTime.split(':').map(Number)
        const taskMinutes = h * 60 + m
        const diff = taskMinutes - currentMinutes
        // Remind 5 minutes before
        if (diff >= 0 && diff <= 5 && !sent.includes(task.id)) {
          sendNotification(`Tâche bientôt : ${task.title}`, `Début à ${task.startTime}`)
          newSent.push(task.id)
        }
      }

      if (newSent.length !== sent.length) {
        localStorage.setItem(reminderKey, JSON.stringify(newSent))
      }
      // Reset sent reminders at midnight
      if (currentMinutes === 0) {
        localStorage.removeItem(reminderKey)
      }
    }

    // Daily digest — on app open, show summary if enabled and at/after digest time
    const checkDailyDigest = () => {
      const settings = store.getSettings()
      if (!settings.notifications.dailyDigest) return
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const digestSentKey = 'bloom_digest_sent'
      const lastDigest = localStorage.getItem(digestSentKey)
      if (lastDigest === todayStr) return // Already sent today

      const [dh, dm] = (settings.notifications.digestTime || '08:00').split(':').map(Number)
      const digestMinutes = dh * 60 + dm
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (currentMinutes < digestMinutes) return // Too early

      const allTasks = store.getTasks()
      const todayTasks = allTasks.filter((t) => t.date === todayStr && t.status !== 'done')
      const allTodos = store.getTodos()
      const activeTodos = allTodos.filter((t) => !t.done && (!t.date || t.date === todayStr))

      const body = `${todayTasks.length} tâche${todayTasks.length > 1 ? 's' : ''} planifiée${todayTasks.length > 1 ? 's' : ''}, ${activeTodos.length} to-do en attente`
      sendNotification('Résumé du jour', body)
      localStorage.setItem(digestSentKey, todayStr)
    }

    // Overdue todos — notify once per day on app open
    const checkOverdueTodos = () => {
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const overdueNotifKey = 'bloom_overdue_notified'
      const lastNotif = localStorage.getItem(overdueNotifKey)
      if (lastNotif === todayStr) return // Already notified today

      const allTodos = store.getTodos()
      const overdue = allTodos.filter((t) => !t.done && t.date !== null && t.date < todayStr)
      if (overdue.length === 0) return

      sendNotification(
        `${overdue.length} todo${overdue.length > 1 ? 's' : ''} en retard`,
        overdue.length === 1 ? overdue[0].title : `Le plus ancien : ${overdue[0].title}`
      )
      localStorage.setItem(overdueNotifKey, todayStr)
    }

    checkReminders()
    checkDailyDigest()
    checkOverdueTodos()
    const reminderInterval = setInterval(checkReminders, 60000)
    return () => clearInterval(reminderInterval)
  }, [refresh])

  const value: AppContextType = {
    tasks, categories, timeEntries, goals,
    selectedDate, setSelectedDate,
    chatOpen, setChatOpen,
    mobileMenuOpen, setMobileMenuOpen,
    timer,
    createTask: (task) => { const t = store.createTask(task); refresh(); return t },
    createTaskWithTodo: (task, autoCreateTodo = true) => { const t = store.createTaskWithTodo(task, autoCreateTodo); refresh(); return t },
    updateTask: (id, updates) => { store.updateTask(id, updates); refresh() },
    deleteTask: (id) => { store.deleteTask(id); refresh() },
    createCategory: (name, color) => { const c = store.createCategory(name, color); refresh(); return c },
    updateCategory: (id, updates) => { store.updateCategory(id, updates); refresh() },
    deleteCategory: (id) => { store.deleteCategory(id); refresh() },
    createTimeEntry: (entry) => { const e = store.createTimeEntry(entry); refresh(); return e },
    updateTimeEntry: (id, updates) => { store.updateTimeEntry(id, updates); refresh() },
    todos,
    createTodo: (data) => { const t = store.createTodo(data); refresh(); return t },
    updateTodo: (id, updates) => { store.updateTodo(id, updates); refresh() },
    deleteTodo: (id) => { store.deleteTodo(id); refresh() },
    contacts, posts, projects, vocalProjects,
    refresh,
    createContact: (data) => { const c = store.createContact(data); refresh(); return c },
    updateContact: (id, data) => { store.updateContact(id, data); refresh() },
    deleteContact: (id) => { store.deleteContact(id); refresh() },
    getInteractions: (contactId) => store.getInteractions(contactId),
    createInteraction: (data) => { const i = store.createInteraction(data); refresh(); return i },
    deleteInteraction: (id) => { store.deleteInteraction(id); refresh() },
    createPost: (data) => { const p = store.createPost(data); refresh(); return p },
    updatePost: (id, data) => { store.updatePost(id, data); refresh() },
    deletePost: (id) => { store.deletePost(id); refresh() },
    createProject: (data) => { const p = store.createProject(data); refresh(); return p },
    updateProject: (id, data) => { store.updateProject(id, data); refresh() },
    deleteProject: (id) => { store.deleteProject(id); refresh() },
    getProjectNotes: (projectId) => store.getProjectNotes(projectId),
    createProjectNote: (data) => { const n = store.createProjectNote(data); refresh(); return n },
    updateProjectNote: (id, data) => { store.updateProjectNote(id, data); refresh() },
    deleteProjectNote: (id) => { store.deleteProjectNote(id); refresh() },
    createVocalProject: (data) => { const p = store.createVocalProject(data); refresh(); return p },
    updateVocalProject: (id, data) => { store.updateVocalProject(id, data); refresh() },
    deleteVocalProject: (id) => { store.deleteVocalProject(id); refresh() },
    getVocalNotes: (projectId) => store.getVocalNotes(projectId),
    createVocalNote: (data) => { const n = store.createVocalNote(data); refresh(); return n },
    updateVocalNote: (id, data) => { store.updateVocalNote(id, data); refresh() },
    deleteVocalNote: (id) => { store.deleteVocalNote(id); refresh() },
    getPromptNotes: (projectId) => store.getPromptNotes(projectId),
    getLatestPrompt: (projectId) => store.getLatestPrompt(projectId),
    createPromptNote: (data) => { const p = store.createPromptNote(data); refresh(); return p },
    updatePromptNote: (id, data) => { store.updatePromptNote(id, data); refresh() },
    markPromptUsed: (id) => { store.markPromptUsed(id); refresh() },
  }

  return <AppContext value={value}>{children}</AppContext>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
