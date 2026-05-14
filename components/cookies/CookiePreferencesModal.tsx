'use client'

import { useEffect, useState } from 'react'
import {
  getCookiePreferences, setCookiePreferences, COOKIE_CATALOG,
  type CookieCategory,
} from '@/lib/cookies'

type CategoryDef = {
  id: CookieCategory
  label: string
  description: string
  required: boolean
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'essential',
    label: 'Strictement nécessaires',
    description:
      'Indispensables au fonctionnement du site : authentification, sécurité, mémorisation de votre choix de consentement. Ne peuvent pas être désactivés.',
    required: true,
  },
  {
    id: 'functional',
    label: 'Fonctionnels',
    description:
      'Mémorisent vos préférences d\'interface (thème, polices, configuration IA, cache local de vos données pour un affichage instantané). Stockés uniquement dans votre navigateur.',
    required: false,
  },
  {
    id: 'analytics',
    label: 'Mesure d\'audience',
    description:
      'Aucun cookie de mesure d\'audience n\'est actuellement utilisé. Cette catégorie est réservée pour une éventuelle évolution future.',
    required: false,
  },
  {
    id: 'marketing',
    label: 'Marketing & publicité',
    description:
      'Aucun cookie publicitaire ni tracker tiers n\'est utilisé. Bloom ne revend pas vos données et ne diffuse aucune publicité.',
    required: false,
  },
]

export function CookiePreferencesModal({
  open, onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [prefs, setPrefs] = useState({
    functional: false,
    analytics: false,
    marketing: false,
  })

  // Reload current prefs when opening
  useEffect(() => {
    if (!open) return
    const current = getCookiePreferences()
    setPrefs({
      functional: current.functional,
      analytics: current.analytics,
      marketing: current.marketing,
    })
  }, [open])

  if (!open) return null

  const toggle = (key: 'functional' | 'analytics' | 'marketing') => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleSave = () => {
    setCookiePreferences({
      essential: true,
      ...prefs,
    })
    onClose()
  }

  const handleAcceptAll = () => {
    setCookiePreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    })
    onClose()
  }

  const handleRejectAll = () => {
    setCookiePreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personnaliser mes préférences de cookies"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Personnaliser mes préférences</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vous pouvez activer ou désactiver chaque catégorie indépendamment. Les cookies
            strictement nécessaires sont toujours actifs car ils sont indispensables au
            fonctionnement du site.{' '}
            <a href="/cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Politique cookies complète →
            </a>
          </p>

          {CATEGORIES.map((cat) => {
            const enabled = cat.required ? true : prefs[cat.id as 'functional' | 'analytics' | 'marketing']
            const cookies = COOKIE_CATALOG.filter((c) => c.category === cat.id)
            return (
              <section key={cat.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  {cat.required ? (
                    <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground shrink-0">
                      Toujours actif
                    </span>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggle(cat.id as 'functional' | 'analytics' | 'marketing')}
                      className={
                        'relative h-5 w-9 rounded-full transition-colors shrink-0 ' +
                        (enabled ? 'bg-primary' : 'bg-muted')
                      }
                    >
                      <span
                        className={
                          'absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ' +
                          (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
                        }
                      />
                    </button>
                  )}
                </div>

                {cookies.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                      Voir le détail ({cookies.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {cookies.map((c) => (
                        <div key={c.name} className="text-[11px] border-l-2 border-border pl-3 py-1">
                          <div className="font-mono text-foreground">{c.name}</div>
                          <div className="text-muted-foreground mt-0.5">
                            <span className="font-medium">{c.provider}</span>
                            {' · '}
                            {c.type}
                            {' · '}
                            {c.duration}
                          </div>
                          <div className="text-muted-foreground mt-0.5 leading-relaxed">{c.purpose}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {cookies.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic mt-1">
                    Aucun cookie actuellement utilisé dans cette catégorie.
                  </p>
                )}
              </section>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={handleRejectAll}
            className="text-xs font-medium px-4 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors"
          >
            Refuser tout
          </button>
          <button
            onClick={handleAcceptAll}
            className="text-xs font-medium px-4 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors"
          >
            Tout accepter
          </button>
          <button
            onClick={handleSave}
            className="text-xs font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors sm:ml-auto"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  )
}
