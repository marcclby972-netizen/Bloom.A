'use client'

import { usePathname } from 'next/navigation'
import { AppProvider, useApp } from '@/lib/context'
import { Sidebar } from './Sidebar'
import { TimerWidget } from '@/components/timer/TimerWidget'
import { ChatPanel } from '@/components/ai/ChatPanel'

const PUBLIC_ROUTES = ['/login']

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
      <div className="flex-1 flex flex-col overflow-hidden gradient-mesh">
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
        <TimerWidget />
      </div>
      {chatOpen && <ChatPanel />}
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
