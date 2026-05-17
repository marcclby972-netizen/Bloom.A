'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/context'
import { PLATFORMS } from '@/lib/types'
import { formatDateFr } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { PostEditor } from '@/components/marketing/PostEditor'
import { SocialImportModal } from '@/components/marketing/SocialImportModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import type { Post } from '@/lib/types'

type Tab = 'posts' | 'stats'

export default function MarketingPage() {
  const { posts } = useApp()
  const [tab, setTab] = useState<Tab>('posts')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | undefined>()
  const [importOpen, setImportOpen] = useState(false)

  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setEditorOpen(true)
  }

  const handleNew = () => {
    setEditingPost(undefined)
    setEditorOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Marketing</h1>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {([
              { value: 'posts' as const, label: 'Posts' },
              { value: 'stats' as const, label: 'Statistiques' },
            ]).map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  tab === t.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setImportOpen(true)} variant="outline" className="gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8" />
              <path d="M3.5 5.5L7 9l3.5-3.5" />
              <path d="M2 12h10" />
            </svg>
            Importer
          </Button>
          <Button onClick={handleNew} className="gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            Nouveau post
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'posts' ? (
          <PostsList posts={posts} onEdit={handleEdit} onNew={handleNew} />
        ) : (
          <StatsView posts={posts} />
        )}
      </div>

      <PostEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditingPost(undefined) }} post={editingPost} />
      <SocialImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function PostsList({ posts, onEdit, onNew }: { posts: Post[]; onEdit: (p: Post) => void; onNew: () => void }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-muted-foreground">
            <path d="M15 4 6 7.5H3.5a1.5 1.5 0 0 0-1.5 1.5v2a1.5 1.5 0 0 0 1.5 1.5H6L15 16V4Z" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1">Aucun post enregistré</p>
        <p className="text-xs text-muted-foreground mb-4">Commencez à suivre vos publications sur les réseaux</p>
        <Button onClick={onNew} className="gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1v12M1 7h12" />
          </svg>
          Créer un post
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const plat = PLATFORMS.find((p) => p.value === post.platform)
        const engagement = post.metrics.likes + post.metrics.comments + post.metrics.shares
        return (
          <div
            key={post.id}
            className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => onEdit(post)}
          >
            {/* Platform badge */}
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: plat?.color }}
            >
              {plat?.label.slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{post.title}</span>
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full',
                  post.type === 'paid'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                )}>
                  {post.type === 'paid' ? 'Payant' : 'Organique'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span style={{ color: plat?.color }} className="font-medium">{plat?.label}</span>
                <span className="opacity-40">·</span>
                <span>{formatDateFr(new Date(post.publishedAt))}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex gap-5 text-xs shrink-0">
              <MetricCell label="Impressions" value={post.metrics.impressions} />
              <MetricCell label="Engagement" value={engagement} />
              <MetricCell label="Clics" value={post.metrics.clicks} />
              {post.type === 'paid' && (
                <MetricCell label="Dépense" value={post.metrics.spend} suffix="€" />
              )}
            </div>

            {/* Edit hint */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 12 6-6-6-6" />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetricCell({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="text-center min-w-[60px]">
      <div className="font-semibold text-foreground tabular-nums">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-muted-foreground text-[10px]">{label}</div>
    </div>
  )
}

function StatsView({ posts }: { posts: Post[] }) {
  const totalImpressions = posts.reduce((s, p) => s + p.metrics.impressions, 0)
  const totalReach = posts.reduce((s, p) => s + p.metrics.reach, 0)
  const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0)
  const totalComments = posts.reduce((s, p) => s + p.metrics.comments, 0)
  const totalShares = posts.reduce((s, p) => s + p.metrics.shares, 0)
  const totalClicks = posts.reduce((s, p) => s + p.metrics.clicks, 0)
  const totalEngagement = totalLikes + totalComments + totalShares
  const totalSpend = posts.filter((p) => p.type === 'paid').reduce((s, p) => s + p.metrics.spend, 0)
  const totalConversions = posts.reduce((s, p) => s + p.metrics.conversions, 0)
  const organicCount = posts.filter((p) => p.type === 'organic').length
  const paidCount = posts.filter((p) => p.type === 'paid').length
  const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(1) : '0'
  const cpc = totalClicks > 0 && totalSpend > 0 ? (totalSpend / totalClicks).toFixed(2) : '—'
  const costPerConversion = totalConversions > 0 && totalSpend > 0 ? (totalSpend / totalConversions).toFixed(2) : '—'

  const byPlatform = useMemo(() => {
    const map: Record<string, { name: string; color: string; impressions: number; engagement: number; clicks: number; conversions: number; count: number }> = {}
    for (const post of posts) {
      const plat = PLATFORMS.find((p) => p.value === post.platform)
      if (!map[post.platform]) {
        map[post.platform] = { name: plat?.label || post.platform, color: plat?.color || '#6B7280', impressions: 0, engagement: 0, clicks: 0, conversions: 0, count: 0 }
      }
      map[post.platform].impressions += post.metrics.impressions
      map[post.platform].engagement += post.metrics.likes + post.metrics.comments + post.metrics.shares
      map[post.platform].clicks += post.metrics.clicks
      map[post.platform].conversions += post.metrics.conversions
      map[post.platform].count++
    }
    return Object.values(map)
  }, [posts])

  const engagementBreakdown = [
    { name: 'Likes', value: totalLikes, color: '#ef4444' },
    { name: 'Commentaires', value: totalComments, color: '#3b82f6' },
    { name: 'Partages', value: totalShares, color: '#10b981' },
  ].filter((d) => d.value > 0)

  const typeData = [
    { name: 'Organique', value: organicCount, color: '#10B981' },
    { name: 'Payant', value: paidCount, color: '#F59E0B' },
  ].filter((d) => d.value > 0)

  const postsByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const post of posts) {
      // publishedAt may be ISO string, ms number, or Date — coerce to YYYY-MM
      const raw = (post as unknown as { publishedAt: unknown }).publishedAt
      let month = ''
      if (typeof raw === 'string') month = raw.slice(0, 7)
      else if (typeof raw === 'number' && Number.isFinite(raw)) month = new Date(raw).toISOString().slice(0, 7)
      else if (raw instanceof Date) month = raw.toISOString().slice(0, 7)
      if (!month) continue
      map[month] = (map[month] || 0) + 1
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), count }))
  }, [posts])

  return (
    <div className="space-y-6">
      {/* KPI cards — row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total posts" value={String(posts.length)} />
        <KpiCard label="Impressions" value={totalImpressions.toLocaleString()} />
        <KpiCard label="Portée" value={totalReach.toLocaleString()} />
        <KpiCard label="Engagement" value={totalEngagement.toLocaleString()} accent />
      </div>

      {/* KPI cards — row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Taux d'engagement" value={`${engagementRate}%`} accent />
        <KpiCard label="Clics" value={totalClicks.toLocaleString()} />
        <KpiCard label="Conversions" value={String(totalConversions)} />
        <KpiCard label="Dépenses ads" value={`${totalSpend}€`} />
      </div>

      {/* KPI cards — row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="CPC moyen" value={cpc !== '—' ? `${cpc}€` : '—'} />
        <KpiCard label="Coût / conversion" value={costPerConversion !== '—' ? `${costPerConversion}€` : '—'} />
        <KpiCard
          label="ROI ads"
          value={totalSpend > 0 ? `${((totalConversions / totalSpend) * 100).toFixed(0)}%` : '—'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Par plateforme (impressions)</CardTitle></CardHeader>
          <CardContent>
            {byPlatform.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <Bar dataKey="impressions" name="Impressions" fill="oklch(0.55 0.17 50)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Engagement par plateforme</CardTitle></CardHeader>
          <CardContent>
            {byPlatform.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <Bar dataKey="engagement" name="Engagement" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Clics" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Répartition de l&apos;engagement</CardTitle></CardHeader>
          <CardContent>
            {engagementBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={engagementBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                      {engagementBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {engagementBreakdown.map((d) => (
                    <div key={d.name} className="flex items-center gap-2.5 text-xs">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart height={160} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Organique vs Payant</CardTitle></CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={typeData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                      {typeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {typeData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2.5 text-xs">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">{d.value} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart height={160} />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-sm">Fréquence de publication (6 derniers mois)</CardTitle></CardHeader>
          <CardContent>
            {postsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={postsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} formatter={(v) => [`${v} posts`, 'Posts']} />
                  <Bar dataKey="count" name="Posts" fill="oklch(0.55 0.17 50)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart height={180} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', accent && 'text-primary')}>
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div className={`flex items-center justify-center text-sm text-muted-foreground`} style={{ height }}>
      Aucune donnée
    </div>
  )
}
