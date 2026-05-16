'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context'
import { cn } from '@/lib/utils'

type Step = 'profile' | 'goals' | 'integrations' | 'first-task'

const STEPS: { id: Step; label: string; num: string }[] = [
  { id: 'profile', label: 'Profil', num: '/01' },
  { id: 'goals', label: 'Objectifs', num: '/02' },
  { id: 'integrations', label: 'Intégrations', num: '/03' },
  { id: 'first-task', label: 'Première tâche', num: '/04' },
]

const GOALS = [
  { id: 'productivity', label: 'Booster ma productivité', icon: '⚡' },
  { id: 'projects', label: 'Suivre mes projets perso', icon: '📦' },
  { id: 'crm', label: 'Gérer mes clients', icon: '👥' },
  { id: 'marketing', label: 'Tracker mes posts & ads', icon: '📊' },
  { id: 'time', label: 'Mesurer mon temps', icon: '⏱' },
  { id: 'revenue', label: 'Suivre mes revenus', icon: '💶' },
]

const INTEGRATIONS = [
  { id: 'gcal', label: 'Google Calendar', hint: 'Synchronise tes événements' },
  { id: 'stripe', label: 'Stripe', hint: 'Tracker revenus auto' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'Stats de tes posts' },
  { id: 'youtube', label: 'YouTube', hint: 'Vues & engagement' },
  { id: 'whoop', label: 'Whoop', hint: 'Sommeil & strain' },
  { id: 'notion', label: 'Notion', hint: 'Documentation projets' },
]

export default function OnboardPage() {
  const router = useRouter()
  const { createTask, categories } = useApp()
  const [step, setStep] = useState<Step>('profile')

  // Profile
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  // Goals
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())

  // Integrations chosen
  const [chosenIntegrations, setChosenIntegrations] = useState<Set<string>>(new Set())

  // First task
  const [taskTitle, setTaskTitle] = useState('')
  const [taskWhen, setTaskWhen] = useState<'now' | 'today' | 'tomorrow'>('today')

  const stepIdx = STEPS.findIndex((s) => s.id === step)
  const isLast = stepIdx === STEPS.length - 1
  const isFirst = stepIdx === 0
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  const next = () => {
    if (isLast) {
      finish()
      return
    }
    setStep(STEPS[stepIdx + 1].id)
  }
  const back = () => {
    if (isFirst) return
    setStep(STEPS[stepIdx - 1].id)
  }

  const toggle = (set: Set<string>, id: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    fn(next)
  }

  const finish = () => {
    // Create the first task if user filled it
    if (taskTitle.trim()) {
      const today = new Date()
      const date = taskWhen === 'tomorrow'
        ? new Date(today.getTime() + 86400000).toISOString().slice(0, 10)
        : today.toISOString().slice(0, 10)
      const startMin = taskWhen === 'now'
        ? Math.floor((today.getHours() * 60 + today.getMinutes()) / 15) * 15
        : 9 * 60
      const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
      createTask({
        title: taskTitle.trim(),
        description: '',
        categoryId: categories[0]?.id || '',
        tags: [],
        date,
        startTime: fmt(startMin),
        endTime: fmt(startMin + 30),
        status: taskWhen === 'now' ? 'in_progress' : 'planned',
      })
    }
    // Persist onboarding completion + chosen prefs in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bloom_onboarded', '1')
      if (name) localStorage.setItem('bloom_user_name', name)
      if (role) localStorage.setItem('bloom_user_role', role)
      if (selectedGoals.size > 0) localStorage.setItem('bloom_user_goals', JSON.stringify([...selectedGoals]))
      if (chosenIntegrations.size > 0) localStorage.setItem('bloom_chosen_integrations', JSON.stringify([...chosenIntegrations]))
    }
    router.push('/')
  }

  return (
    <div className="flex flex-col min-h-screen overflow-auto bg-background">
      <div className="flex-1 flex flex-col items-center px-6 py-10">
        {/* Top progress bar */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span className="font-medium">{STEPS[stepIdx].num} · {STEPS[stepIdx].label}</span>
            <span>{stepIdx + 1} / {STEPS.length}</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="w-full max-w-2xl flex-1">
          {step === 'profile' && (
            <StepShell title="Bienvenue. Comment veux-tu qu'on t'appelle ?" sub="Ces infos restent strictement chez toi.">
              <div className="space-y-5 mt-8">
                <Field label="Prénom">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marc"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-transparent focus:border-foreground focus:outline-none transition-colors text-base"
                  />
                </Field>
                <Field label="Tu fais quoi ?" hint="Optionnel — pour qu'Iris adapte son ton.">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Founder · Freelance · Designer · …"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-transparent focus:border-foreground focus:outline-none transition-colors text-base"
                  />
                </Field>
              </div>
            </StepShell>
          )}

          {step === 'goals' && (
            <StepShell title="Pourquoi tu utilises Bloom ?" sub="Choisis au moins un objectif. On personnalisera le dashboard en conséquence.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {GOALS.map((g) => {
                  const selected = selectedGoals.has(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggle(selectedGoals, g.id, setSelectedGoals)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-4 rounded-2xl border text-left transition-all',
                        selected
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-card border-border hover:border-foreground/40'
                      )}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-sm font-medium">{g.label}</span>
                    </button>
                  )
                })}
              </div>
            </StepShell>
          )}

          {step === 'integrations' && (
            <StepShell title="Connecte tes outils." sub="Choisis ceux que tu utilises. Tu pourras connecter le reste plus tard depuis Paramètres.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {INTEGRATIONS.map((it) => {
                  const selected = chosenIntegrations.has(it.id)
                  return (
                    <button
                      key={it.id}
                      onClick={() => toggle(chosenIntegrations, it.id, setChosenIntegrations)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-4 rounded-2xl border text-left transition-all',
                        selected
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-card border-border hover:border-foreground/40'
                      )}
                    >
                      <span className={cn(
                        'mt-0.5 h-5 w-5 rounded-md border-2 inline-flex items-center justify-center shrink-0 transition-colors',
                        selected ? 'border-background bg-background' : 'border-muted-foreground/50'
                      )}>
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 6.5 5 8.5 9 4" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{it.label}</div>
                        <div className={cn('text-xs mt-0.5', selected ? 'text-background/70' : 'text-muted-foreground')}>
                          {it.hint}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-6 text-center">
                Tu pourras compléter ces intégrations dans Paramètres → Intégrations.
              </p>
            </StepShell>
          )}

          {step === 'first-task' && (
            <StepShell title="On commence par une vraie tâche." sub="Plus rapide que de te promener dans l'app. C'est toi qui choisis.">
              <div className="space-y-5 mt-8">
                <Field label="Que veux-tu accomplir ?">
                  <input
                    autoFocus
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Préparer la prez de jeudi…"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-transparent focus:border-foreground focus:outline-none transition-colors text-base"
                  />
                </Field>
                <Field label="Quand ?">
                  <div className="flex gap-2">
                    {([
                      { v: 'now', l: 'Maintenant' },
                      { v: 'today', l: "Aujourd'hui 9h" },
                      { v: 'tomorrow', l: 'Demain 9h' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setTaskWhen(opt.v)}
                        className={cn(
                          'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          taskWhen === opt.v
                            ? 'bg-foreground text-background'
                            : 'bg-secondary text-foreground hover:bg-secondary/70'
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground mt-8 text-center">
                Tu peux aussi ignorer cette étape — Bloom est prêt sans.
              </p>
            </StepShell>
          )}
        </div>

        {/* Footer nav */}
        <div className="w-full max-w-2xl flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button
            onClick={back}
            disabled={isFirst}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <div className="flex items-center gap-3">
            {!isLast && (
              <button
                onClick={next}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Passer
              </button>
            )}
            <button
              onClick={next}
              className="pill pill-dark text-sm py-3 px-6"
              disabled={step === 'profile' && !name.trim()}
            >
              {isLast ? 'Terminer' : 'Continuer →'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sauter l&apos;onboarding
          </Link>
        </div>
      </div>
    </div>
  )
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="h-section">{title}</h1>
      <p className="text-base text-muted-foreground mt-2">{sub}</p>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  )
}
