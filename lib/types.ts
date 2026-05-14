// ── AI Identity ──

export const AI_NAME = 'Iris'

// ── TaskFlow types ──

export type Category = {
  id: string
  name: string
  color: string
}

export type Task = {
  id: string
  title: string
  description: string
  categoryId: string
  tags: string[]
  date: string
  startTime: string
  endTime: string
  status: 'planned' | 'in_progress' | 'done'
  projectId?: string
  linkedTodoId?: string
}

export type TimeEntry = {
  id: string
  taskId: string
  startedAt: number
  endedAt: number | null
  duration: number
  mode: 'stopwatch' | 'countdown'
  countdownDuration?: number
}

export type Goal = {
  id: string
  categoryId: string
  targetMinutesPerDay: number
}

export type TimerState = {
  isRunning: boolean
  mode: 'stopwatch' | 'countdown'
  elapsed: number
  countdownDuration: number
  taskId: string | null
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-recherche', name: 'Recherche', color: '#3B82F6' },
  { id: 'cat-dev', name: 'Développement', color: '#10B981' },
  { id: 'cat-admin', name: 'Admin', color: '#F59E0B' },
  { id: 'cat-creatif', name: 'Créatif', color: '#8B5CF6' },
  { id: 'cat-perso', name: 'Perso', color: '#EC4899' },
]

// ── Todo types ──

export type TodoPriority = 'low' | 'medium' | 'high'

export type TodoItem = {
  id: string
  title: string
  done: boolean
  date: string | null   // null = "plus tard" / non programmé
  priority: TodoPriority
  createdAt: number
  projectId?: string
  linkedTaskId?: string
}

export const TODO_PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Haute', color: '#EF4444' },
  { value: 'medium', label: 'Moyenne', color: '#F59E0B' },
  { value: 'low', label: 'Basse', color: '#6B7280' },
]

// ── CRM types ──

export type ContactStatus = 'prospect' | 'contacted' | 'interested' | 'client' | 'inactive' | (string & {})

export type Channel = 'instagram_dm' | 'whatsapp' | 'email' | 'phone' | 'sms' | 'other'

export type Contact = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  instagram: string
  status: ContactStatus
  source: string
  notes: string
  tags: string[]
  categoryId?: string
  createdAt: number
  updatedAt: number
}

export type Interaction = {
  id: string
  contactId: string
  channel: Channel
  direction: 'outbound' | 'inbound'
  summary: string
  date: number
}

export type Platform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'linkedin' | 'other'

export type Post = {
  id: string
  platform: Platform
  type: 'organic' | 'paid'
  title: string
  content: string
  publishedAt: string
  metrics: PostMetrics
  tags: string[]
  categoryId?: string
  projectId?: string
}

export type PostMetrics = {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  clicks: number
  spend: number
  conversions: number
}

export type VocalProject = {
  id: string
  name: string
  description: string
  keywords: string[]
  createdAt: number
}

export type VocalNote = {
  id: string
  projectId: string
  transcript: string
  linkedProjectId?: string
  linkedContactId?: string
  createdAt: number
}

export type PromptNote = {
  id: string
  projectId: string
  vocalNoteIds: string[]
  content: string
  used: boolean
  createdAt: number
  updatedAt: number
}

export const CONTACT_STATUSES: { value: ContactStatus; label: string; color: string }[] = [
  { value: 'prospect', label: 'Prospect', color: '#6B7280' },
  { value: 'contacted', label: 'Contacté', color: '#3B82F6' },
  { value: 'interested', label: 'Intéressé', color: '#F59E0B' },
  { value: 'client', label: 'Client', color: '#10B981' },
  { value: 'inactive', label: 'Inactif', color: '#EF4444' },
]

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'sms', label: 'SMS' },
  { value: 'other', label: 'Autre' },
]

export type ProjectStatus = 'idea' | 'in_progress' | 'done' | 'archived' | (string & {})

export type ProjectRevenueType = 'one-time' | 'monthly' | 'quarterly' | 'annual'

export type Project = {
  id: string
  name: string
  description: string
  status: ProjectStatus
  tags: string[]
  linkedTaskIds: string[]
  linkedContactIds: string[]
  linkedPostIds: string[]
  revenue: number
  /** When revenueType is recurring (monthly/quarterly/annual), `revenue` represents the recurring amount */
  revenueType?: ProjectRevenueType
  /** Stripe product IDs whose charges should be counted as this project's revenue */
  stripeProductIds?: string[]
  /** Stripe customer IDs whose charges should be counted as this project's revenue */
  stripeCustomerIds?: string[]
  collaborators: string[]
  categoryId?: string
  color?: string
  createdAt: number
  updatedAt: number
}

export type ProjectNote = {
  id: string
  projectId: string
  parentId: string | null
  title: string
  content: string
  order: number
  createdAt: number
  updatedAt: number
}

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'idea', label: 'Idée', color: '#8B5CF6' },
  { value: 'in_progress', label: 'En cours', color: '#F59E0B' },
  { value: 'done', label: 'Terminé', color: '#10B981' },
  { value: 'archived', label: 'Archivé', color: '#6B7280' },
]

export const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'instagram', label: 'Instagram', color: '#E1306C' },
  { value: 'tiktok', label: 'TikTok', color: '#000000' },
  { value: 'facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'youtube', label: 'YouTube', color: '#FF0000' },
  { value: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { value: 'other', label: 'Autre', color: '#6B7280' },
]

// ── Settings types ──

export type IntegrationStatus = 'connected' | 'disconnected' | 'error'

export type Integration = {
  id: string
  name: string
  provider: string
  status: IntegrationStatus
  apiKey?: string
  lastSync?: number
  config?: Record<string, unknown>
}

export type AIModel = 'claude-sonnet-4-5-20250514' | 'claude-sonnet-4-20250514' | 'claude-haiku-4-20250414' | 'gpt-4o' | 'gpt-4o-mini' | 'gemini-2.5-flash' | 'gemini-2.5-pro'

export type AISettings = {
  model: AIModel
  temperature: number
  maxTokens: number
  systemPromptExtra: string
  autoSuggest: boolean
  language: 'fr' | 'en'
  assistantName: string
}

export type VoiceSettings = {
  autoTranscribe: boolean
  language: string
  quality: 'low' | 'medium' | 'high'
}

export type NotificationSettings = {
  timerEnd: boolean
  dailyDigest: boolean
  taskReminders: boolean
  sound: boolean
  digestTime: string
}

export type FontChoice = 'montserrat' | 'playfair' | 'inter'

export type CustomStatus = { value: string; label: string; color: string }

export type AppSettings = {
  integrations: Integration[]
  ai: AISettings
  voice: VoiceSettings
  notifications: NotificationSettings
  theme: 'light' | 'dark' | 'system'
  font: FontChoice
  weekStartsOn: 0 | 1
  defaultView: 'jour' | 'semaine' | 'mois'
  customProjectStatuses?: CustomStatus[]
  customContactStatuses?: CustomStatus[]
}

export const FONT_OPTIONS: { value: FontChoice; label: string; description: string; cssVar: string }[] = [
  { value: 'montserrat', label: 'Montserrat', description: 'Géométrique et moderne', cssVar: 'var(--font-montserrat)' },
  { value: 'playfair', label: 'Playfair Display', description: 'Serif élégant', cssVar: 'var(--font-playfair)' },
  { value: 'inter', label: 'Inter', description: 'Sans-serif lisible', cssVar: 'var(--font-inter)' },
]

export const DEFAULT_SETTINGS: AppSettings = {
  integrations: [],
  ai: {
    model: 'claude-sonnet-4-5-20250514',
    temperature: 0.7,
    maxTokens: 2048,
    systemPromptExtra: '',
    autoSuggest: false,
    language: 'fr',
    assistantName: 'Iris',
  },
  voice: {
    autoTranscribe: true,
    language: 'fr-FR',
    quality: 'high',
  },
  notifications: {
    timerEnd: true,
    dailyDigest: false,
    taskReminders: true,
    sound: true,
    digestTime: '08:00',
  },
  theme: 'light',
  font: 'montserrat',
  weekStartsOn: 1,
  defaultView: 'jour',
}

export const AI_MODELS: { value: AIModel; label: string; provider: string; description: string }[] = [
  { value: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5', provider: 'Anthropic', description: 'Meilleur rapport qualite/performance' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Rapide et capable' },
  { value: 'claude-haiku-4-20250414', label: 'Claude Haiku 4', provider: 'Anthropic', description: 'Le plus rapide, taches simples' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', description: 'Modele phare OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', description: 'Rapide et economique' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google', description: 'Rapide et polyvalent' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', description: 'Plus performant, raisonnement avance' },
]

export const INTEGRATION_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', icon: 'brain', category: 'ai', description: 'Assistant IA principal pour le chat et l\'analyse' },
  { id: 'openai', name: 'OpenAI (GPT)', icon: 'sparkle', category: 'ai', description: 'Modeles GPT alternatifs' },
  { id: 'google', name: 'Google (Gemini)', icon: 'gemini', category: 'ai', description: 'Modeles Gemini de Google' },
  { id: 'whoop', name: 'Whoop', icon: 'heart', category: 'health', description: 'Recovery, sommeil et strain quotidien' },
  { id: 'google_calendar', name: 'Google Calendar', icon: 'calendar', category: 'productivity', description: 'Synchroniser tes événements de calendrier' },
  { id: 'notion', name: 'Notion', icon: 'doc', category: 'productivity', description: 'Importer/exporter des notes' },
  { id: 'stripe', name: 'Stripe', icon: 'card', category: 'finance', description: 'Synchroniser les revenus de tes projets' },
  { id: 'youtube', name: 'YouTube', icon: 'youtube', category: 'social', description: 'Synchroniser vues, likes, commentaires de tes vidéos' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', category: 'social', description: 'Publier et planifier des posts depuis ton profil personnel' },
] as const
