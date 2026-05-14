'use client'

import { useEffect, useState } from 'react'
import {
  acceptAll, rejectAll, needsConsent, subscribeCookiePrefs,
} from '@/lib/cookies'
import { CookiePreferencesModal } from './CookiePreferencesModal'

/**
 * Bannière de consentement RGPD/ePrivacy.
 *
 * UX :
 * - Apparaît seulement si l'user n'a pas encore consenti (ou si la version
 *   de la politique a changé)
 * - 3 boutons d'égale importance visuelle : Refuser, Personnaliser, Accepter
 *   (la directive ePrivacy interdit de privilégier visuellement "Accepter")
 * - Lien direct vers la politique cookies complète
 * - z-[80] pour passer au-dessus de la cloche notifications (z-[60])
 *
 * Note technique : pas de bandeau opaque qui masque la page — l'user doit
 * pouvoir continuer à lire le contenu pour décider en connaissance de cause.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  useEffect(() => {
    // Initial check
    setVisible(needsConsent())
    // Re-check when prefs change (eg after reset from settings)
    const unsub = subscribeCookiePrefs(() => setVisible(needsConsent()))
    return unsub
  }, [])

  const handleAccept = () => {
    acceptAll()
    setVisible(false)
  }

  const handleReject = () => {
    rejectAll()
    setVisible(false)
  }

  if (!visible && !customOpen) return null

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Consentement aux cookies"
          aria-describedby="cookie-banner-desc"
          className="fixed bottom-0 left-0 right-0 z-[80] p-3 sm:p-4 pointer-events-none"
        >
          <div className="pointer-events-auto max-w-3xl mx-auto bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-sm font-semibold mb-1">Cookies & confidentialité</h2>
                <p id="cookie-banner-desc" className="text-xs text-muted-foreground leading-relaxed">
                  Bloom utilise des cookies <strong>strictement nécessaires</strong> pour
                  maintenir votre session connectée. Avec votre accord, nous pouvons aussi
                  utiliser des cookies <strong>fonctionnels</strong> pour mémoriser vos
                  préférences d&apos;affichage. Aucun tracker tiers, aucune publicité, aucune
                  revente de données.{' '}
                  <a href="/cookies" className="text-primary hover:underline">
                    En savoir plus
                  </a>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={handleReject}
                  className="text-xs font-medium px-4 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors"
                >
                  Refuser tout
                </button>
                <button
                  onClick={() => setCustomOpen(true)}
                  className="text-xs font-medium px-4 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors"
                >
                  Personnaliser
                </button>
                <button
                  onClick={handleAccept}
                  className="text-xs font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal
        open={customOpen}
        onClose={() => {
          setCustomOpen(false)
          // Si l'user a fermé sans choisir, et qu'il n'a toujours pas consenti,
          // on garde la bannière visible
          setVisible(needsConsent())
        }}
      />
    </>
  )
}
