import { v4 as uuid } from 'uuid'
import type {
  Category, Task, TimeEntry, Goal,
  Contact, ContactStatus, Interaction, Post, PostMetrics,
  Project, ProjectStatus, ProjectNote, VocalProject, VocalNote, PromptNote,
  TodoItem,
  AppSettings,
} from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './types'

const KEYS = {
  tasks: 'bloom_tasks',
  categories: 'bloom_categories',
  timeEntries: 'bloom_time_entries',
  goals: 'bloom_goals',
  contacts: 'bloom_contacts',
  interactions: 'bloom_interactions',
  posts: 'bloom_posts',
  vocalProjects: 'bloom_vocal_projects',
  vocalNotes: 'bloom_vocal_notes',
  promptNotes: 'bloom_prompt_notes',
  projects: 'bloom_projects',
  projectNotes: 'bloom_project_notes',
  todos: 'bloom_todos',
} as const

// Reverse map: localStorage key → cloud-sync entity key
const KEY_TO_ENTITY: Record<string, string> = {
  bloom_tasks: 'tasks',
  bloom_categories: 'categories',
  bloom_time_entries: 'timeEntries',
  bloom_goals: 'goals',
  bloom_contacts: 'contacts',
  bloom_interactions: 'interactions',
  bloom_posts: 'posts',
  bloom_vocal_projects: 'vocalProjects',
  bloom_vocal_notes: 'vocalNotes',
  bloom_prompt_notes: 'promptNotes',
  bloom_projects: 'projects',
  bloom_project_notes: 'projectNotes',
  bloom_todos: 'todos',
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return
  // Compute diff with existing for cloud sync
  const entityKey = KEY_TO_ENTITY[key]
  let oldIds: Set<string> = new Set()
  if (entityKey) {
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as { id?: string }[]
      oldIds = new Set(prev.map((p) => p.id).filter((id): id is string => Boolean(id)))
    } catch {/* ignore */}
  }

  localStorage.setItem(key, JSON.stringify(data))

  // Fire-and-forget cloud sync
  if (entityKey) {
    // Lazy import to avoid circular dependency at module load
    import('./cloud-sync').then((sync) => {
      if (!sync.isCloudSyncReady()) return
      // Upsert all current records
      const newIds = new Set<string>()
      for (const item of data as { id?: string }[]) {
        if (!item.id) continue
        newIds.add(item.id)
        sync.queueUpsert(entityKey as Parameters<typeof sync.queueUpsert>[0], item as Record<string, unknown>)
      }
      // Delete records that disappeared
      for (const oldId of oldIds) {
        if (!newIds.has(oldId)) {
          sync.queueDelete(entityKey as Parameters<typeof sync.queueDelete>[0], oldId)
        }
      }
    }).catch(() => {/* ignore */})
  }
}

// ── Tasks ──

function getTasks(): Task[] {
  return read<Task>(KEYS.tasks)
}

function getTasksByDate(date: string): Task[] {
  return getTasks().filter((t) => t.date === date)
}

function getTask(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id)
}

function createTask(task: Omit<Task, 'id'>): Task {
  const newTask: Task = { ...task, id: uuid() }
  const tasks = getTasks()
  tasks.push(newTask)
  write(KEYS.tasks, tasks)
  return newTask
}

function updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Task | null {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...updates }
  write(KEYS.tasks, tasks)
  // Sync linked todo if status changed to done
  if (updates.status === 'done' && tasks[idx].linkedTodoId) {
    const todos = getTodos()
    const todoIdx = todos.findIndex((t) => t.id === tasks[idx].linkedTodoId)
    if (todoIdx !== -1 && !todos[todoIdx].done) {
      todos[todoIdx] = { ...todos[todoIdx], done: true }
      write(KEYS.todos, todos)
    }
  }
  return tasks[idx]
}

function deleteTask(id: string) {
  write(KEYS.tasks, getTasks().filter((t) => t.id !== id))
  write(KEYS.timeEntries, getTimeEntries().filter((e) => e.taskId !== id))
}

// ── Categories ──

function getCategories(): Category[] {
  const cats = read<Category>(KEYS.categories)
  if (cats.length === 0) {
    write(KEYS.categories, DEFAULT_CATEGORIES)
    return DEFAULT_CATEGORIES
  }
  return cats
}

function createCategory(name: string, color: string): Category {
  const cat: Category = { id: uuid(), name, color }
  const cats = getCategories()
  cats.push(cat)
  write(KEYS.categories, cats)
  return cat
}

function updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
  const cats = getCategories()
  const idx = cats.findIndex((c) => c.id === id)
  if (idx === -1) return null
  cats[idx] = { ...cats[idx], ...updates }
  write(KEYS.categories, cats)
  return cats[idx]
}

function deleteCategory(id: string) {
  write(KEYS.categories, getCategories().filter((c) => c.id !== id))
}

// ── Time Entries ──

function getTimeEntries(): TimeEntry[] {
  return read<TimeEntry>(KEYS.timeEntries)
}

function getTimeEntriesByTask(taskId: string): TimeEntry[] {
  return getTimeEntries().filter((e) => e.taskId === taskId)
}

function getTimeEntriesByDate(date: string): TimeEntry[] {
  const tasks = getTasksByDate(date)
  const taskIds = new Set(tasks.map((t) => t.id))
  return getTimeEntries().filter((e) => taskIds.has(e.taskId))
}

function createTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
  const newEntry: TimeEntry = { ...entry, id: uuid() }
  const entries = getTimeEntries()
  entries.push(newEntry)
  write(KEYS.timeEntries, entries)
  return newEntry
}

function updateTimeEntry(id: string, updates: Partial<Omit<TimeEntry, 'id'>>) {
  const entries = getTimeEntries()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return
  entries[idx] = { ...entries[idx], ...updates }
  write(KEYS.timeEntries, entries)
}

// ── Goals ──

function getGoals(): Goal[] {
  return read<Goal>(KEYS.goals)
}

function setGoal(categoryId: string, targetMinutesPerDay: number): Goal {
  const goals = getGoals()
  const idx = goals.findIndex((g) => g.categoryId === categoryId)
  if (idx !== -1) {
    goals[idx].targetMinutesPerDay = targetMinutesPerDay
    write(KEYS.goals, goals)
    return goals[idx]
  }
  const goal: Goal = { id: uuid(), categoryId, targetMinutesPerDay }
  goals.push(goal)
  write(KEYS.goals, goals)
  return goal
}

// ── Task Stats ──

function getTotalTimeByCategory(startDate: string, endDate: string) {
  const tasks = getTasks().filter((t) => t.date >= startDate && t.date <= endDate)
  const entries = getTimeEntries()
  const result: Record<string, number> = {}
  for (const task of tasks) {
    const taskEntries = entries.filter((e) => e.taskId === task.id)
    const total = taskEntries.reduce((sum, e) => sum + e.duration, 0)
    result[task.categoryId] = (result[task.categoryId] || 0) + total
  }
  return result
}

function getTotalTimeByDate(startDate: string, endDate: string) {
  const tasks = getTasks().filter((t) => t.date >= startDate && t.date <= endDate)
  const entries = getTimeEntries()
  const result: Record<string, number> = {}
  for (const task of tasks) {
    const taskEntries = entries.filter((e) => e.taskId === task.id)
    const total = taskEntries.reduce((sum, e) => sum + e.duration, 0)
    result[task.date] = (result[task.date] || 0) + total
  }
  return result
}

// ── Contacts ──

function getContacts(): Contact[] {
  return read<Contact>(KEYS.contacts).sort((a, b) => b.updatedAt - a.updatedAt)
}

function getContactsByStatus(status: ContactStatus): Contact[] {
  return getContacts().filter((c) => c.status === status)
}

function getContact(id: string): Contact | undefined {
  return read<Contact>(KEYS.contacts).find((c) => c.id === id)
}

function createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
  const contacts = read<Contact>(KEYS.contacts)
  const contact: Contact = { ...data, id: uuid(), createdAt: Date.now(), updatedAt: Date.now() }
  contacts.push(contact)
  write(KEYS.contacts, contacts)
  return contact
}

function updateContact(id: string, data: Partial<Contact>): Contact | undefined {
  const contacts = read<Contact>(KEYS.contacts)
  const idx = contacts.findIndex((c) => c.id === id)
  if (idx === -1) return undefined
  contacts[idx] = { ...contacts[idx], ...data, updatedAt: Date.now() }
  write(KEYS.contacts, contacts)
  return contacts[idx]
}

function deleteContact(id: string) {
  const contacts = read<Contact>(KEYS.contacts).filter((c) => c.id !== id)
  write(KEYS.contacts, contacts)
  const interactions = read<Interaction>(KEYS.interactions).filter((i) => i.contactId !== id)
  write(KEYS.interactions, interactions)
}

// ── Interactions ──

function getInteractions(contactId: string): Interaction[] {
  return read<Interaction>(KEYS.interactions)
    .filter((i) => i.contactId === contactId)
    .sort((a, b) => b.date - a.date)
}

function createInteraction(data: Omit<Interaction, 'id'>): Interaction {
  const interactions = read<Interaction>(KEYS.interactions)
  const interaction: Interaction = { ...data, id: uuid() }
  interactions.push(interaction)
  write(KEYS.interactions, interactions)
  return interaction
}

function deleteInteraction(id: string) {
  const interactions = read<Interaction>(KEYS.interactions).filter((i) => i.id !== id)
  write(KEYS.interactions, interactions)
}

// ── Posts ──

function getPosts(): Post[] {
  return read<Post>(KEYS.posts).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function createPost(data: Omit<Post, 'id'>): Post {
  const posts = read<Post>(KEYS.posts)
  const post: Post = { ...data, id: uuid() }
  posts.push(post)
  write(KEYS.posts, posts)
  return post
}

function updatePost(id: string, data: Partial<Post>): Post | undefined {
  const posts = read<Post>(KEYS.posts)
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  posts[idx] = { ...posts[idx], ...data }
  write(KEYS.posts, posts)
  return posts[idx]
}

function deletePost(id: string) {
  const posts = read<Post>(KEYS.posts).filter((p) => p.id !== id)
  write(KEYS.posts, posts)
}

function getPostStats(startDate: string, endDate: string) {
  const posts = getPosts().filter((p) => p.publishedAt >= startDate && p.publishedAt <= endDate)
  const byPlatform: Record<string, { count: number; metrics: PostMetrics }> = {}

  for (const post of posts) {
    if (!byPlatform[post.platform]) {
      byPlatform[post.platform] = {
        count: 0,
        metrics: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0, spend: 0, conversions: 0 },
      }
    }
    const entry = byPlatform[post.platform]
    entry.count++
    for (const key of Object.keys(entry.metrics) as (keyof PostMetrics)[]) {
      entry.metrics[key] += post.metrics[key]
    }
  }

  return { posts, byPlatform, total: posts.length }
}

// ── Vocal Projects ──

function getVocalProjects(): VocalProject[] {
  return read<VocalProject>(KEYS.vocalProjects).sort((a, b) => b.createdAt - a.createdAt)
}

function getVocalProject(id: string): VocalProject | undefined {
  return read<VocalProject>(KEYS.vocalProjects).find((p) => p.id === id)
}

function createVocalProject(data: Omit<VocalProject, 'id' | 'createdAt'>): VocalProject {
  const projects = read<VocalProject>(KEYS.vocalProjects)
  const project: VocalProject = { ...data, id: uuid(), createdAt: Date.now() }
  projects.push(project)
  write(KEYS.vocalProjects, projects)
  return project
}

function updateVocalProject(id: string, data: Partial<VocalProject>): VocalProject | undefined {
  const projects = read<VocalProject>(KEYS.vocalProjects)
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  projects[idx] = { ...projects[idx], ...data }
  write(KEYS.vocalProjects, projects)
  return projects[idx]
}

function deleteVocalProject(id: string) {
  write(KEYS.vocalProjects, read<VocalProject>(KEYS.vocalProjects).filter((p) => p.id !== id))
  write(KEYS.vocalNotes, read<VocalNote>(KEYS.vocalNotes).filter((n) => n.projectId !== id))
  write(KEYS.promptNotes, read<PromptNote>(KEYS.promptNotes).filter((p) => p.projectId !== id))
}

// ── Vocal Notes ──

function getVocalNotes(projectId: string): VocalNote[] {
  return read<VocalNote>(KEYS.vocalNotes)
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

function createVocalNote(data: Omit<VocalNote, 'id' | 'createdAt'>): VocalNote {
  const notes = read<VocalNote>(KEYS.vocalNotes)
  const note: VocalNote = { ...data, id: uuid(), createdAt: Date.now() }
  notes.push(note)
  write(KEYS.vocalNotes, notes)
  return note
}

function updateVocalNote(id: string, data: Partial<Omit<VocalNote, 'id' | 'createdAt'>>): VocalNote | undefined {
  const notes = read<VocalNote>(KEYS.vocalNotes)
  const idx = notes.findIndex((n) => n.id === id)
  if (idx === -1) return undefined
  notes[idx] = { ...notes[idx], ...data }
  write(KEYS.vocalNotes, notes)
  return notes[idx]
}

function deleteVocalNote(id: string) {
  write(KEYS.vocalNotes, read<VocalNote>(KEYS.vocalNotes).filter((n) => n.id !== id))
}

// ── Prompt Notes ──

function getPromptNotes(projectId: string): PromptNote[] {
  return read<PromptNote>(KEYS.promptNotes)
    .filter((p) => p.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

function getLatestPrompt(projectId: string): PromptNote | undefined {
  return getPromptNotes(projectId)[0]
}

function createPromptNote(data: Omit<PromptNote, 'id' | 'createdAt' | 'updatedAt'>): PromptNote {
  const prompts = read<PromptNote>(KEYS.promptNotes)
  const prompt: PromptNote = { ...data, id: uuid(), createdAt: Date.now(), updatedAt: Date.now() }
  prompts.push(prompt)
  write(KEYS.promptNotes, prompts)
  return prompt
}

function updatePromptNote(id: string, data: Partial<PromptNote>): PromptNote | undefined {
  const prompts = read<PromptNote>(KEYS.promptNotes)
  const idx = prompts.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  prompts[idx] = { ...prompts[idx], ...data, updatedAt: Date.now() }
  write(KEYS.promptNotes, prompts)
  return prompts[idx]
}

function markPromptUsed(id: string) {
  return updatePromptNote(id, { used: true })
}

// ── Pipeline stats ──

function getPipelineStats() {
  const contacts = getContacts()
  return {
    prospect: contacts.filter((c) => c.status === 'prospect').length,
    contacted: contacts.filter((c) => c.status === 'contacted').length,
    interested: contacts.filter((c) => c.status === 'interested').length,
    client: contacts.filter((c) => c.status === 'client').length,
    inactive: contacts.filter((c) => c.status === 'inactive').length,
    total: contacts.length,
  }
}

// ── Projects ──

function getProjects(): Project[] {
  return read<Project>(KEYS.projects).sort((a, b) => b.updatedAt - a.updatedAt)
}

function getProjectsByStatus(status: ProjectStatus): Project[] {
  return getProjects().filter((p) => p.status === status)
}

function getProject(id: string): Project | undefined {
  return read<Project>(KEYS.projects).find((p) => p.id === id)
}

type ProjectCreateData = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'linkedTaskIds' | 'linkedContactIds' | 'linkedPostIds' | 'revenue' | 'collaborators'> & {
  linkedTaskIds?: string[]
  linkedContactIds?: string[]
  linkedPostIds?: string[]
  revenue?: number
  collaborators?: string[]
}

function createProject(data: ProjectCreateData): Project {
  const projects = read<Project>(KEYS.projects)
  const project: Project = {
    ...data,
    linkedTaskIds: data.linkedTaskIds ?? [],
    linkedContactIds: data.linkedContactIds ?? [],
    linkedPostIds: data.linkedPostIds ?? [],
    revenue: data.revenue ?? 0,
    collaborators: data.collaborators ?? [],
    id: uuid(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  projects.push(project)
  write(KEYS.projects, projects)
  return project
}

function updateProject(id: string, data: Partial<Project>): Project | undefined {
  const projects = read<Project>(KEYS.projects)
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  projects[idx] = { ...projects[idx], ...data, updatedAt: Date.now() }
  write(KEYS.projects, projects)
  return projects[idx]
}

function deleteProject(id: string) {
  write(KEYS.projects, read<Project>(KEYS.projects).filter((p) => p.id !== id))
  write(KEYS.projectNotes, read<ProjectNote>(KEYS.projectNotes).filter((n) => n.projectId !== id))
}

// ── Project Notes (notebook) ──

function getProjectNotes(projectId: string): ProjectNote[] {
  return read<ProjectNote>(KEYS.projectNotes)
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => a.order - b.order)
}

function getProjectNote(id: string): ProjectNote | undefined {
  return read<ProjectNote>(KEYS.projectNotes).find((n) => n.id === id)
}

function createProjectNote(data: Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>): ProjectNote {
  const notes = read<ProjectNote>(KEYS.projectNotes)
  const note: ProjectNote = { ...data, id: uuid(), createdAt: Date.now(), updatedAt: Date.now() }
  notes.push(note)
  write(KEYS.projectNotes, notes)
  return note
}

function updateProjectNote(id: string, data: Partial<Omit<ProjectNote, 'id'>>): ProjectNote | undefined {
  const notes = read<ProjectNote>(KEYS.projectNotes)
  const idx = notes.findIndex((n) => n.id === id)
  if (idx === -1) return undefined
  notes[idx] = { ...notes[idx], ...data, updatedAt: Date.now() }
  write(KEYS.projectNotes, notes)
  return notes[idx]
}

function deleteProjectNote(id: string) {
  // Also delete child notes
  const notes = read<ProjectNote>(KEYS.projectNotes)
  const toDelete = new Set([id])
  const findChildren = (parentId: string) => {
    for (const n of notes) {
      if (n.parentId === parentId) {
        toDelete.add(n.id)
        findChildren(n.id)
      }
    }
  }
  findChildren(id)
  write(KEYS.projectNotes, notes.filter((n) => !toDelete.has(n.id)))
}

// ── Project Stats ──

function getProjectStats(projectId: string) {
  const project = getProject(projectId)
  if (!project) return null

  const linkedTaskIds = project.linkedTaskIds || []
  const linkedContactIds = project.linkedContactIds || []
  const linkedPostIds = project.linkedPostIds || []

  const allTasks = getTasks()
  const linkedTasks = allTasks.filter((t) => linkedTaskIds.includes(t.id))
  const entries = getTimeEntries()
  const taskEntries = entries.filter((e) => linkedTaskIds.includes(e.taskId))
  const totalTime = taskEntries.reduce((sum, e) => sum + e.duration, 0)

  const allPosts = getPosts()
  const linkedPosts = allPosts.filter((p) => linkedPostIds.includes(p.id))
  const totalSpend = linkedPosts.reduce((sum, p) => sum + p.metrics.spend, 0)
  const totalImpressions = linkedPosts.reduce((sum, p) => sum + p.metrics.impressions, 0)
  const totalClicks = linkedPosts.reduce((sum, p) => sum + p.metrics.clicks, 0)
  const totalConversions = linkedPosts.reduce((sum, p) => sum + p.metrics.conversions, 0)

  const allContacts = read<Contact>(KEYS.contacts)
  const linkedContacts = allContacts.filter((c) => linkedContactIds.includes(c.id))

  return {
    totalTime,
    tasksCount: linkedTasks.length,
    tasksDone: linkedTasks.filter((t) => t.status === 'done').length,
    contactsCount: linkedContacts.length,
    postsCount: linkedPosts.length,
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    revenue: project.revenue || 0,
    collaborators: project.collaborators || [],
  }
}

// ── Todos ──

function getTodos(): TodoItem[] {
  return read<TodoItem>(KEYS.todos).sort((a, b) => {
    // Undone first, then by priority (high > medium > low), then by creation date
    if (a.done !== b.done) return a.done ? 1 : -1
    const prio = { high: 0, medium: 1, low: 2 }
    if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority]
    return b.createdAt - a.createdAt
  })
}

function getTodosByDate(date: string | null): TodoItem[] {
  return getTodos().filter((t) => t.date === date)
}

function createTodo(data: Omit<TodoItem, 'id' | 'createdAt'>): TodoItem {
  const todos = read<TodoItem>(KEYS.todos)
  const todo: TodoItem = { ...data, id: uuid(), createdAt: Date.now() }
  todos.push(todo)
  write(KEYS.todos, todos)
  return todo
}

function updateTodo(id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>): TodoItem | null {
  const todos = read<TodoItem>(KEYS.todos)
  const idx = todos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  todos[idx] = { ...todos[idx], ...updates }
  write(KEYS.todos, todos)
  // Sync linked task if todo was just done
  if (updates.done === true && todos[idx].linkedTaskId) {
    const tasks = getTasks()
    const taskIdx = tasks.findIndex((t) => t.id === todos[idx].linkedTaskId)
    if (taskIdx !== -1 && tasks[taskIdx].status !== 'done') {
      tasks[taskIdx] = { ...tasks[taskIdx], status: 'done' }
      write(KEYS.tasks, tasks)
    }
  }
  return todos[idx]
}

/**
 * Create a calendar task and OPTIONALLY a linked todo automatically.
 * Per user requirement: agenda → todo automatique (mais pas obligatoire).
 */
function createTaskWithTodo(task: Omit<Task, 'id'>, autoCreateTodo: boolean): Task {
  const newTask = createTask(task)
  if (autoCreateTodo) {
    const todo = createTodo({
      title: task.title,
      done: task.status === 'done',
      date: task.date,
      priority: 'medium',
      projectId: task.projectId,
      linkedTaskId: newTask.id,
    })
    // Update task with linkedTodoId
    updateTask(newTask.id, { linkedTodoId: todo.id })
    return { ...newTask, linkedTodoId: todo.id }
  }
  return newTask
}

function deleteTodo(id: string) {
  write(KEYS.todos, read<TodoItem>(KEYS.todos).filter((t) => t.id !== id))
}

// ── Settings ──

function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem('bloom_settings')
    if (!stored) return DEFAULT_SETTINGS
    const parsed = JSON.parse(stored)
    // Deep merge to preserve nested defaults
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
      voice: { ...DEFAULT_SETTINGS.voice, ...parsed.voice },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      integrations: parsed.integrations ?? DEFAULT_SETTINGS.integrations,
      font: parsed.font ?? DEFAULT_SETTINGS.font,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem('bloom_settings', JSON.stringify(settings))
  // Fire-and-forget cloud sync
  if (typeof window !== 'undefined') {
    import('./cloud-sync').then((sync) => {
      if (!sync.isCloudSyncReady()) return
      sync.queueSettingsSync(settings)
    }).catch(() => {/* ignore */})
  }
}

function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...updates }
  saveSettings(updated)
  return updated
}

function clearAllData() {
  const keys = Object.values(KEYS)
  for (const key of keys) {
    localStorage.removeItem(key)
  }
  localStorage.removeItem('bloom_settings')
  localStorage.removeItem('bloom_timer_state')
}

function getStorageSize(): { used: string; items: number } {
  let total = 0
  let items = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('bloom_')) {
      const value = localStorage.getItem(key) || ''
      total += key.length + value.length
      items++
    }
  }
  const kb = (total * 2) / 1024
  return { used: kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`, items }
}

// ── Custom statuses (defaults + user-added) ──
function getEffectiveProjectStatuses() {
  const settings = getSettings()
  const custom = settings.customProjectStatuses || []
  // Project statuses: 'idea' | 'in_progress' | 'done' | 'archived' (the type union remains, custom statuses widen it via cast)
  return [
    { value: 'idea', label: 'Idée', color: '#6B7280' },
    { value: 'in_progress', label: 'En cours', color: '#3B82F6' },
    { value: 'done', label: 'Terminé', color: '#10B981' },
    { value: 'archived', label: 'Archivé', color: '#9CA3AF' },
    ...custom,
  ]
}

function getEffectiveContactStatuses() {
  const settings = getSettings()
  const custom = settings.customContactStatuses || []
  return [
    { value: 'prospect', label: 'Prospect', color: '#6B7280' },
    { value: 'contacted', label: 'Contacté', color: '#3B82F6' },
    { value: 'interested', label: 'Intéressé', color: '#F59E0B' },
    { value: 'client', label: 'Client', color: '#10B981' },
    { value: 'inactive', label: 'Inactif', color: '#EF4444' },
    ...custom,
  ]
}

// ── Tag aggregation across all entities ──
function getAllTags(): string[] {
  const set = new Set<string>()
  for (const t of read<{ tags?: string[] }>(KEYS.tasks)) t.tags?.forEach((tag) => set.add(tag))
  for (const c of read<{ tags?: string[] }>(KEYS.contacts)) c.tags?.forEach((tag) => set.add(tag))
  for (const p of read<{ tags?: string[] }>(KEYS.posts)) p.tags?.forEach((tag) => set.add(tag))
  for (const p of read<{ tags?: string[] }>(KEYS.projects)) p.tags?.forEach((tag) => set.add(tag))
  return Array.from(set).sort()
}

export const store = {
  getTasks, getTasksByDate, getTask, createTask, createTaskWithTodo, updateTask, deleteTask,
  getCategories, createCategory, updateCategory, deleteCategory,
  getTimeEntries, getTimeEntriesByTask, getTimeEntriesByDate, createTimeEntry, updateTimeEntry,
  getGoals, setGoal,
  getTotalTimeByCategory, getTotalTimeByDate,
  getContacts, getContactsByStatus, getContact, createContact, updateContact, deleteContact,
  getInteractions, createInteraction, deleteInteraction,
  getPosts, createPost, updatePost, deletePost, getPostStats,
  getVocalProjects, getVocalProject, createVocalProject, updateVocalProject, deleteVocalProject,
  getVocalNotes, createVocalNote, updateVocalNote, deleteVocalNote,
  getPromptNotes, getLatestPrompt, createPromptNote, updatePromptNote, markPromptUsed,
  getProjects, getProjectsByStatus, getProject, createProject, updateProject, deleteProject,
  getProjectNotes, getProjectNote, createProjectNote, updateProjectNote, deleteProjectNote,
  getProjectStats,
  getPipelineStats,
  getTodos, getTodosByDate, createTodo, updateTodo, deleteTodo,
  getSettings, saveSettings, updateSettings,
  getAllTags, getEffectiveProjectStatuses, getEffectiveContactStatuses,
  clearAllData, getStorageSize,
}
