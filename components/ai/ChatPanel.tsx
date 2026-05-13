'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { store } from '@/lib/store'
import { AI_NAME } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Message = {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

export function ChatPanel() {
  const app = useApp()

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Salut ! Je suis ${AI_NAME}. Je peux t'aider a gerer tes taches, contacts, projets, todos, posts marketing et plus encore.` },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const currentSettings = store.getSettings()
      const anthropicIntegration = currentSettings.integrations.find((i) => i.provider === 'anthropic')
      const openaiIntegration = currentSettings.integrations.find((i) => i.provider === 'openai')
      const googleIntegration = currentSettings.integrations.find((i) => i.provider === 'google')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter((m) => !m.isError), { role: 'user', content: userMsg }],
          context: {
            selectedDate: app.selectedDate,
            tasks: app.tasks.filter((t) => t.date === app.selectedDate),
            allTasks: app.tasks.slice(0, 50),
            categories: app.categories,
            todos: app.todos.slice(0, 30),
            contacts: app.contacts.slice(0, 30).map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, status: c.status, tags: c.tags })),
            projects: app.projects.slice(0, 20).map((p) => ({ id: p.id, name: p.name, status: p.status })),
            posts: app.posts.slice(0, 20).map((p) => ({ id: p.id, title: p.title, platform: p.platform, type: p.type })),
          },
          settings: {
            model: currentSettings.ai.model,
            maxTokens: currentSettings.ai.maxTokens,
            temperature: currentSettings.ai.temperature,
            language: currentSettings.ai.language,
            systemPromptExtra: currentSettings.ai.systemPromptExtra,
            assistantName: AI_NAME,
            apiKey: anthropicIntegration?.apiKey,
            openaiApiKey: openaiIntegration?.apiKey,
            googleApiKey: googleIntegration?.apiKey,
          },
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: '__KEY_MISSING__',
            isError: true,
          }])
        } else {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: 'Une erreur est survenue. Réessaie dans quelques instants.',
            isError: true,
          }])
        }
        return
      }

      const data = await res.json()

      // Handle task creation
      if (data.tasks) {
        for (const t of data.tasks) {
          app.createTask({
            title: t.title,
            description: t.description || '',
            categoryId: t.categoryId || app.categories[0]?.id || '',
            tags: t.tags || [],
            date: t.date || app.selectedDate,
            startTime: t.startTime || '09:00',
            endTime: t.endTime || '10:00',
            status: 'planned',
          })
        }
      }

      // Handle todo creation
      if (data.todos) {
        for (const td of data.todos) {
          app.createTodo({
            title: td.title,
            done: false,
            date: td.date || null,
            priority: td.priority || 'medium',
          })
        }
      }

      // Handle contact creation
      if (data.contacts) {
        for (const c of data.contacts) {
          app.createContact({
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            phone: c.phone || '',
            email: c.email || '',
            instagram: c.instagram || '',
            status: c.status || 'prospect',
            source: c.source || '',
            notes: c.notes || '',
            tags: c.tags || [],
          })
        }
      }

      // Handle project creation
      if (data.projects) {
        for (const p of data.projects) {
          app.createProject({
            name: p.name,
            description: p.description || '',
            status: p.status || 'idea',
            tags: p.tags || [],
            linkedTaskIds: p.linkedTaskIds || [],
            linkedContactIds: p.linkedContactIds || [],
            linkedPostIds: p.linkedPostIds || [],
            revenue: p.revenue || 0,
            collaborators: p.collaborators || [],
          })
        }
      }

      // Handle post creation
      if (data.posts) {
        for (const p of data.posts) {
          app.createPost({
            platform: p.platform || 'instagram',
            type: p.type || 'organic',
            title: p.title,
            content: p.content || '',
            publishedAt: p.publishedAt || app.selectedDate,
            metrics: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0, spend: 0, conversions: 0, ...p.metrics },
            tags: p.tags || [],
          })
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur de connexion. Vérifie que le serveur est lancé.', isError: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-80 flex-col border-l border-border bg-muted/30 gradient-mesh">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">{AI_NAME}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => app.setChatOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.content === '__KEY_MISSING__' ? (
              <div className="mr-8 rounded-lg bg-background border border-border p-3 space-y-2">
                <p className="text-sm">Clé API manquante.</p>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Aller dans les paramètres
                  </Button>
                </Link>
              </div>
            ) : (
              <div
                className={`text-sm ${
                  msg.role === 'user'
                    ? 'ml-8 rounded-lg bg-primary text-primary-foreground p-2.5'
                    : 'mr-8 rounded-lg bg-background border border-border p-2.5'
                }`}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="mr-8 rounded-lg bg-background border border-border p-2.5 text-sm text-muted-foreground">
            Réflexion...
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {/* Auto-suggest quick actions */}
        {(() => {
          const currentSettings = store.getSettings()
          if (!currentSettings.ai.autoSuggest || messages.length > 3) return null
          const todayStr = app.selectedDate
          const todayTasks = app.tasks.filter((t) => t.date === todayStr)
          const pendingTodos = app.todos.filter((t) => !t.done).length
          const suggestions: { label: string; prompt: string }[] = []
          if (todayTasks.length === 0) {
            suggestions.push({ label: 'Planifier ma journée', prompt: 'Aide-moi à planifier ma journée.' })
          }
          if (todayTasks.filter((t) => t.status === 'done').length === todayTasks.length && todayTasks.length > 0) {
            suggestions.push({ label: 'Bilan du jour', prompt: 'Fais le bilan de ma journée.' })
          }
          if (pendingTodos > 3) {
            suggestions.push({ label: `Prioriser mes ${pendingTodos} to-dos`, prompt: `J'ai ${pendingTodos} to-dos en attente, aide-moi à les prioriser.` })
          }
          if (app.contacts.length > 0) {
            suggestions.push({ label: 'Relancer un contact', prompt: 'Quels contacts devrais-je relancer cette semaine ?' })
          }
          if (suggestions.length === 0) return null
          return (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setInput(s.prompt); }}
                  className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )
        })()}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Demande quelque chose..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="text-sm"
          />
          <Button type="submit" size="sm" disabled={loading || !input.trim()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  )
}
