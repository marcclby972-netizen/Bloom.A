'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/context'
import { useAuth } from '@/lib/supabase/use-auth'
import { AI_NAME } from '@/lib/types'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
        <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
        <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
        <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/todos',
    label: 'To-Do',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6.5l2 2 4-4" />
        <path d="M4 13.5l2 2 4-4" />
        <path d="M14 7h4" />
        <path d="M14 14h4" />
      </svg>
    ),
  },
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="4.5" height="14" rx="1.5" />
        <rect x="7.75" y="3" width="4.5" height="10" rx="1.5" />
        <rect x="13.5" y="3" width="4.5" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/calendrier',
    label: 'Calendrier',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="3.5" width="15" height="14" rx="2" />
        <path d="M2.5 8h15" />
        <path d="M6.5 1.5v3" />
        <path d="M13.5 1.5v3" />
        <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 5.5a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-9Z" />
      </svg>
    ),
  },
  {
    href: '/contacts',
    label: 'Contacts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3 17.5c0-3.5 3-6.5 7-6.5s7 3 7 6.5" />
      </svg>
    ),
  },
  {
    href: '/marketing',
    label: 'Marketing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 10l3-7 4 14 3-7h3" />
        <circle cx="2.5" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/vocal',
    label: 'Vocal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="6" height="10" rx="3" />
        <path d="M4 10a6 6 0 0 0 12 0" />
        <path d="M10 16v2" />
        <path d="M7 18h6" />
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17V11" />
        <path d="M7 17V7" />
        <path d="M11 17V9" />
        <path d="M15 17V4" />
      </svg>
    ),
  },
  {
    href: '/vault',
    label: 'Coffre-fort',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="14" height="10" rx="2" />
        <path d="M6 8V6a4 4 0 0 1 8 0v2" />
        <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/integrations-guide',
    label: 'Guide',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3a1.5 1.5 0 0 1 1.5-1.5h8L17 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 16.5v-13.5Z" />
        <path d="M13.5 1.5V5H17" />
        <path d="M7 9h6M7 12h6M7 15h4" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { chatOpen, setChatOpen, mobileMenuOpen, setMobileMenuOpen } = useApp()
  const { user, signOut } = useAuth()
  const [expanded, setExpanded] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          // Mobile-only drawer — replaced on desktop by TopPillNav
          'md:hidden flex h-full flex-col border-r border-border bg-background py-4 transition-transform duration-200 ease-in-out shrink-0',
          'fixed inset-y-0 left-0 z-50 w-56 shadow-2xl',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      {/* Header: logo only (no "Bloom" wordmark) */}
      <div className={cn('flex items-center mb-4 px-3', expanded ? 'justify-between' : 'md:justify-center justify-between')}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src="/bloom-logo.png" alt="Bloom" width={28} height={28} className="rounded-md shrink-0" />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'h-7 w-7 hidden md:flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0',
            !expanded && 'mt-3'
          )}
          title={expanded ? 'Réduire' : 'Agrandir'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn('transition-transform duration-200', expanded ? 'rotate-0' : 'rotate-180')}
          >
            <path d="M10.5 3 5.5 8l5 5" />
          </svg>
        </button>
      </div>

      <nav className={cn('flex flex-1 flex-col gap-0.5 px-2', !expanded && 'md:items-center md:px-0')}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg transition-all h-9 gap-2.5 px-2.5',
                !expanded && 'md:w-9 md:px-0 md:justify-center',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={cn('text-xs font-medium truncate', !expanded && 'md:hidden')}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={cn('flex flex-col gap-0.5 px-2', !expanded && 'md:items-center md:px-0')}>
        {/* Settings */}
        <Link
          href="/settings"
          title={!expanded ? 'Paramètres' : undefined}
          className={cn(
            'flex items-center rounded-lg transition-all h-9 gap-2.5 px-2.5',
            !expanded && 'md:w-9 md:px-0 md:justify-center',
            pathname.startsWith('/settings')
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="shrink-0">
            {/* Settings icon — minimal slider/control style */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="13" y2="6" />
              <line x1="17" y1="6" x2="17" y2="6" />
              <circle cx="15" cy="6" r="2" />
              <line x1="3" y1="14" x2="7" y2="14" />
              <line x1="11" y1="14" x2="17" y2="14" />
              <circle cx="9" cy="14" r="2" />
            </svg>
          </span>
          <span className={cn('text-xs font-medium truncate', !expanded && 'md:hidden')}>Paramètres</span>
        </Link>

        {/* AI Chat toggle */}
        <button
          title={!expanded ? AI_NAME : undefined}
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            'flex items-center rounded-lg transition-all h-9 gap-2.5 px-2.5',
            !expanded && 'md:w-9 md:px-0 md:justify-center',
            chatOpen
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="shrink-0">
            {/* AI icon — minimal speech-bubble with spark */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.5 3v-3H5a2 2 0 0 1-2-2v-7Z" />
              <path d="M10 6.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7L10 6.5Z" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className={cn('text-xs font-medium truncate', !expanded && 'md:hidden')}>{AI_NAME}</span>
        </button>

        {/* User / Logout */}
        {user && (
          <>
            <div className="h-px bg-border my-1" />
            <button
              title={!expanded ? 'Déconnexion' : undefined}
              onClick={signOut}
              className={cn(
                'flex items-center rounded-lg transition-all text-muted-foreground hover:bg-muted hover:text-foreground h-9 gap-2.5 px-2.5',
                !expanded && 'md:w-9 md:px-0 md:justify-center',
              )}
            >
              <span className="shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
                  <path d="M13 14l4-4-4-4" />
                  <path d="M17 10H8" />
                </svg>
              </span>
              <span className={cn('text-xs font-medium truncate', !expanded && 'md:hidden')}>Déconnexion</span>
            </button>
          </>
        )}
      </div>
    </aside>
    </>
  )
}
