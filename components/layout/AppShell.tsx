'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/context'
import { Sidebar } from './Sidebar'
import { TimerWidget } from '@/components/timer/TimerWidget'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const PUBLIC_ROUTES = ['/login']

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
      <div className="flex items-center gap-2">
        <Image src="/bloom-logo.png" alt="Bloom" width={22} height={22} className="rounded-md" />
        <span className="text-sm font-semibold">Bloom</span>
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
 * Floating notification bell pinned to the top-right of the viewport.
 * - Hidden on mobile (the bell is in MobileHeader instead)
 * - z-[60] keeps it above page content and dialogs
 * - pointer-events: none on the wrapper so the area around the bell stays
 *   click-through; only the bell itself catches clicks via pointer-events-auto.
 *   This prevents the bell from blocking page buttons that happen to live in
 *   the same top-right corner.
 * - backdrop-blur + semi-transparent bg so the bell stays readable even
 *   when text or buttons sit underneath.
 */
function DesktopBell() {
  return (
    <div className="hidden md:block fixed top-3 right-4 z-[60] pointer-events-none">
      <div className="pointer-events-auto bg-background/85 backdrop-blur-md rounded-full shadow-lg border border-border/60">
        <NotificationBell />
      </div>
    </div>
  )
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { chatOpen } = useApp()

  // Public routes (login, etc.) render without the app shell
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen relative noise">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden gradient-mesh min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {children}
        </main>
        <TimerWidget />
      </div>
      {chatOpen && <ChatPanel />}
      <DesktopBell />
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
