'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Bloom Error]', error)
  }, [error])

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || 'Quelque chose ne s\'est pas passe comme prevu.'}
        </p>
        <Button onClick={reset} variant="outline" size="sm">
          Reessayer
        </Button>
      </div>
    </div>
  )
}
