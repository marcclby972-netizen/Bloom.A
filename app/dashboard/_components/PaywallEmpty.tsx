'use client'

/**
 * PaywallEmpty — empty state cohérent pour les pages team-only quand
 * l'utilisateur n'a pas le plan Team (ou est en solo).
 *
 * Cohérent avec la page /pricing : 2 CTA — primaire vers /pricing,
 * secondaire vers /onboard pour créer une équipe.
 */

import Link from 'next/link'

export function PaywallEmpty({
  title,
  description,
  feature,
}: {
  title: string
  description: string
  /** Optionnel : nom de la feature pour le sous-titre badge. */
  feature?: string
}) {
  return (
    <div
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 18,
        padding: '40px 32px',
        textAlign: 'center',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          background: 'rgba(255,138,26,0.14)',
          color: '#FF8A1A',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 6,
          marginBottom: 14,
        }}
      >
        Plan Team {feature ? `· ${feature}` : ''}
      </span>
      <h2
        style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--bloom-text)',
          marginBottom: 10,
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--bloom-text-muted)',
          lineHeight: 1.55,
          marginBottom: 22,
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link href="/pricing" className="btn btn-primary">
          Voir les plans
        </Link>
        <Link href="/onboard" className="btn btn-ghost-dark">
          Créer une équipe
        </Link>
      </div>
    </div>
  )
}
