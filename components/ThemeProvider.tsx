'use client'

/**
 * ThemeProvider — pilote le `data-theme="light|dark"` sur <html> selon la
 * préférence utilisateur stockée dans localStorage ('bloom_theme') et la
 * media query `prefers-color-scheme` quand le mode 'system' est sélectionné.
 *
 * Synchronisé entre onglets via storage events.
 * Reagit aussi quand le user change ses préférences OS pendant la session.
 */

import { useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'bloom_theme'
const DEFAULT_MODE: ThemeMode = 'dark'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return DEFAULT_MODE
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme()
  // Notifie les autres composants qui écoutent via storage event (sync onglets +
  // re-render du sélecteur côté settings).
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return mode
}

export function applyTheme(): void {
  if (typeof window === 'undefined') return
  const mode = getStoredTheme()
  const resolved = resolveTheme(mode)
  const html = document.documentElement
  html.setAttribute('data-theme', resolved)
  // Compat legacy : certaines feuilles utilisent encore `.dark`
  html.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme()

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) applyTheme()
    }
    window.addEventListener('storage', onStorage)

    // Si l'utilisateur est en mode 'system', écouter la media query
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMedia = () => {
      if (getStoredTheme() === 'system') applyTheme()
    }
    mq.addEventListener('change', onMedia)

    return () => {
      window.removeEventListener('storage', onStorage)
      mq.removeEventListener('change', onMedia)
    }
  }, [])

  return <>{children}</>
}
