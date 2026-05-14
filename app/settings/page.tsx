'use client'

import { useState, useEffect, useCallback } from 'react'
import { store } from '@/lib/store'
import { getSyncStatus, subscribeSyncStatus, refreshFromCloudWithStatus, flushPending } from '@/lib/cloud-sync'
import { formatRelative } from '@/lib/date-utils'
import { applyTheme } from '@/components/ThemeProvider'
import { DEFAULT_SETTINGS, AI_MODELS, INTEGRATION_PROVIDERS, AI_NAME } from '@/lib/types'
import type { AppSettings, Integration, AIModel, IntegrationStatus, Category } from '@/lib/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// ── Settings sections ──
const SECTIONS = [
  { id: 'integrations', label: 'Intégrations', icon: <PlugIcon /> },
  { id: 'ai', label: 'IA & Modèles', icon: <BrainIcon /> },
  { id: 'voice', label: 'Voix & Audio', icon: <MicIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  { id: 'appearance', label: 'Personnalisation', icon: <PaletteIcon /> },
  { id: 'general', label: 'Général', icon: <SlidersIcon /> },
  { id: 'data', label: 'Données', icon: <DatabaseIcon /> },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [activeSection, setActiveSection] = useState<SectionId>('integrations')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(store.getSettings())
  }, [])

  const save = useCallback((updated: AppSettings) => {
    setSettings(updated)
    store.saveSettings(updated)
    applyTheme() // Apply theme changes immediately
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const updateField = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value }
    save(updated)
  }, [settings, save])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings sidebar */}
      <div className="w-52 shrink-0 border-r border-border bg-muted/30 p-3 flex flex-col gap-1">
        <h2 className="text-sm font-semibold px-2 py-2 text-foreground">Paramètres</h2>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left w-full',
              activeSection === s.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="shrink-0 [&_svg]:w-4 [&_svg]:h-4">{s.icon}</span>
            {s.label}
          </button>
        ))}

        {/* Save indicator */}
        <div className="mt-auto px-2 py-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Enregistré
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {activeSection === 'integrations' && (
            <IntegrationsSection settings={settings} onUpdate={(integrations) => updateField('integrations', integrations)} />
          )}
          {activeSection === 'ai' && (
            <AISection settings={settings} onUpdate={(ai) => updateField('ai', ai)} />
          )}
          {activeSection === 'voice' && (
            <VoiceSection settings={settings} onUpdate={(voice) => updateField('voice', voice)} />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection settings={settings} onUpdate={(notif) => updateField('notifications', notif)} />
          )}
          {activeSection === 'appearance' && (
            <AppearanceSection settings={settings} onSave={save} />
          )}
          {activeSection === 'general' && (
            <GeneralSection settings={settings} onSave={save} />
          )}
          {activeSection === 'data' && (
            <DataSection />
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// INTEGRATIONS SECTION
// ════════════════════════════════════════════

function IntegrationsSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (i: Integration[]) => void }) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')
  // OAuth providers store their tokens in Supabase, not in localStorage settings.
  // Fetch the list of connected social/OAuth platforms (with potentially multiple accounts each) on mount.
  type OAuthAccount = { id: string; providerAccountId: string; metadata: Record<string, unknown> }
  const [oauthAccounts, setOauthAccounts] = useState<Record<string, OAuthAccount[]>>({})

  const refreshOAuth = useCallback(async () => {
    const platforms = ['youtube', 'linkedin', 'google_calendar'] as const
    const endpoints: Record<typeof platforms[number], string> = {
      youtube: '/api/youtube',
      linkedin: '/api/linkedin',
      google_calendar: '/api/google-calendar',
    }
    const result: Record<string, OAuthAccount[]> = {}
    await Promise.all(platforms.map(async (p) => {
      try {
        const res = await fetch(endpoints[p])
        if (!res.ok) return
        const data = await res.json()
        if (data.connected) {
          // Multi-account providers return `accounts: [...]`; google_calendar still returns single token
          if (Array.isArray(data.accounts)) {
            result[p] = data.accounts as OAuthAccount[]
          } else {
            result[p] = [{ id: 'legacy', providerAccountId: 'legacy', metadata: data.account || {} }]
          }
        }
      } catch {/* ignore */}
    }))
    setOauthAccounts(result)
  }, [])

  useEffect(() => {
    refreshOAuth()
    // Re-check when URL has a connection callback param
    const params = new URLSearchParams(window.location.search)
    if (params.has('youtube') || params.has('linkedin') || params.has('google_calendar')) {
      setTimeout(() => window.location.reload(), 200)
    }
  }, [refreshOAuth])

  const handleOAuthDisconnect = async (providerId: string, accountId?: string) => {
    const base = providerId === 'google_calendar' ? '/api/google-calendar' : `/api/${providerId}`
    const url = accountId && accountId !== 'legacy' ? `${base}?accountId=${encodeURIComponent(accountId)}` : base
    await fetch(url, { method: 'DELETE' })
    refreshOAuth()
  }

  const getIntegration = (providerId: string) => settings.integrations.find((i) => i.provider === providerId)

  const connectProvider = (providerId: string, apiKey: string) => {
    const existing = settings.integrations.filter((i) => i.provider !== providerId)
    const provider = INTEGRATION_PROVIDERS.find((p) => p.id === providerId)
    const integration: Integration = {
      id: providerId,
      name: provider?.name || providerId,
      provider: providerId,
      status: 'connected' as IntegrationStatus,
      apiKey,
      lastSync: Date.now(),
    }
    onUpdate([...existing, integration])
    setEditingKey(null)
    setKeyInput('')
  }

  const disconnectProvider = (providerId: string) => {
    onUpdate(settings.integrations.filter((i) => i.provider !== providerId))
  }

  const testConnection = async (providerId: string) => {
    const integration = getIntegration(providerId)
    if (!integration?.apiKey) return

    const markResult = (status: IntegrationStatus) => {
      const updated = settings.integrations.map((i) =>
        i.provider === providerId ? { ...i, status, lastSync: Date.now() } : i
      )
      onUpdate(updated)
    }

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, apiKey: integration.apiKey }),
      })
      const data = await res.json()
      markResult(data.ok ? 'connected' : 'error')
    } catch {
      markResult('error')
    }
  }

  const categories = [
    { id: 'ai', label: 'Intelligence Artificielle', description: 'Fournisseurs de modèles IA pour le chat et l\'analyse' },
    { id: 'social', label: 'Réseaux sociaux', description: 'YouTube, Meta, TikTok, LinkedIn — sync auto des stats et ad spend' },
    { id: 'finance', label: 'Finance', description: 'Stripe et paiements' },
    { id: 'productivity', label: 'Productivité', description: 'Calendrier, notes et outils de travail' },
    { id: 'health', label: 'Santé & Bien-être', description: 'Données de recovery, sommeil et activité physique' },
  ]

  return (
    <>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold">Intégrations</h3>
          <p className="text-sm text-muted-foreground mt-1">Connectez vos services pour enrichir Bloom</p>
        </div>
        <a
          href="/integrations-guide"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2.5a1 1 0 0 1 1-1h5L11.5 4v7.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.5Z" />
            <path d="M9 1.5V4h2.5" />
            <path d="M5 6h4M5 8h4M5 10h3" />
          </svg>
          Guide d&apos;intégration pas à pas
        </a>
      </div>

      {categories.map((cat) => {
        const providers = INTEGRATION_PROVIDERS.filter((p) => p.category === cat.id)
        if (providers.length === 0) return null
        return (
          <div key={cat.id} className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">{cat.label}</h4>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </div>

            {providers.map((provider) => {
              const integration = getIntegration(provider.id)
              const isOAuth = provider.category === 'social' || provider.id === 'google_calendar'
              const accounts = oauthAccounts[provider.id] || []
              const isOAuthConnected = isOAuth && accounts.length > 0
              const isConnected = isOAuthConnected || integration?.status === 'connected'
              const isError = integration?.status === 'error'
              const isEditing = editingKey === provider.id

              const oauthHref = provider.id === 'google_calendar' ? '/api/auth/google' : `/api/auth/${provider.id}`

              const accountLabel = (acc: { metadata: Record<string, unknown> }) => {
                const m = acc.metadata
                return (m.channelTitle || m.username || m.userName || m.name || m.igUsername ||
                  (m.user as { display_name?: string })?.display_name || 'Compte connecté') as string
              }

              return (
                <Card key={provider.id} className={cn(isConnected && 'border-green-300/40 bg-green-50/20 dark:bg-green-950/10')}>
                  <CardContent className="flex items-start gap-4">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden',
                      !['anthropic', 'openai', 'google'].includes(provider.id) && 'bg-muted'
                    )}>
                      <ProviderIcon provider={provider.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{provider.name}</span>
                        {isConnected && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {accounts.length > 1 ? `${accounts.length} comptes` : 'Connecté'}
                          </span>
                        )}
                        {isError && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Erreur
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>

                      {/* List of connected OAuth accounts */}
                      {isOAuthConnected && (
                        <div className="mt-2 space-y-1">
                          {accounts.map((acc) => (
                            <div key={acc.id} className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                              <span className="text-xs truncate flex-1" title={accountLabel(acc)}>{accountLabel(acc)}</span>
                              <button
                                onClick={() => handleOAuthDisconnect(provider.id, acc.providerAccountId)}
                                className="text-[10px] text-muted-foreground hover:text-destructive shrink-0"
                                title="Déconnecter ce compte"
                              >
                                Retirer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {integration?.lastSync && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Dernière sync : {new Date(integration.lastSync).toLocaleString('fr-FR')}
                        </p>
                      )}

                      {isEditing && (
                        <div className="flex items-center gap-2 mt-3">
                          <Input
                            type="password"
                            placeholder={provider.id === 'anthropic' ? 'sk-ant-...' : provider.id === 'openai' ? 'sk-...' : provider.id === 'google' ? 'AIza...' : 'Clé API...'}
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            className="text-xs h-7 flex-1"
                          />
                          <Button size="sm" onClick={() => connectProvider(provider.id, keyInput)} disabled={!keyInput.trim()}>
                            Connecter
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingKey(null); setKeyInput('') }}>
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isOAuthConnected ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => { window.location.href = oauthHref }}
                          title="Ajouter un autre compte"
                        >
                          + Compte
                        </Button>
                      ) : isConnected ? (
                        <>
                          <Button size="xs" variant="ghost" onClick={() => testConnection(provider.id)}>
                            Tester
                          </Button>
                          <Button size="xs" variant="destructive" onClick={() => disconnectProvider(provider.id)}>
                            Déconnecter
                          </Button>
                        </>
                      ) : (
                        provider.id === 'google_calendar' ? (
                          <Button size="sm" variant="outline" onClick={() => { window.location.href = '/api/auth/google' }}>
                            Connecter Google
                          </Button>
                        ) : provider.category === 'social' ? (
                          <Button size="sm" variant="outline" onClick={() => { window.location.href = `/api/auth/${provider.id}` }}>
                            Connecter {provider.name.split(' ')[0]}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setEditingKey(provider.id); setKeyInput(integration?.apiKey || '') }}>
                            {provider.id === 'whoop' ? 'Connecter OAuth' : 'Ajouter clé API'}
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      })}

      {/* Webhooks section */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Webhooks</h4>
          <p className="text-xs text-muted-foreground">Recevez des notifications en temps réel</p>
        </div>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">URL de webhook</p>
                <p className="text-xs text-muted-foreground mt-0.5">Les événements seront envoyés à cette URL</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Bientôt</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ════════════════════════════════════════════
// AI SECTION
// ════════════════════════════════════════════

function AISection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (ai: AppSettings['ai']) => void }) {
  const ai = settings.ai

  return (
    <>
      <div>
        <h3 className="text-base font-semibold">IA & Modèles</h3>
        <p className="text-sm text-muted-foreground mt-1">Configurez le comportement de l'assistant IA</p>
      </div>

      {/* Assistant name (fixed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assistant IA</CardTitle>
          <CardDescription>L'intelligence artificielle intégrée à Bloom</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{AI_NAME}</p>
              <p className="text-[10px] text-muted-foreground">Nom permanent — ne peut pas être modifié</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modèle par défaut</CardTitle>
          <CardDescription>Le modèle utilisé pour les conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {AI_MODELS.map((model) => (
              <button
                key={model.value}
                onClick={() => onUpdate({ ...ai, model: model.value })}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                  ai.model === model.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  ai.model === model.value ? 'border-primary' : 'border-muted-foreground/40'
                )}>
                  {ai.model === model.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{model.label}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{model.provider}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{model.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Temperature */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Paramètres du modèle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Température</label>
              <span className="text-xs text-muted-foreground tabular-nums">{ai.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={ai.temperature}
              onChange={(e) => onUpdate({ ...ai, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Précis</span>
              <span className="text-[10px] text-muted-foreground">Créatif</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Tokens max par réponse</label>
            <Input
              type="number"
              value={ai.maxTokens}
              onChange={(e) => onUpdate({ ...ai, maxTokens: parseInt(e.target.value, 10) || 2048 })}
              className="mt-1 text-xs h-7"
              min={256}
              max={8192}
              step={256}
            />
          </div>

          <SettingRow
            label="Suggestions automatiques"
            description="L'IA propose des actions basées sur votre activité"
          >
            <Switch
              checked={ai.autoSuggest}
              onCheckedChange={(checked) => onUpdate({ ...ai, autoSuggest: !!checked })}
            />
          </SettingRow>

          <div>
            <label className="text-xs font-medium">Langue de l'assistant</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 'fr' as const, label: 'Français' },
                { value: 'en' as const, label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => onUpdate({ ...ai, language: lang.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    ai.language === lang.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Instructions personnalisées</CardTitle>
          <CardDescription>Instructions supplémentaires ajoutées au prompt système</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={ai.systemPromptExtra}
            onChange={(e) => onUpdate({ ...ai, systemPromptExtra: e.target.value })}
            placeholder="Ex: Réponds toujours de manière concise. Propose des estimations de temps réalistes..."
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
          />
        </CardContent>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// VOICE SECTION
// ════════════════════════════════════════════

function VoiceSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (v: AppSettings['voice']) => void }) {
  const voice = settings.voice

  return (
    <>
      <div>
        <h3 className="text-base font-semibold">Voix & Audio</h3>
        <p className="text-sm text-muted-foreground mt-1">Paramètres de transcription et reconnaissance vocale</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transcription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Transcription automatique"
            description="Transcrire automatiquement les enregistrements vocaux"
          >
            <Switch
              checked={voice.autoTranscribe}
              onCheckedChange={(checked) => onUpdate({ ...voice, autoTranscribe: !!checked })}
            />
          </SettingRow>

          <div>
            <label className="text-xs font-medium">Langue de reconnaissance</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 'fr-FR', label: 'Français' },
                { value: 'en-US', label: 'English' },
                { value: 'es-ES', label: 'Español' },
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => onUpdate({ ...voice, language: lang.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    voice.language === lang.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Qualité audio</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 'low' as const, label: 'Basse', desc: 'Fichiers légers' },
                { value: 'medium' as const, label: 'Moyenne', desc: 'Bon compromis' },
                { value: 'high' as const, label: 'Haute', desc: 'Meilleure qualité' },
              ].map((q) => (
                <button
                  key={q.value}
                  onClick={() => onUpdate({ ...voice, quality: q.value })}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-center transition-colors',
                    voice.quality === q.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className="text-xs font-medium">{q.label}</div>
                  <div className="text-[10px] text-muted-foreground">{q.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// NOTIFICATIONS SECTION
// ════════════════════════════════════════════

function NotificationsSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (n: AppSettings['notifications']) => void }) {
  const notif = settings.notifications

  return (
    <>
      <div>
        <h3 className="text-base font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos alertes et rappels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Fin du timer"
            description="Notification quand le compteur arrive à zéro"
          >
            <Switch
              checked={notif.timerEnd}
              onCheckedChange={(checked) => onUpdate({ ...notif, timerEnd: !!checked })}
            />
          </SettingRow>

          <SettingRow
            label="Rappels de tâches"
            description="Notification avant le début d'une tâche planifiée"
          >
            <Switch
              checked={notif.taskReminders}
              onCheckedChange={(checked) => onUpdate({ ...notif, taskReminders: !!checked })}
            />
          </SettingRow>

          <SettingRow
            label="Sons"
            description="Jouer un son pour les alertes"
          >
            <Switch
              checked={notif.sound}
              onCheckedChange={(checked) => onUpdate({ ...notif, sound: !!checked })}
            />
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Résumé quotidien</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Résumé quotidien"
            description="Recevoir un résumé de vos tâches chaque matin"
          >
            <Switch
              checked={notif.dailyDigest}
              onCheckedChange={(checked) => onUpdate({ ...notif, dailyDigest: !!checked })}
            />
          </SettingRow>

          {notif.dailyDigest && (
            <div>
              <label className="text-xs font-medium">Heure du résumé</label>
              <Input
                type="time"
                value={notif.digestTime}
                onChange={(e) => onUpdate({ ...notif, digestTime: e.target.value })}
                className="mt-1 text-xs h-7 w-28"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// APPEARANCE SECTION
// ════════════════════════════════════════════

function AppearanceSection({ settings, onSave }: { settings: AppSettings; onSave: (s: AppSettings) => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3B82F6')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  useEffect(() => {
    setCategories(store.getCategories())
  }, [])

  const refreshCategories = () => setCategories(store.getCategories())

  const handleAddCategory = () => {
    const name = newCatName.trim()
    if (!name) return
    store.createCategory(name, newCatColor)
    setNewCatName('')
    setNewCatColor('#3B82F6')
    refreshCategories()
  }

  const handleDeleteCategory = (id: string) => {
    store.deleteCategory(id)
    refreshCategories()
  }

  const startEditing = (cat: Category) => {
    setEditingCat(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  const handleUpdateCategory = (id: string) => {
    const name = editName.trim()
    if (!name) return
    store.updateCategory(id, { name, color: editColor })
    setEditingCat(null)
    refreshCategories()
  }

  return (
    <>
      <div>
        <h3 className="text-base font-semibold">Personnalisation</h3>
        <p className="text-sm text-muted-foreground mt-1">Apparence, polices et catégories</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Thème</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-xs font-medium">Mode d&apos;affichage</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 'light' as const, label: 'Clair' },
                { value: 'dark' as const, label: 'Sombre' },
                { value: 'system' as const, label: 'Système' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => onSave({ ...settings, theme: t.value })}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
                    settings.theme === t.value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Catégories</CardTitle>
          <CardDescription>Gérez les catégories de vos tâches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              {editingCat === cat.id ? (
                <>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-6 w-6 shrink-0 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xs h-7 flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateCategory(cat.id) }}
                  />
                  <Button size="xs" onClick={() => handleUpdateCategory(cat.id)}>OK</Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingCat(null)}>Annuler</Button>
                </>
              ) : (
                <>
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-medium flex-1">{cat.name}</span>
                  <Button size="xs" variant="ghost" onClick={() => startEditing(cat)}>
                    <EditIcon />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                    <TrashIcon />
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Add category form */}
          <div className="h-px bg-border" />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="h-6 w-6 shrink-0 rounded border border-border cursor-pointer"
            />
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nouvelle catégorie..."
              className="text-xs h-7 flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }}
            />
            <Button size="sm" onClick={handleAddCategory} disabled={!newCatName.trim()}>
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// GENERAL SECTION
// ════════════════════════════════════════════

function GeneralSection({ settings, onSave }: { settings: AppSettings; onSave: (s: AppSettings) => void }) {
  return (
    <>
      <div>
        <h3 className="text-base font-semibold">Général</h3>
        <p className="text-sm text-muted-foreground mt-1">Préférences générales de l'application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Calendrier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium">Premier jour de la semaine</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 1 as const, label: 'Lundi' },
                { value: 0 as const, label: 'Dimanche' },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => onSave({ ...settings, weekStartsOn: d.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    settings.weekStartsOn === d.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Vue par défaut</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: 'jour' as const, label: 'Jour' },
                { value: 'semaine' as const, label: 'Semaine' },
                { value: 'mois' as const, label: 'Mois' },
              ].map((v) => (
                <button
                  key={v.value}
                  onClick={() => onSave({ ...settings, defaultView: v.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    settings.defaultView === v.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statuts personnalisés</CardTitle>
          <CardDescription>Ajoutez des statuts custom pour vos projets et contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomStatusManager
            label="Statuts de projet"
            current={settings.customProjectStatuses || []}
            onChange={(list) => onSave({ ...settings, customProjectStatuses: list })}
          />
          <CustomStatusManager
            label="Statuts de contact"
            current={settings.customContactStatuses || []}
            onChange={(list) => onSave({ ...settings, customContactStatuses: list })}
          />
        </CardContent>
      </Card>
    </>
  )
}

function CustomStatusManager({ label, current, onChange }: {
  label: string
  current: { value: string; label: string; color: string }[]
  onChange: (list: { value: string; label: string; color: string }[]) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366F1')

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const value = trimmed.toLowerCase().replace(/\s+/g, '_')
    if (current.some((s) => s.value === value)) return
    onChange([...current, { value, label: trimmed, color }])
    setName('')
  }

  const handleRemove = (value: string) => {
    onChange(current.filter((s) => s.value !== value))
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label}</label>
      {current.length > 0 && (
        <div className="space-y-1">
          {current.map((s) => (
            <div key={s.value} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-muted/50">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="flex-1">{s.label}</span>
              <button onClick={() => handleRemove(s.value)} className="text-muted-foreground hover:text-destructive">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-7 shrink-0 rounded border border-border cursor-pointer"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau statut..."
          className="text-xs h-7 flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
        />
        <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>Ajouter</Button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// DATA SECTION
// ════════════════════════════════════════════

function DataSection() {
  const [storageInfo, setStorageInfo] = useState({ used: '0 KB', items: 0 })
  const [showConfirm, setShowConfirm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus())
  const [cacheConfirm, setCacheConfirm] = useState(false)

  useEffect(() => {
    setStorageInfo(store.getStorageSize())
    const unsub = subscribeSyncStatus(() => setSyncStatus(getSyncStatus()))
    return unsub
  }, [])

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      await refreshFromCloudWithStatus()
      // Force a soft reload so all useEffects re-read the freshly synced cache
      window.location.reload()
    } finally {
      setSyncing(false)
    }
  }

  const handleClearCache = async () => {
    // Push any pending writes to the cloud before nuking the local cache
    try { await flushPending() } catch {/* ignore */}
    // Wipe every bloom_* key (including the heal flag and migration flag)
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('bloom_')) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    // Reload — initCloudSync will re-pull everything from Supabase
    window.location.reload()
  }

  const handleExport = () => {
    const data: Record<string, string | null> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('bloom_')) {
        data[key] = localStorage.getItem(key)
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bloom-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text) as Record<string, string>
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('bloom_') && typeof value === 'string') {
            localStorage.setItem(key, value)
          }
        }
        window.location.reload()
      } catch {
        alert('Fichier invalide')
      }
    }
    input.click()
  }

  const handleClearAll = () => {
    store.clearAllData()
    window.location.reload()
  }

  return (
    <>
      <div>
        <h3 className="text-base font-semibold">Données & Stockage</h3>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos données locales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stockage local</CardTitle>
          <CardDescription>Toutes vos données sont stockées dans le navigateur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <DatabaseIcon />
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums">{storageInfo.used}</div>
              <div className="text-xs text-muted-foreground">{storageInfo.items} entrées localStorage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sauvegarde & Restauration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Exporter les données</p>
              <p className="text-[10px] text-muted-foreground">Télécharger un fichier JSON avec toutes vos données</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExport}>
              Exporter
            </Button>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Importer des données</p>
              <p className="text-[10px] text-muted-foreground">Restaurer depuis un fichier de sauvegarde</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleImport}>
              Importer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Synchronisation cloud</CardTitle>
          <CardDescription>
            Vos données (tâches, projets, paramètres, personnalisations) sont sauvegardées dans le cloud
            et synchronisées sur tous vos appareils connectés au même compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">État de la synchronisation</p>
              <p className="text-[10px] text-muted-foreground">
                {syncStatus.lastSyncError
                  ? <span className="text-red-600">Erreur : {syncStatus.lastSyncError}</span>
                  : syncStatus.lastSyncAt
                    ? `Dernière sync ${formatRelative(syncStatus.lastSyncAt)}`
                    : syncStatus.isReady
                      ? 'Prêt — en attente de la prochaine sync'
                      : 'Non connecté'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleSyncNow} disabled={syncing || !syncStatus.isReady}>
              {syncing ? 'Sync...' : 'Synchroniser'}
            </Button>
          </div>

          <div className="h-px bg-border" />

          {!cacheConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Vider le cache local</p>
                <p className="text-[10px] text-muted-foreground">
                  Supprime le cache local et resynchronise depuis le cloud. Utile en cas d&apos;erreur d&apos;affichage.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCacheConfirm(true)}>
                Vider le cache
              </Button>
            </div>
          ) : (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-amber-800">Confirmer ?</p>
              <p className="text-[10px] text-amber-700">
                Le cache local sera supprimé puis resynchronisé depuis le cloud.
                Vos données restent sauvegardées dans le cloud — aucune perte.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={handleClearCache}>
                  Vider et resynchroniser
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCacheConfirm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-red-600">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          {!showConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Supprimer toutes les données</p>
                <p className="text-[10px] text-muted-foreground">Cette action est irréversible</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => setShowConfirm(true)}>
                Tout supprimer
              </Button>
            </div>
          ) : (
            <div className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-red-800">Êtes-vous sûr ?</p>
              <p className="text-[10px] text-red-600">Toutes vos tâches, contacts, projets et paramètres seront supprimés définitivement.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleClearAll}>
                  Oui, tout supprimer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case 'anthropic':
      return <Image src="/assets/icon-claude.svg" alt="Claude" width={28} height={28} className="rounded" />
    case 'openai':
      return <Image src="/assets/icon-gpt.png" alt="GPT" width={28} height={28} className="rounded" />
    case 'google':
      return <Image src="/assets/icon-gemini.webp" alt="Gemini" width={28} height={28} className="rounded" />
    case 'whoop':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M6 10a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case 'google_calendar':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="10" cy="12.5" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      )
    case 'notion':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="4" y="3" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 7h6M7 10h4M7 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'mixpanel':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17 8 10l3 4 6-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="4" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      )
    case 'stripe':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 8h16" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 12h3M11 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case 'youtube':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1.5" y="4" width="17" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8.5 7.5v5l4-2.5-4-2.5Z" fill="currentColor" />
        </svg>
      )
    case 'meta':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 14c0-5 2-9 5-9 2 0 3.5 1.5 5 4.5C13.5 12.5 15 14 17 14c1.5 0 1.5-2 0-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 6c0 5-2 9-5 9-2 0-3.5-1.5-5-4.5C6.5 7.5 5 6 3 6c-1.5 0-1.5 2 0 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M13.5 2v9.5a3 3 0 1 1-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 2c.5 2 2 3.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="6" cy="7" r="1" fill="currentColor" />
          <path d="M5 9.5h2v6h-2v-6Z" fill="currentColor" />
          <path d="M9 9.5h2v1c.5-.7 1.3-1 2-1 1.5 0 2.5 1 2.5 2.5v3.5h-2v-3c0-.7-.5-1.2-1.2-1.2s-1.3.5-1.3 1.2v3H9v-6Z" fill="currentColor" />
        </svg>
      )
    default:
      return <PlugIcon />
  }
}

// ── Section icons ──

function PlugIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v3M10 2v3" />
      <rect x="4" y="5" width="8" height="4" rx="1" />
      <path d="M8 9v5" />
      <path d="M5 14h6" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2c-1.2 1.5-3 2.5-3 5.5a3 3 0 0 0 6 0c0-3-1.8-4-3-5.5Z" />
      <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.4" />
      <path d="M6 11.5c-.4 1 .3 2.5 2 2.5s2.4-1.5 2-2.5" opacity="0.5" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5.5" y="2" width="5" height="8" rx="2.5" />
      <path d="M3 8a5 5 0 0 0 10 0" />
      <path d="M8 13v2" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2a4 4 0 0 0-4 4c0 2-1 3-1 4h10s-1-2-1-4a4 4 0 0 0-4-4Z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
      <circle cx="5" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="8" r="1.5" fill="currentColor" />
      <circle cx="7" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="10" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="9" cy="10" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 2.5l3 3L4.5 12.5H1.5v-3l7-7Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h10M5 4V2.5h4V4M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v4c0 1.1 2.2 2 5 2s5-.9 5-2V4" />
      <path d="M3 8v4c0 1.1 2.2 2 5 2s5-.9 5-2V8" />
    </svg>
  )
}
