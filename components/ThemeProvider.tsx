'use client'

import { useEffect, useState } from 'react'
import { store } from '@/lib/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    applyTheme()

    // Listen for settings changes via storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bloom_settings') applyTheme()
    }
    window.addEventListener('storage', handleStorage)

    // Also listen for media query changes when theme is 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMedia = () => applyTheme()
    mq.addEventListener('change', handleMedia)

    return () => {
      window.removeEventListener('storage', handleStorage)
      mq.removeEventListener('change', handleMedia)
    }
  }, [])

  return <>{children}</>
}

export function applyTheme() {
  if (typeof window === 'undefined') return
  const settings = store.getSettings()
  const html = document.documentElement

  // Theme
  if (settings.theme === 'dark') {
    html.classList.add('dark')
  } else if (settings.theme === 'light') {
    html.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Font — always Montserrat, no picker.
  // We force it via inline style so it overrides any other CSS variable
  // (and any stale `settings.font` left over from when the picker existed).
  html.style.setProperty('--font-sans', 'var(--font-montserrat)')
}
