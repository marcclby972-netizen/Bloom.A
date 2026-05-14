'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('[Bloom Error]', error)
  }, [error])

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
        <div className="flex items-center justify-center gap-2">
          <Button onClick={reset} variant="outline" size="sm">
            Réessayer
          </Button>
          <Button onClick={() => setShowDetails((v) => !v)} variant="ghost" size="sm">
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
        </div>
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
