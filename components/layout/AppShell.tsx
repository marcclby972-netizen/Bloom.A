'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/context'
import { Sidebar } from './Sidebar'
import { TopPillNav } from './TopPillNav'
import { TimerWidget } from '@/components/timer/TimerWidget'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { CookieBanner } from '@/components/cookies/CookieBanner'

// Public routes — landing, login, onboarding (no app nav, no sidebar)
const PUBLIC_ROUTES = ['/', '/login', '/onboard']
// Routes légales — full-width sans sidebar mais doivent garder la bannière cookies
const LEGAL_ROUTES = ['/privacy', '/terms', '/cookies', '/pricing']
// Full-bleed routes — la page apporte son propre chrome (sidebar/topbar)
// via `DashboardShell` (cf. app/dashboard/_components/DashboardShell.tsx).
// AppShell se contente de rendre children + bandeau cookies.
const FULL_BLEED_ROUTES = [
  '/dashboard',
  '/settings',
  '/projects',
  '/tasks',
  '/chrono',
  '/calendrier',
  '/decisions',
]
const FULL_BLEED_PREFIXES = ['/projects/', '/decisions/']

function MobileHeader() {
  const { setMobileMenuOpen, chatOpen, setChatOpen } = useApp()
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border bg-background px-3 h-12 shrink-0">
      <button
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Ouvrir le menu"
        className="h-8 w-8 flex items-center justify-center rounded-md text-foreground hover:bg-muted"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <div className="flex items-center">
        <Image src="/bloom-logo-blanc.png" alt="Bloom" width={22} height={22} className="rounded-md" />
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={() => setChatOpen(!chatOpen)}
          aria-label="Iris"
          className="h-8 w-8 flex items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2l2 4.5h-4L10 2Z" />
            <path d="M6 8l-2 4.5h4L6 8Z" />
            <path d="M14 8l2 4.5h-4L14 8Z" />
            <circle cx="10" cy="16" r="2" />
          </svg>
        </button>
      </div>
    </header>
  )
}

/**
 * Floating notification bell — pinned to the top-left of the viewport.
 * Lives opposite to the TopPillNav's right CTA (Iris+avatar) so the two
 * floating elements never collide.
 *
 * - Hidden on mobile (the bell lives in MobileHeader instead)
 * - z-[60] keeps it above page content and dialogs
 * - pointer-events: none on the wrapper so the area around the bell stays
 *   click-through; only the bell itself catches clicks via pointer-events-auto.
 * - cream/dark adaptive bg via design tokens
 */
function DesktopBell() {
  return (
    <div className="hidden md:block fixed top-4 left-4 z-[60] pointer-events-none">
      <div className="pointer-events-auto bg-background/85 backdrop-blur-md rounded-full shadow-lg border border-border h-12 flex items-center px-1">
        <NotificationBell />
      </div>
    </div>
  )
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { chatOpen } = useApp()

  // Public routes (login, etc.) render without the app shell, but still need the
  // cookie banner so visitors landing on a public page can consent.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return (
      <>
        {children}
        <CookieBanner />
      </>
    )
  }

  // Legal routes render full-width (no sidebar/timer/chat) but keep the banner.
  if (LEGAL_ROUTES.includes(pathname)) {
    return (
      <>
        {children}
        <CookieBanner />
      </>
    )
  }

  // Full-bleed pages — la page rend son propre chrome via DashboardShell.
  // On garde uniquement la bannière cookies.
  const isFullBleed =
    FULL_BLEED_ROUTES.includes(pathname) ||
    FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p))
  if (isFullBleed) {
    return (
      <>
        {children}
        <CookieBanner />
      </>
    )
  }

  return (
    <div className="flex h-screen relative">
      {/* Desktop : full-width content, floating top pill nav above */}
      {/* Mobile : keep the existing drawer (Sidebar) + MobileHeader */}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MobileHeader />
        {/* Pad top on desktop so content doesn't slide under the floating pill nav */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0 md:pt-20">
          {children}
        </main>
        <TimerWidget />
      </div>
      <TopPillNav />
      <DesktopBell />
      {chatOpen && <ChatPanel />}
      <CookieBanner />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ShellInner>{children}</ShellInner>
    </AppProvider>
  )
}
