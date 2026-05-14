'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { parseUserAgent } from '@/lib/ua-parser'

type Site = { id: string; name: string; domain: string; created_at: string }
type Event = {
  id: number
  event_type: string
  path: string | null
  referrer: string | null
  country: string | null
  session_id: string | null
  user_agent: string | null
  created_at: string
}

type Tab = 'overview' | 'pages' | 'sources' | 'devices' | 'events' | 'live' | 'install'

const COUNTRY_NAMES: Record<string, string> = {
  US: '🇺🇸 États-Unis', FR: '🇫🇷 France', CA: '🇨🇦 Canada', GB: '🇬🇧 Royaume-Uni',
  DE: '🇩🇪 Allemagne', ES: '🇪🇸 Espagne', IT: '🇮🇹 Italie', NL: '🇳🇱 Pays-Bas',
  BE: '🇧🇪 Belgique', CH: '🇨🇭 Suisse', JP: '🇯🇵 Japon', BR: '🇧🇷 Brésil',
  AU: '🇦🇺 Australie', IN: '🇮🇳 Inde', MX: '🇲🇽 Mexique', RU: '🇷🇺 Russie',
  CN: '🇨🇳 Chine', PT: '🇵🇹 Portugal', SE: '🇸🇪 Suède', NO: '🇳🇴 Norvège',
}

export default function AnalyticsPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [days, setDays] = useState(7)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const loadSites = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics/sites')
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      setSites(data.sites || [])
      setSelectedSiteId((prev) => prev || data.sites?.[0]?.id || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEvents = useCallback(async (siteId: string, daysVal: number) => {
    setEventsLoading(true)
    try {
      const res = await fetch(`/api/analytics/events?siteId=${siteId}&days=${daysVal}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      setEvents(data.events || [])
    } catch {
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => { loadSites() }, [loadSites])

  useEffect(() => {
    if (selectedSiteId) loadEvents(selectedSiteId, days)
  }, [selectedSiteId, days, loadEvents])

  // Auto-refresh for "live" tab
  useEffect(() => {
    if (!autoRefresh || !selectedSiteId) return
    const interval = setInterval(() => loadEvents(selectedSiteId, days), 10_000)
    return () => clearInterval(interval)
  }, [autoRefresh, selectedSiteId, days, loadEvents])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newDomain.trim()) return
    setError('')
    try {
      const res = await fetch('/api/analytics/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), domain: newDomain.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      setNewName(''); setNewDomain(''); setCreating(false)
      await loadSites()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce site et tous ses événements ?')) return
    await fetch(`/api/analytics/sites/${id}`, { method: 'DELETE' })
    if (selectedSiteId === id) setSelectedSiteId(null)
    await loadSites()
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header onCreate={() => setCreating(true)} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

        {creating && (
          <CreateSiteForm
            newName={newName}
            newDomain={newDomain}
            onNameChange={setNewName}
            onDomainChange={setNewDomain}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : sites.length === 0 ? (
          <EmptyState onCreate={() => setCreating(true)} />
        ) : (
          <>
            <SiteTabs sites={sites} selectedSiteId={selectedSiteId} onSelect={setSelectedSiteId} />

            {selectedSite && (
              <>
                <Toolbar
                  days={days}
                  onDaysChange={setDays}
                  autoRefresh={autoRefresh}
                  onAutoRefreshChange={setAutoRefresh}
                  onDelete={() => handleDelete(selectedSite.id)}
                  onRefresh={() => loadEvents(selectedSite.id, days)}
                  loading={eventsLoading}
                />

                <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'overview' && <OverviewTab events={events} days={days} loading={eventsLoading} />}
                {activeTab === 'pages' && <PagesTab events={events} site={selectedSite} />}
                {activeTab === 'sources' && <SourcesTab events={events} site={selectedSite} />}
                {activeTab === 'devices' && <DevicesTab events={events} />}
                {activeTab === 'events' && <EventsTab events={events} />}
                {activeTab === 'live' && <LiveTab events={events} site={selectedSite} />}
                {activeTab === 'install' && <InstallTab site={selectedSite} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Header + UI shell
// ════════════════════════════════════════════════════════════════════════

function Header({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="8" cy="8" r="3" />
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-xs text-muted-foreground">Suivi de tes sites web</p>
          </div>
        </div>
        <Button size="sm" onClick={onCreate}>+ Site</Button>
      </div>
      <div className="h-px gradient-line" />
    </div>
  )
}

function CreateSiteForm({ newName, newDomain, onNameChange, onDomainChange, onSubmit, onCancel }: {
  newName: string
  newDomain: string
  onNameChange: (v: string) => void
  onDomainChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}) {
  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Nouveau site</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Nom (ex: Mon blog)" value={newName} onChange={(e) => onNameChange(e.target.value)} autoFocus />
          <Input placeholder="Domaine (ex: monblog.com)" value={newDomain} onChange={(e) => onDomainChange(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Annuler</Button>
            <Button type="submit" size="sm" disabled={!newName.trim() || !newDomain.trim()}>Créer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="text-center py-12 space-y-3">
        <p className="text-sm text-muted-foreground">Aucun site enregistré</p>
        <Button size="sm" onClick={onCreate}>Ajouter ton premier site</Button>
        <p className="text-[10px] text-muted-foreground">
          Note : exécute la migration <code className="bg-muted px-1 rounded">supabase/migrations/20260514_tracking_analytics.sql</code> sur ton projet Supabase d&apos;abord.
        </p>
      </CardContent>
    </Card>
  )
}

function SiteTabs({ sites, selectedSiteId, onSelect }: {
  sites: Site[]; selectedSiteId: string | null; onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
      {sites.map((site) => (
        <button
          key={site.id}
          onClick={() => onSelect(site.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            selectedSiteId === site.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span>{site.name}</span>
          <span className="text-[10px] opacity-70">{site.domain}</span>
        </button>
      ))}
    </div>
  )
}

function Toolbar({ days, onDaysChange, autoRefresh, onAutoRefreshChange, onDelete, onRefresh, loading }: {
  days: number
  onDaysChange: (d: number) => void
  autoRefresh: boolean
  onAutoRefreshChange: (b: boolean) => void
  onDelete: () => void
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[1, 7, 14, 30, 90, 365].map((d) => (
        <button
          key={d}
          onClick={() => onDaysChange(d)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-medium transition-colors',
            days === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {d === 1 ? '24h' : d === 365 ? '1 an' : `${d} jours`}
        </button>
      ))}
      <div className="h-5 w-px bg-border mx-1" />
      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
        <input type="checkbox" checked={autoRefresh} onChange={(e) => onAutoRefreshChange(e.target.checked)} className="h-3.5 w-3.5 rounded accent-primary" />
        <span className="text-muted-foreground">Auto-refresh 10s</span>
      </label>
      <Button size="xs" variant="outline" onClick={onRefresh} disabled={loading}>
        {loading ? '...' : 'Rafraîchir'}
      </Button>
      <Button size="xs" variant="destructive" className="ml-auto" onClick={onDelete}>
        Supprimer le site
      </Button>
    </div>
  )
}

function DashboardTabs({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'pages', label: 'Pages' },
    { id: 'sources', label: 'Sources' },
    { id: 'devices', label: 'Appareils' },
    { id: 'events', label: 'Événements' },
    { id: 'live', label: 'Live' },
    { id: 'install', label: 'Installation' },
  ]
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Overview
// ════════════════════════════════════════════════════════════════════════

function OverviewTab({ events, days, loading }: { events: Event[]; days: number; loading: boolean }) {
  const stats = useMemo(() => computeOverview(events, days), [events, days])

  if (loading && events.length === 0) {
    return <p className="text-xs text-muted-foreground">Chargement des événements...</p>
  }
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-8 text-center">Aucun événement reçu. Va dans l&apos;onglet <strong>Installation</strong> pour configurer le tracking.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Pageviews" value={stats.pageviews} />
        <Kpi label="Visiteurs uniques" value={stats.sessions} accent />
        <Kpi label="Événements" value={stats.total} />
        <Kpi label="Taux de rebond" value={`${stats.bounceRate}%`} hint="1 page vue / session" />
        <Kpi label="Pages / session" value={stats.pagesPerSession.toFixed(1)} />
        <Kpi label="Durée moyenne" value={formatDuration(stats.avgDurationSec)} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Évolution dans le temps</CardTitle></CardHeader>
        <CardContent>
          <DailyChart data={stats.byDate} sessionsByDate={stats.sessionsByDate} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Heatmap horaire</CardTitle></CardHeader>
          <CardContent>
            <HourlyHeatmap data={stats.hourlyMatrix} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top pages</CardTitle></CardHeader>
          <CardContent>
            <TopList data={stats.topPaths} max={6} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top sources</CardTitle></CardHeader>
          <CardContent><TopList data={stats.topReferrers} max={6} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top pays</CardTitle></CardHeader>
          <CardContent><TopList data={stats.topCountries.map(([k, v]) => [COUNTRY_NAMES[k] || k, v] as [string, number])} max={6} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Appareils</CardTitle></CardHeader>
          <CardContent><TopList data={stats.topDevices} max={6} /></CardContent>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Pages
// ════════════════════════════════════════════════════════════════════════

function PagesTab({ events, site }: { events: Event[]; site: Site }) {
  const pageStats = useMemo(() => computePageStats(events), [events])
  const entryExitStats = useMemo(() => computeEntryExit(events), [events])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Toutes les pages</CardTitle>
          <CardDescription>Pageviews et visiteurs uniques par URL</CardDescription>
        </CardHeader>
        <CardContent>
          {pageStats.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucune donnée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Page</th>
                    <th className="py-2 font-medium text-right">Pageviews</th>
                    <th className="py-2 font-medium text-right">Visiteurs uniques</th>
                    <th className="py-2 font-medium text-right">% du total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageStats.map((row) => (
                    <tr key={row.path} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 truncate max-w-md">
                        <a href={`https://${site.domain}${row.path}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          {row.path || '/'}
                        </a>
                      </td>
                      <td className="py-2 text-right tabular-nums">{row.pageviews.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">{row.uniqueVisitors.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">{row.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pages d&apos;entrée</CardTitle>
            <CardDescription>Première page de chaque session</CardDescription>
          </CardHeader>
          <CardContent><TopList data={entryExitStats.entryPages} max={10} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pages de sortie</CardTitle>
            <CardDescription>Dernière page de chaque session</CardDescription>
          </CardHeader>
          <CardContent><TopList data={entryExitStats.exitPages} max={10} /></CardContent>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Sources
// ════════════════════════════════════════════════════════════════════════

function SourcesTab({ events, site }: { events: Event[]; site: Site }) {
  const sources = useMemo(() => computeSources(events, site.domain), [events, site.domain])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Direct" value={sources.directCount} hint="Saisie directe URL" />
        <Kpi label="Moteurs" value={sources.searchCount} hint="Google, Bing, DDG..." />
        <Kpi label="Réseaux sociaux" value={sources.socialCount} hint="IG, FB, TikTok..." />
        <Kpi label="Autres sites" value={sources.referralCount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top sources</CardTitle></CardHeader>
          <CardContent><TopList data={sources.topReferrers} max={15} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Par catégorie</CardTitle></CardHeader>
          <CardContent>
            <BarChart data={[
              { label: 'Direct', value: sources.directCount, color: '#6B7280' },
              { label: 'Moteurs', value: sources.searchCount, color: '#3B82F6' },
              { label: 'Sociaux', value: sources.socialCount, color: '#EC4899' },
              { label: 'Référents', value: sources.referralCount, color: '#10B981' },
            ]} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">URLs sources complètes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-auto">
            {sources.allReferrers.slice(0, 50).map(([url, count]) => (
              <div key={url} className="flex items-center gap-2 text-xs">
                <a href={url === 'Direct' ? '#' : url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 hover:text-primary" title={url}>{url}</a>
                <span className="font-medium tabular-nums shrink-0">{count}</span>
              </div>
            ))}
            {sources.allReferrers.length === 0 && <p className="text-xs text-muted-foreground italic">Aucune donnée</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Devices
// ════════════════════════════════════════════════════════════════════════

function DevicesTab({ events }: { events: Event[] }) {
  const stats = useMemo(() => computeDevices(events), [events])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Type d&apos;appareil</CardTitle></CardHeader>
          <CardContent><TopList data={stats.deviceTypes} max={5} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Navigateur</CardTitle></CardHeader>
          <CardContent><TopList data={stats.browsers} max={10} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Système</CardTitle></CardHeader>
          <CardContent><TopList data={stats.os} max={10} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pays</CardTitle></CardHeader>
        <CardContent>
          <TopList data={stats.countries.map(([k, v]) => [COUNTRY_NAMES[k] || k, v] as [string, number])} max={20} />
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Events (custom)
// ════════════════════════════════════════════════════════════════════════

function EventsTab({ events }: { events: Event[] }) {
  const customEvents = useMemo(() => {
    const byType = new Map<string, number>()
    for (const e of events) {
      if (e.event_type !== 'pageview') {
        byType.set(e.event_type, (byType.get(e.event_type) || 0) + 1)
      }
    }
    return {
      counts: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]),
      list: events.filter((e) => e.event_type !== 'pageview').slice(0, 100),
    }
  }, [events])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Événements personnalisés</CardTitle>
          <CardDescription>
            Envoyés via <code className="bg-muted px-1 rounded text-[10px]">bloom(&apos;nom_evenement&apos;)</code> dans ton code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customEvents.counts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun événement personnalisé. Utilise <code className="bg-muted px-1 rounded text-[10px]">window.bloom(&apos;mon_event&apos;)</code> dans ton code.</p>
          ) : (
            <TopList data={customEvents.counts} max={20} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Flux récent (100 derniers)</CardTitle></CardHeader>
        <CardContent>
          {customEvents.list.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun événement récent</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-auto">
              {customEvents.list.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-muted/30">
                  <span className="font-mono text-primary">{e.event_type}</span>
                  <span className="text-muted-foreground truncate flex-1">{e.path || '—'}</span>
                  <span className="text-muted-foreground text-[10px] shrink-0">{new Date(e.created_at).toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Live
// ════════════════════════════════════════════════════════════════════════

function LiveTab({ events, site }: { events: Event[]; site: Site }) {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000
  const recentEvents = events.filter((e) => new Date(e.created_at).getTime() > fiveMinAgo)
  const activeSessions = new Set(recentEvents.map((e) => e.session_id).filter(Boolean)).size

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Kpi label="Visiteurs (5 min)" value={activeSessions} accent />
        <Kpi label="Événements (5 min)" value={recentEvents.length} />
        <Kpi label="Activité" value={recentEvents.length > 0 ? '🟢 Live' : '⚫ Calme'} hint="Mise à jour 10s" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Flux en direct</CardTitle>
          <CardDescription>Activez l&apos;auto-refresh ci-dessus pour voir les événements arriver en temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun événement</p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-auto">
              {events.slice(0, 200).map((e) => {
                const ua = e.user_agent ? parseUserAgent(e.user_agent) : null
                const refHost = e.referrer ? safeHost(e.referrer) : 'Direct'
                const time = new Date(e.created_at)
                const seconds = Math.floor((Date.now() - time.getTime()) / 1000)
                const timeLabel = seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}min` : time.toLocaleString('fr-FR')
                return (
                  <div key={e.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-muted/30 border-b border-border/30 last:border-b-0">
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', seconds < 30 ? 'bg-green-500 animate-pulse' : seconds < 300 ? 'bg-yellow-500' : 'bg-muted-foreground/30')} />
                    <span className="text-[10px] tabular-nums text-muted-foreground w-12 shrink-0">{timeLabel}</span>
                    <span className={cn('font-mono text-[10px] shrink-0 px-1 rounded', e.event_type === 'pageview' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-primary/15 text-primary')}>
                      {e.event_type}
                    </span>
                    <a href={`https://${site.domain}${e.path || ''}`} target="_blank" rel="noopener noreferrer" className="truncate min-w-0 flex-1 hover:text-primary" title={e.path || ''}>{e.path || '/'}</a>
                    {ua && (
                      <span className="text-muted-foreground text-[10px] shrink-0 hidden sm:inline">
                        {ua.deviceType === 'mobile' ? '📱' : ua.deviceType === 'tablet' ? '🖥' : '💻'} {ua.browser}
                      </span>
                    )}
                    <span className="text-muted-foreground text-[10px] shrink-0 hidden md:inline truncate max-w-[120px]" title={e.referrer || 'Direct'}>{refHost}</span>
                    {e.country && <span className="text-[10px] shrink-0">{COUNTRY_NAMES[e.country]?.split(' ')[0] || e.country}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Tab: Install (tutorial)
// ════════════════════════════════════════════════════════════════════════

function InstallTab({ site }: { site: Site }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bloom.example'
  const [framework, setFramework] = useState<'html' | 'nextjs' | 'react' | 'wordpress' | 'shopify' | 'webflow' | 'vue' | 'gtm'>('html')
  const [copied, setCopied] = useState<string | null>(null)

  const snippets: Record<typeof framework, { title: string; description: string; code: string; lang: string }> = {
    html: {
      title: 'HTML / Site statique',
      description: 'Colle dans le <head> de ton HTML, sur toutes les pages',
      code: `<script defer src="${origin}/track.js" data-site="${site.id}"></script>`,
      lang: 'html',
    },
    nextjs: {
      title: 'Next.js (App Router)',
      description: 'Dans app/layout.tsx, ajoute le composant Script juste avant </body>',
      code: `import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${origin}/track.js"
          data-site="${site.id}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`,
      lang: 'tsx',
    },
    react: {
      title: 'React (Vite / CRA)',
      description: 'Ajoute dans public/index.html dans le <head>',
      code: `<!-- public/index.html -->
<head>
  <!-- ... -->
  <script defer src="${origin}/track.js" data-site="${site.id}"></script>
</head>`,
      lang: 'html',
    },
    vue: {
      title: 'Vue / Nuxt',
      description: 'Dans nuxt.config.ts ou index.html',
      code: `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: '${origin}/track.js',
          'data-site': '${site.id}',
          defer: true,
        },
      ],
    },
  },
})`,
      lang: 'ts',
    },
    wordpress: {
      title: 'WordPress',
      description: 'Va dans Apparence → Personnaliser → Code CSS/HTML supplémentaire, ou ajoute dans functions.php',
      code: `<?php
// Dans functions.php du thème actif
function bloom_tracking() {
  echo '<script defer src="${origin}/track.js" data-site="${site.id}"></script>';
}
add_action('wp_head', 'bloom_tracking');`,
      lang: 'php',
    },
    shopify: {
      title: 'Shopify',
      description: 'Admin → Boutique en ligne → Thèmes → Actions → Modifier le code → theme.liquid',
      code: `<!-- Dans theme.liquid, avant </head> -->
<script defer src="${origin}/track.js" data-site="${site.id}"></script>`,
      lang: 'liquid',
    },
    webflow: {
      title: 'Webflow',
      description: 'Project Settings → Custom Code → Head Code',
      code: `<script defer src="${origin}/track.js" data-site="${site.id}"></script>`,
      lang: 'html',
    },
    gtm: {
      title: 'Google Tag Manager',
      description: 'Tag → Custom HTML → Trigger: All Pages',
      code: `<script defer src="${origin}/track.js" data-site="${site.id}"></script>`,
      lang: 'html',
    },
  }

  const current = snippets[framework]

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Comment activer le tracking sur ton site</CardTitle>
          <CardDescription>Choisis ta plateforme et colle le code généré pour <strong>{site.name}</strong> ({site.domain})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Framework picker */}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(snippets) as (keyof typeof snippets)[]).map((key) => (
              <button
                key={key}
                onClick={() => setFramework(key)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-md transition-colors',
                  framework === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {snippets[key].title}
              </button>
            ))}
          </div>

          {/* Snippet */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{current.description}</p>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 font-mono text-[11px] overflow-x-auto whitespace-pre">
                {current.code}
              </pre>
              <button
                onClick={() => copy(current.code, current.title)}
                className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-background border border-border hover:bg-muted"
              >
                {copied === current.title ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Étapes après installation</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-xs">
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
              <div>
                <p className="font-medium">Copier le snippet ci-dessus</p>
                <p className="text-muted-foreground">Sélectionne ta plateforme et copie le code.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
              <div>
                <p className="font-medium">L&apos;ajouter à toutes les pages</p>
                <p className="text-muted-foreground">Le mieux est de l&apos;ajouter dans le <code>&lt;head&gt;</code> ou juste avant <code>&lt;/body&gt;</code> du template global.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
              <div>
                <p className="font-medium">Déployer et tester</p>
                <p className="text-muted-foreground">Visite ton site, puis reviens dans l&apos;onglet <strong>Live</strong> pour voir tes événements arriver en temps réel.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
              <div>
                <p className="font-medium">Optionnel : événements personnalisés</p>
                <p className="text-muted-foreground mb-1.5">Une fois le script chargé, tu peux envoyer des événements custom :</p>
                <pre className="bg-muted/50 rounded p-2 font-mono text-[10px]">{`window.bloom('signup')
window.bloom('purchase')
window.bloom('cta_click')`}</pre>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ce qui est tracké automatiquement</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <FeatureItem title="Pageviews" desc="À chaque chargement de page, y compris la navigation SPA (pushState)" />
            <FeatureItem title="Sessions" desc="Identifiant unique par session de 30 minutes" />
            <FeatureItem title="Référents" desc="Site d'où vient le visiteur (Google, Twitter, etc.)" />
            <FeatureItem title="Pays" desc="Détecté via l'IP côté serveur (Vercel headers)" />
            <FeatureItem title="Navigateur & OS" desc="Chrome, Safari, Firefox sur Mac, Windows, iOS..." />
            <FeatureItem title="Type d'appareil" desc="Desktop, mobile ou tablette" />
            <FeatureItem title="Pages d'entrée/sortie" desc="Où les visiteurs commencent et finissent" />
            <FeatureItem title="Activité en direct" desc="Visiteurs des 5 dernières minutes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Confidentialité</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          <p>✓ <strong>Pas de cookies persistants</strong> — utilise sessionStorage pour l&apos;ID de session</p>
          <p>✓ <strong>Pas d&apos;IP stockée</strong> — seulement le pays via les headers Vercel</p>
          <p>✓ <strong>RGPD-friendly</strong> par design</p>
          <p>✓ <strong>Données hébergées</strong> sur ton instance Supabase</p>
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-2 items-start">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0">
        <circle cx="7" cy="7" r="6" />
        <path d="M4 7l2 2 4-4" />
      </svg>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-[10px]">{desc}</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Shared components
// ════════════════════════════════════════════════════════════════════════

function Kpi({ label, value, accent, hint }: { label: string; value: number | string; accent?: boolean; hint?: string }) {
  return (
    <Card className={cn(accent && 'border-primary/40')}>
      <CardContent className="p-3 sm:p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function TopList({ data, max = 10 }: { data: [string, number][]; max?: number }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground italic">Aucune donnée</p>
  const maxValue = data[0]?.[1] || 1
  return (
    <div className="space-y-1">
      {data.slice(0, max).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs relative">
          <div
            className="absolute inset-0 bg-primary/8 rounded-md"
            style={{ width: `${(value / maxValue) * 100}%` }}
          />
          <span className="truncate flex-1 relative z-10 px-1.5 py-0.5" title={key}>{key}</span>
          <span className="font-medium tabular-nums shrink-0 relative z-10 px-1.5">{value}</span>
        </div>
      ))}
    </div>
  )
}

function DailyChart({ data, sessionsByDate }: { data: [string, number][]; sessionsByDate: Map<string, Set<string>> }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground italic py-4">Aucune donnée</p>
  const max = Math.max(...data.map(([, v]) => v), 1)
  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {data.map(([day, count]) => {
          const sessions = sessionsByDate.get(day)?.size || 0
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <div className="w-full relative flex-1 flex items-end">
                <div
                  className="w-full bg-primary/60 rounded-t hover:bg-primary transition-colors"
                  style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">{day.slice(5)}</span>
              <span className="text-[8px] text-muted-foreground absolute opacity-0 group-hover:opacity-100 transition-opacity -translate-y-32 pointer-events-none bg-foreground text-background px-1.5 py-0.5 rounded">
                {count} pageviews · {sessions} visiteurs
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 justify-center text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-primary/60 rounded" /> Pageviews</span>
      </div>
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0">{d.label}</span>
          <div className="flex-1 h-5 bg-muted rounded relative">
            <div className="h-full rounded transition-all" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
            <span className="absolute inset-0 flex items-center px-2 font-medium tabular-nums">{d.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function HourlyHeatmap({ data }: { data: number[][] }) {
  // data[day][hour] — 7 days × 24 hours
  const maxValue = Math.max(...data.flat(), 1)
  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'auto repeat(24, minmax(12px, 1fr))' }}>
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-[8px] text-muted-foreground text-center">{h % 4 === 0 ? `${h}h` : ''}</div>
          ))}
          {data.map((day, dayIdx) => (
            <>
              <div key={`label-${dayIdx}`} className="text-[10px] text-muted-foreground pr-2 flex items-center">{dayLabels[dayIdx]}</div>
              {day.map((count, hour) => {
                const intensity = count / maxValue
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className="aspect-square rounded-sm transition-colors"
                    style={{
                      backgroundColor: intensity > 0
                        ? `color-mix(in oklch, oklch(0.55 0.17 50) ${intensity * 100}%, transparent)`
                        : 'oklch(0.93 0 0 / 30%)',
                    }}
                    title={`${dayLabels[dayIdx]} ${hour}h · ${count} événements`}
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Stats computation helpers
// ════════════════════════════════════════════════════════════════════════

type Overview = {
  total: number
  pageviews: number
  sessions: number
  pagesPerSession: number
  bounceRate: number
  avgDurationSec: number
  byDate: [string, number][]
  sessionsByDate: Map<string, Set<string>>
  hourlyMatrix: number[][]
  topPaths: [string, number][]
  topReferrers: [string, number][]
  topCountries: [string, number][]
  topDevices: [string, number][]
}

function computeOverview(events: Event[], _days: number): Overview {
  void _days
  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size
  const pageviews = events.filter((e) => e.event_type === 'pageview').length

  const byPath = new Map<string, number>()
  const byReferrer = new Map<string, number>()
  const byCountry = new Map<string, number>()
  const byDevice = new Map<string, number>()
  const byDate = new Map<string, number>()
  const sessionsByDate = new Map<string, Set<string>>()
  const hourlyMatrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

  // Bounce + duration calculation per session
  const sessionEvents = new Map<string, Event[]>()

  for (const e of events) {
    if (e.path) byPath.set(e.path, (byPath.get(e.path) || 0) + 1)
    const ref = e.referrer ? safeHost(e.referrer) : 'Direct'
    byReferrer.set(ref, (byReferrer.get(ref) || 0) + 1)
    const country = e.country || 'Inconnu'
    byCountry.set(country, (byCountry.get(country) || 0) + 1)

    if (e.user_agent) {
      const ua = parseUserAgent(e.user_agent)
      const deviceLabel = `${ua.deviceType === 'mobile' ? '📱 Mobile' : ua.deviceType === 'tablet' ? '🖥 Tablette' : '💻 Desktop'} · ${ua.browser}`
      byDevice.set(deviceLabel, (byDevice.get(deviceLabel) || 0) + 1)
    }

    const d = new Date(e.created_at)
    const day = d.toISOString().slice(0, 10)
    byDate.set(day, (byDate.get(day) || 0) + 1)
    if (e.session_id) {
      if (!sessionsByDate.has(day)) sessionsByDate.set(day, new Set())
      sessionsByDate.get(day)!.add(e.session_id)
    }

    const jsDay = (d.getDay() + 6) % 7 // Mon=0
    hourlyMatrix[jsDay][d.getHours()]++

    if (e.session_id) {
      if (!sessionEvents.has(e.session_id)) sessionEvents.set(e.session_id, [])
      sessionEvents.get(e.session_id)!.push(e)
    }
  }

  // Bounce + duration
  let bouncedSessions = 0
  let totalDuration = 0
  let sessionsWithDuration = 0
  for (const sEvents of sessionEvents.values()) {
    if (sEvents.length === 1) bouncedSessions++
    if (sEvents.length >= 2) {
      const sorted = sEvents.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      const duration = (new Date(sorted[sorted.length - 1].created_at).getTime() - new Date(sorted[0].created_at).getTime()) / 1000
      totalDuration += duration
      sessionsWithDuration++
    }
  }

  const bounceRate = sessions > 0 ? Math.round((bouncedSessions / sessions) * 100) : 0
  const pagesPerSession = sessions > 0 ? pageviews / sessions : 0
  const avgDurationSec = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0

  const sorted = (m: Map<string, number>): [string, number][] =>
    Array.from(m.entries()).sort((a, b) => b[1] - a[1])

  return {
    total: events.length,
    pageviews,
    sessions,
    pagesPerSession,
    bounceRate,
    avgDurationSec,
    byDate: Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)),
    sessionsByDate,
    hourlyMatrix,
    topPaths: sorted(byPath),
    topReferrers: sorted(byReferrer),
    topCountries: sorted(byCountry),
    topDevices: sorted(byDevice),
  }
}

function computePageStats(events: Event[]) {
  const pageviews = events.filter((e) => e.event_type === 'pageview')
  const total = pageviews.length
  const byPath = new Map<string, { pv: number; sessions: Set<string> }>()
  for (const e of pageviews) {
    if (!e.path) continue
    if (!byPath.has(e.path)) byPath.set(e.path, { pv: 0, sessions: new Set() })
    const entry = byPath.get(e.path)!
    entry.pv++
    if (e.session_id) entry.sessions.add(e.session_id)
  }
  return Array.from(byPath.entries())
    .map(([path, { pv, sessions }]) => ({
      path,
      pageviews: pv,
      uniqueVisitors: sessions.size,
      percentage: total > 0 ? (pv / total) * 100 : 0,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
}

function computeEntryExit(events: Event[]) {
  const sessionMap = new Map<string, Event[]>()
  for (const e of events) {
    if (!e.session_id || e.event_type !== 'pageview') continue
    if (!sessionMap.has(e.session_id)) sessionMap.set(e.session_id, [])
    sessionMap.get(e.session_id)!.push(e)
  }
  const entries = new Map<string, number>()
  const exits = new Map<string, number>()
  for (const sEvents of sessionMap.values()) {
    const sorted = sEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const first = sorted[0].path || '/'
    const last = sorted[sorted.length - 1].path || '/'
    entries.set(first, (entries.get(first) || 0) + 1)
    exits.set(last, (exits.get(last) || 0) + 1)
  }
  return {
    entryPages: Array.from(entries.entries()).sort((a, b) => b[1] - a[1]),
    exitPages: Array.from(exits.entries()).sort((a, b) => b[1] - a[1]),
  }
}

function computeSources(events: Event[], _domain: string) {
  void _domain
  const SEARCH_HOSTS = ['google', 'bing', 'duckduckgo', 'yahoo', 'yandex', 'baidu', 'ecosia']
  const SOCIAL_HOSTS = ['instagram', 'facebook', 'tiktok', 'twitter', 'x.com', 't.co', 'linkedin', 'pinterest', 'youtube', 'reddit', 'snapchat']

  let directCount = 0
  let searchCount = 0
  let socialCount = 0
  let referralCount = 0
  const byRef = new Map<string, number>()

  for (const e of events) {
    if (e.event_type !== 'pageview') continue
    const host = e.referrer ? safeHost(e.referrer) : 'Direct'
    byRef.set(host, (byRef.get(host) || 0) + 1)
    if (host === 'Direct') directCount++
    else if (SEARCH_HOSTS.some((s) => host.toLowerCase().includes(s))) searchCount++
    else if (SOCIAL_HOSTS.some((s) => host.toLowerCase().includes(s))) socialCount++
    else referralCount++
  }

  return {
    directCount,
    searchCount,
    socialCount,
    referralCount,
    topReferrers: Array.from(byRef.entries()).sort((a, b) => b[1] - a[1]),
    allReferrers: Array.from(byRef.entries()).sort((a, b) => b[1] - a[1]),
  }
}

function computeDevices(events: Event[]) {
  const deviceTypes = new Map<string, number>()
  const browsers = new Map<string, number>()
  const os = new Map<string, number>()
  const countries = new Map<string, number>()

  for (const e of events) {
    if (e.user_agent) {
      const ua = parseUserAgent(e.user_agent)
      const dtLabel = ua.deviceType === 'mobile' ? '📱 Mobile' : ua.deviceType === 'tablet' ? '🖥 Tablette' : '💻 Desktop'
      deviceTypes.set(dtLabel, (deviceTypes.get(dtLabel) || 0) + 1)
      browsers.set(ua.browser, (browsers.get(ua.browser) || 0) + 1)
      os.set(ua.os, (os.get(ua.os) || 0) + 1)
    }
    if (e.country) countries.set(e.country, (countries.get(e.country) || 0) + 1)
  }

  return {
    deviceTypes: Array.from(deviceTypes.entries()).sort((a, b) => b[1] - a[1]),
    browsers: Array.from(browsers.entries()).sort((a, b) => b[1] - a[1]),
    os: Array.from(os.entries()).sort((a, b) => b[1] - a[1]),
    countries: Array.from(countries.entries()).sort((a, b) => b[1] - a[1]),
  }
}

// ════════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════════

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Direct'
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return '< 1s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

