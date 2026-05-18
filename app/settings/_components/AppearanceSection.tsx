'use client'

/**
 * AppearanceSection — switcher Light / Dark / System.
 *
 * Persisté via `setStoredTheme()` (localStorage 'bloom_theme'), applique
 * immédiatement `data-theme` sur <html>. Le ThemeProvider écoute les
 * storage events pour rester en sync entre onglets et avec les media
 * query OS.
 */

import { useEffect, useState } from 'react'
import { Section } from './Section'
import {
  getStoredTheme,
  setStoredTheme,
  type ThemeMode,
} from '@/components/ThemeProvider'

type ThemeChoice = {
  value: ThemeMode
  label: string
  preview: React.ReactNode
}

const CHOICES: ThemeChoice[] = [
  {
    value: 'light',
    label: 'Clair',
    preview: (
      <div
        style={{
          background: '#F8F7F4',
          border: '1px solid rgba(17,17,17,0.10)',
          borderRadius: 10,
          padding: 8,
          height: 64,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 16,
            height: 6,
            borderRadius: 2,
            background: 'rgba(17,17,17,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 8,
            right: 8,
            height: 4,
            borderRadius: 2,
            background: 'rgba(17,17,17,0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: 8,
            width: 20,
            height: 4,
            borderRadius: 2,
            background: 'rgba(227,117,32,0.7)',
          }}
        />
      </div>
    ),
  },
  {
    value: 'dark',
    label: 'Sombre',
    preview: (
      <div
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 10,
          padding: 8,
          height: 64,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 16,
            height: 6,
            borderRadius: 2,
            background: 'rgba(236,236,236,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 8,
            right: 8,
            height: 4,
            borderRadius: 2,
            background: 'rgba(236,236,236,0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: 8,
            width: 20,
            height: 4,
            borderRadius: 2,
            background: 'rgba(251,190,77,0.7)',
          }}
        />
      </div>
    ),
  },
  {
    value: 'system',
    label: 'Système',
    preview: (
      <div
        style={{
          borderRadius: 10,
          padding: 8,
          height: 64,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.10)',
          background:
            'linear-gradient(90deg, #F8F7F4 0%, #F8F7F4 50%, #111111 50%, #111111 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 16,
            height: 6,
            borderRadius: 2,
            background: 'rgba(17,17,17,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 16,
            height: 6,
            borderRadius: 2,
            background: 'rgba(236,236,236,0.6)',
          }}
        />
      </div>
    ),
  },
]

export function AppearanceSection() {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    setMode(getStoredTheme())
  }, [])

  const pick = (m: ThemeMode) => {
    setMode(m)
    setStoredTheme(m)
  }

  return (
    <Section
      id="appearance"
      eyebrow="Visuel"
      title="Apparence"
      description="Choisis ton thème. Le mode système suit automatiquement ton OS."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {CHOICES.map((c) => {
          const isActive = mode === c.value
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => pick(c.value)}
              style={{
                background: 'var(--bloom-surface-2)',
                border: `1.5px solid ${isActive ? 'var(--orange-2)' : 'var(--bloom-border)'}`,
                borderRadius: 14,
                padding: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'var(--bloom-text)',
                transition: 'border-color 150ms ease, transform 150ms ease',
                position: 'relative',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'translateY(-1px)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'translateY(0)')
              }
            >
              {c.preview}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  {c.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'var(--gradient)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 6.5l2.5 2.5 5-5" />
                    </svg>
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p
        style={{
          marginTop: 14,
          fontSize: 12.5,
          color: 'var(--bloom-text-faint)',
          lineHeight: 1.55,
        }}
      >
        Note : certaines pages legacy peuvent encore utiliser des couleurs
        figées. Le shell, sidebar, topbar et nouveaux widgets s&apos;adaptent
        au thème.
      </p>
    </Section>
  )
}
