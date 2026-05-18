'use client'

/**
 * SettingsNav — sticky left rail avec scroll-spy.
 * Active state mis à jour automatiquement quand une section devient visible
 * (IntersectionObserver) ou quand on clique sur un lien (smooth scroll).
 */

import { useEffect, useRef, useState } from 'react'

export type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  teamOnly?: boolean
}

export function SettingsNav({
  items,
  showTeamOnly,
}: {
  items: NavItem[]
  showTeamOnly: boolean
}) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '')
  const userClickedRef = useRef(false)

  useEffect(() => {
    const visible: NavItem[] = items.filter((it) => !it.teamOnly || showTeamOnly)
    const elements = visible
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null)

    const io = new IntersectionObserver(
      (entries) => {
        if (userClickedRef.current) return
        // Pick the entry whose top is closest to the viewport top (and visible)
        const intersecting = entries.filter((e) => e.isIntersecting)
        if (intersecting.length === 0) return
        intersecting.sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top)
        )
        const id = (intersecting[0].target as HTMLElement).id
        if (id) setActive(id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: 0 }
    )
    elements.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items, showTeamOnly])

  const handleClick = (id: string) => {
    userClickedRef.current = true
    setActive(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Re-enable IO updates after the scroll likely settled
    window.setTimeout(() => {
      userClickedRef.current = false
    }, 700)
  }

  const visibleItems = items.filter((it) => !it.teamOnly || showTeamOnly)

  return (
    <aside
      style={{
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
        width: 220,
        flexShrink: 0,
      }}
    >
      <nav
        aria-label="Navigation paramètres"
        style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {visibleItems.map((it) => {
          const isActive = it.id === active
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => handleClick(it.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: isActive ? 'var(--bloom-surface-2)' : 'transparent',
                color: isActive ? 'var(--bloom-text)' : 'var(--bloom-text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bloom-surface-2)'
                  e.currentTarget.style.color = 'var(--bloom-text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--bloom-text-muted)'
                }
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  display: 'inline-grid',
                  placeItems: 'center',
                  opacity: 0.85,
                  flexShrink: 0,
                }}
              >
                {it.icon}
              </span>
              {it.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
