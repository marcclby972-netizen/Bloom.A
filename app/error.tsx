'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [showDetails, setShowDetails] = useState(false)
  const [safeMode, setSafeMode] = useState(false)

  useEffect(() => {
    console.error('[Bloom Error]', error)
  }, [error])

  /**
   * Mode sécurisé : nuke tout le cache local Bloom (en gardant les cookies
   * d'auth Supabase) et hard-reload sans cache. C'est le bouton de dernier
   * recours quand le cache local est corrompu et que l'user ne peut même pas
   * atteindre Settings → Vider le cache parce que la page crashe.
   */
  const handleSafeMode = async () => {
    if (typeof window === 'undefined') return
    try {
      // Récupérer toutes les clés bloom_*
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith('bloom_')) keys.push(k)
      }
      keys.forEach((k) => localStorage.removeItem(k))

      // Vider sessionStorage aussi par précaution
      sessionStorage.clear()

      // Demander au navigateur de bypasser son cache HTTP au reload
      // (Cmd+Shift+R équivalent programmatique)
      window.location.reload()
    } catch {
      // Si même ça échoue, full nuke
      try { localStorage.clear() } catch {/* ignore */}
      window.location.href = '/'
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-2xl w-full space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || 'Quelque chose ne s\'est pas passé comme prévu.'}
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button onClick={reset} variant="outline" size="sm">
            Réessayer
          </Button>
          <Button onClick={() => setSafeMode(true)} variant="default" size="sm">
            Mode sécurisé
          </Button>
          <Button onClick={() => setShowDetails((v) => !v)} variant="ghost" size="sm">
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
        </div>

        {safeMode && (
          <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 rounded-lg p-4 text-left space-y-3">
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Vider le cache local et recharger
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                Si l&apos;erreur persiste, il y a peut-être de la donnée corrompue dans votre
                navigateur. Cette action supprime le cache local et recharge depuis le cloud.
                <strong> Vos données restent sauvegardées côté serveur — aucune perte.</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSafeMode} variant="default" size="sm">
                Vider et recharger
              </Button>
              <Button onClick={() => setSafeMode(false)} variant="outline" size="sm">
                Annuler
              </Button>
            </div>
          </div>
        )}

        {showDetails && (
          <div className="text-left">
            <pre className="text-[10px] font-mono bg-muted/40 rounded-lg p-3 overflow-auto max-h-80 whitespace-pre-wrap break-all">
              {error.name}: {error.message}
              {error.digest ? `\n(digest: ${error.digest})` : ''}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
            <button
              onClick={() => {
                const text = `${error.name}: ${error.message}\n${error.stack || ''}`
                navigator.clipboard?.writeText(text)
              }}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Copier le stack trace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
