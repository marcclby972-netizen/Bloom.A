'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/context'
import { useAuth } from '@/lib/supabase/use-auth'
import { isAdmin } from '@/lib/admin'
import { AI_NAME } from '@/lib/types'
import { cn } from '@/lib/utils'

const PRIMARY_NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/projects', label: 'Projets' },
  { href: '/todos', label: 'To-Do' },
  { href: '/calendrier', label: 'Calendrier' },
  { href: '/marketing', label: 'Marketing' },
] as const

const SECONDARY_NAV = [
  { href: '/pipeline', label: 'Pipeline', adminOnly: false },
  { href: '/contacts', label: 'Contacts', adminOnly: false },
  { href: '/vocal', label: 'Vocal', adminOnly: false },
  { href: '/stats', label: 'Stats', adminOnly: false },
  { href: '/chrono', label: 'Chrono', adminOnly: false },
  { href: '/vault', label: 'Coffre-fort', adminOnly: false },
  { href: '/integrations-guide', label: 'Guide intégrations', adminOnly: true },
  { href: '/settings', label: 'Paramètres', adminOnly: false },
] as const

const WORKSPACES = [
  { id: 'solo', label: 'Espace personnel', hint: 'Tes projets perso' },
  { id: 'shared', label: 'Espace partagé', hint: 'Projets en commun' },
] as const

const WORKSPACE_KEY = 'bloom_active_workspace'

/**
 * Floating pill navigation — Teplin-style.
 *
 * Layout:
 * - Center pill: workspace selector + logo + 5 primary items + Plus dropdown
 * - Right tab: iPhone-radius subtle white container with Iris (AI) + avatar
 *
 * Hidden on mobile (existing drawer + MobileHeader take over).
 */
export function TopPillNav() {
  const pathname = usePathname()
  const { chatOpen, setChatOpen } = useApp()
  const { user, signOut } = useAuth()
  const userIsAdmin = isAdmin(user?.email)

  const [moreOpen, setMoreOpen] = useState(false)
  const [wsOpen, setWsOpen] = useState(false)
  const [activeWs, setActiveWs] = useState<string>('solo')
  const moreRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<HTMLDivElement>(null)

  // Persist + restore active workspace
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(WORKSPACE_KEY)
    if (saved && WORKSPACES.some((w) => w.id === saved)) setActiveWs(saved)
  }, [])
  const switchWs = (id: string) => {
    setActiveWs(id)
    setWsOpen(false)
    if (typeof window !== 'undefined') localStorage.setItem(WORKSPACE_KEY, id)
  }

  // Close menus on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
      if (wsOpen && wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setWsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen, wsOpen])

  // Close on route change
  useEffect(() => {
    setMoreOpen(false)
    setWsOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const userInitial = user?.email?.[0]?.toUpperCase() || '·'
  const activeWsLabel = WORKSPACES.find((w) => w.id === activeWs)?.label || 'Espace'
  const visibleSecondary = SECONDARY_NAV.filter((item) => !item.adminOnly || userIsAdmin)

  return (
    <>
      {/* ── Workspace selector (top-left, separate from main pill) ── */}
      <div ref={wsRef} className="hidden md:block fixed top-4 left-[88px] z-[60]">
        <button
          onClick={() => setWsOpen((v) => !v)}
          className="h-12 px-4 inline-flex items-center gap-2.5 rounded-full bg-background/85 backdrop-blur-md shadow-lg border border-border hover:bg-background transition-colors"
          aria-haspopup="menu"
          aria-expanded={wsOpen}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[13px] font-medium tracking-tight">{activeWsLabel}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn('transition-transform text-muted-foreground', wsOpen && 'rotate-180')}>
            <path d="M2 4l3 3 3-3" />
          </svg>
        </button>

        {wsOpen && (
          <div role="menu" className="absolute top-full left-0 mt-3 min-w-[220px] py-2 rounded-2xl bg-background border border-border shadow-xl">
            {WORKSPACES.map((ws) => {
              const isCurrent = ws.id === activeWs
              return (
                <button
                  key={ws.id}
                  onClick={() => switchWs(ws.id)}
                  role="menuitem"
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-2.5 transition-colors',
                    isCurrent ? 'bg-secondary' : 'hover:bg-secondary/60'
                  )}
                >
                  <span className={cn(
                    'h-2 w-2 rounded-full mt-1.5 shrink-0',
                    isCurrent ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                  )} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{ws.label}</div>
                    <div className="text-[11px] text-muted-foreground">{ws.hint}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Center pill (logo + nav) ────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-[60] items-center gap-1 px-1.5 h-12 rounded-full bg-background/85 backdrop-blur-md shadow-lg border border-border"
      >
        <Link
          href="/"
          aria-label="Bloom — accueil"
          className="h-9 w-9 ml-0.5 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <Image src="/bloom-logo.png" alt="Bloom" width={20} height={20} className="rounded" />
        </Link>

        <span className="h-5 w-px bg-border mx-1" />

        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'h-9 px-3 inline-flex items-center text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase',
                active
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}

        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'h-9 px-3 inline-flex items-center gap-1 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase',
              moreOpen ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            Plus
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={cn('transition-transform', moreOpen && 'rotate-180')}>
              <path d="M2 4l3 3 3-3" />
            </svg>
          </button>

          {moreOpen && (
            <div role="menu" className="absolute top-full right-0 mt-3 min-w-[210px] py-1.5 rounded-2xl bg-background border border-border shadow-xl">
              {visibleSecondary.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={cn(
                      'flex items-center px-4 py-2 text-[13px] font-medium transition-colors',
                      active
                        ? 'text-foreground bg-secondary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              {user && (
                <>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={signOut}
                    role="menuitem"
                    className="w-full text-left flex items-center px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Right lateral tab : vertical, detached from edge ────── */}
      {/* iPhone-radius (rounded-[22px]), positioned vertically centered,
          right-6 = 24px from right edge (detached) instead of right-4 = 16px.
          Stack: Iris button on top, avatar/profile at bottom. */}
      <div className="hidden md:flex fixed top-1/2 -translate-y-1/2 right-6 z-[60] flex-col items-center gap-1 px-1 py-1 w-12 rounded-[22px] bg-background/90 backdrop-blur-md shadow-lg border border-border">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            'h-10 w-10 inline-flex items-center justify-center rounded-[18px] transition-colors',
            chatOpen ? 'bg-foreground text-background' : 'hover:bg-secondary text-foreground'
          )}
          aria-label={`Ouvrir ${AI_NAME}`}
          title={AI_NAME}
        >
          {/* AI icon — speech bubble + spark */}
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.5 3v-3H5a2 2 0 0 1-2-2v-7Z" />
            <path d="M10 6.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7L10 6.5Z" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <Link
          href="/chrono"
          className="h-10 w-10 inline-flex items-center justify-center rounded-[18px] transition-colors hover:bg-secondary text-foreground"
          title="Chrono"
          aria-label="Chrono"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="11" r="6.5" />
            <path d="M10 11V7" />
            <path d="M8 2.5h4" />
            <path d="M10 2.5v2" />
          </svg>
        </Link>

        <div className="h-px w-6 bg-border my-0.5" />

        <Link
          href="/settings"
          className="h-10 w-10 rounded-[18px] inline-flex items-center justify-center bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity"
          title={user?.email || 'Profil'}
        >
          {userInitial}
        </Link>
      </div>
    </>
  )
}
