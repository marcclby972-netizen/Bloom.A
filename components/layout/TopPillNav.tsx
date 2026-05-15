'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/context'
import { useAuth } from '@/lib/supabase/use-auth'
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
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/vocal', label: 'Vocal' },
  { href: '/stats', label: 'Stats' },
  { href: '/vault', label: 'Coffre-fort' },
  { href: '/integrations-guide', label: 'Guide' },
  { href: '/settings', label: 'Paramètres' },
] as const

/**
 * Floating pill navigation — Teplin-style.
 *
 * Layout: fixed top-center pill containing logo + 5 primary items + "Plus" overflow menu.
 * On the right side, a separate floating dark pill with avatar + Iris (AI chat) toggle.
 *
 * - Backdrop blur + cream/dark adaptive bg
 * - z-[60] above page content (notification bell is z-[60] too — bell sits in
 *   its own corner, no overlap risk thanks to layout)
 * - On mobile (< md), hidden — the existing MobileHeader + drawer take over.
 */
export function TopPillNav() {
  const pathname = usePathname()
  const { chatOpen, setChatOpen } = useApp()
  const { user, signOut } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close "Plus" menu on outside click
  useEffect(() => {
    if (!moreOpen) return
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen])

  // Close on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const userInitial = user?.email?.[0]?.toUpperCase() || '·'

  return (
    <>
      {/* ── Center pill (logo + nav) ────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-[60] items-center gap-1 px-1.5 h-12 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-border"
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Bloom — accueil"
          className="h-9 w-9 ml-0.5 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <Image src="/bloom-logo.png" alt="Bloom" width={20} height={20} className="rounded" />
        </Link>

        {/* Vertical divider */}
        <span className="h-5 w-px bg-border mx-1" />

        {/* Primary items */}
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'h-9 px-3 inline-flex items-center text-[13px] font-medium tracking-tight rounded-full transition-colors uppercase',
                active
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}

        {/* "Plus" overflow menu */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'h-9 px-3 inline-flex items-center gap-1 text-[13px] font-medium tracking-tight rounded-full transition-colors uppercase',
              moreOpen ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            Plus
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={cn('transition-transform', moreOpen && 'rotate-180')}
            >
              <path d="M2 4l3 3 3-3" />
            </svg>
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute top-full right-0 mt-3 min-w-[180px] py-1.5 rounded-2xl bg-background border border-border shadow-xl"
            >
              {SECONDARY_NAV.map((item) => {
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

      {/* ── Right-side dark CTA pill (Iris + avatar) ─────────────── */}
      <div className="hidden md:flex fixed top-4 right-4 z-[60] items-center gap-2 pl-1 pr-1 h-12 rounded-full bg-foreground text-background shadow-lg">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="h-10 px-4 inline-flex items-center gap-2 text-[13px] font-medium tracking-tight rounded-full hover:bg-white/10 transition-colors"
          aria-label={`Ouvrir ${AI_NAME}`}
        >
          <svg
            width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M10 2l2 4.5h-4L10 2Z" />
            <path d="M6 8l-2 4.5h4L6 8Z" />
            <path d="M14 8l2 4.5h-4L14 8Z" />
            <circle cx="10" cy="16" r="2" />
          </svg>
          {AI_NAME}
        </button>
        <Link
          href="/settings"
          className="h-10 w-10 rounded-full inline-flex items-center justify-center bg-background/15 text-background text-[12px] font-semibold hover:bg-background/25 transition-colors"
          title={user?.email || 'Profil'}
        >
          {userInitial}
        </Link>
      </div>
    </>
  )
}
