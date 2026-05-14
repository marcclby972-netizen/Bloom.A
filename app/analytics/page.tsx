'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  const [error, setError] = useState('')

  const loadSites = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics/sites')
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      setSites(data.sites || [])
      if (!selectedSiteId && data.sites?.[0]) setSelectedSiteId(data.sites[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [selectedSiteId])

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }
      setNewName('')
      setNewDomain('')
      setCreating(false)
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

  // Aggregations
  const stats = useMemo(() => {
    const total = events.length
    const sessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size
    const pageviews = events.filter((e) => e.event_type === 'pageview').length

    const byPath = new Map<string, number>()
    const byReferrer = new Map<string, number>()
    const byCountry = new Map<string, number>()
    const byDate = new Map<string, number>()

    for (const e of events) {
      if (e.path) byPath.set(e.path, (byPath.get(e.path) || 0) + 1)
      const ref = (e.referrer && new URL(e.referrer).hostname) || 'Direct'
      byReferrer.set(ref, (byReferrer.get(ref) || 0) + 1)
      const country = e.country || 'Inconnu'
      byCountry.set(country, (byCountry.get(country) || 0) + 1)
      const day = new Date(e.created_at).toISOString().slice(0, 10)
      byDate.set(day, (byDate.get(day) || 0) + 1)
    }

    const sorted = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)

    return {
      total,
      sessions,
      pageviews,
      topPaths: sorted(byPath),
      topReferrers: sorted(byReferrer),
      topCountries: sorted(byCountry),
      byDate: Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)),
    }
  }, [events])

  const snippet = selectedSite
    ? `<script defer src="${typeof window !== 'undefined' ? window.location.origin : ''}/track.js" data-site="${selectedSite.id}"></script>`
    : ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
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
          <Button size="sm" onClick={() => setCreating(true)}>+ Site</Button>
        </div>
        <div className="h-px gradient-line" />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

        {/* Create form */}
        {creating && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Nouveau site</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input placeholder="Nom (ex: Mon blog)" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                <Input placeholder="Domaine (ex: monblog.com)" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>Annuler</Button>
                  <Button type="submit" size="sm" disabled={!newName.trim() || !newDomain.trim()}>Créer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : sites.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">Aucun site enregistré</p>
              <Button size="sm" onClick={() => setCreating(true)}>Ajouter ton premier site</Button>
              <p className="text-[10px] text-muted-foreground">
                Note : exécute la migration <code className="bg-muted px-1 rounded">supabase/migrations/20260514_tracking_analytics.sql</code> sur ton projet Supabase d&apos;abord.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Site tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2">
              {sites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    selectedSiteId === site.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{site.name}</span>
                  <span className="text-[10px] opacity-70">{site.domain}</span>
                </button>
              ))}
            </div>

            {selectedSite && (
              <>
                {/* Period selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 7, 14, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                        days === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {d === 1 ? '24h' : `${d} jours`}
                    </button>
                  ))}
                  <Button
                    size="xs"
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => handleDelete(selectedSite.id)}
                  >
                    Supprimer le site
                  </Button>
                </div>

                {/* Snippet */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Snippet à coller</CardTitle>
                    <CardDescription>Ajoute ceci dans le <code>&lt;head&gt;</code> de ton site</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-[11px] break-all relative">
                      {snippet}
                      <button
                        onClick={() => navigator.clipboard?.writeText(snippet)}
                        className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-background border border-border hover:bg-muted"
                      >
                        Copier
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <Kpi label="Pageviews" value={stats.pageviews} />
                  <Kpi label="Sessions" value={stats.sessions} />
                  <Kpi label="Événements" value={stats.total} accent />
                </div>

                {/* Daily chart */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Évolution</CardTitle></CardHeader>
                  <CardContent>
                    <DailyChart data={stats.byDate} />
                  </CardContent>
                </Card>

                {/* Top tables */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TopList title="Pages" data={stats.topPaths} />
                  <TopList title="Sources" data={stats.topReferrers} />
                  <TopList title="Pays" data={stats.topCountries} />
                </div>

                {eventsLoading && <p className="text-xs text-muted-foreground">Chargement des événements...</p>}
                {!eventsLoading && events.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Aucun événement reçu — colle le snippet sur ton site et attends les premières visites.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className={cn(accent && 'border-primary/40')}>
      <CardContent className="p-3 sm:p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums mt-0.5">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  )
}

function DailyChart({ data }: { data: [string, number][] }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground italic py-4">Aucune donnée</p>
  const max = Math.max(...data.map(([, v]) => v), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map(([day, count]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full bg-primary/60 rounded-t hover:bg-primary transition-colors"
            style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
            title={`${day}: ${count}`}
          />
          <span className="text-[8px] text-muted-foreground truncate w-full text-center">{day.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

function TopList({ title, data }: { title: string; data: [string, number][] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aucune donnée</p>
        ) : (
          <div className="space-y-1">
            {data.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="truncate flex-1" title={key}>{key}</span>
                <span className="font-medium tabular-nums shrink-0">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
