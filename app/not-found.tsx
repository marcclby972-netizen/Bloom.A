import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-4">
        <div className="text-5xl font-bold text-muted-foreground/30">404</div>
        <h2 className="text-lg font-semibold">Page introuvable</h2>
        <p className="text-sm text-muted-foreground">
          Cette page n&apos;existe pas ou a ete deplacee.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm">
            Retour au dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
