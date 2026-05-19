'use client'

/**
 * KpiCard — carte KPI compacte et aérée façon Iko°OS.
 *
 * - title : petit label en haut à gauche
 * - rightAction : lien "Voir plus" en haut à droite (optionnel)
 * - value : valeur principale (formatée par le parent)
 * - subtitle : ligne d'info sous la valeur
 * - children : slot custom (chart, liste, etc.) qui remplace value+subtitle
 *
 * Pattern : `<KpiCard title="MRR" rightAction={<Link>Voir plus</Link>}>
 *   <KpiValue>€0</KpiValue><KpiSub>0 deal récurrent</KpiSub></KpiCard>`
 *
 * Tous les cards ont la même hauteur minimum (180px) pour une grille
 * propre.
 */

import Link from 'next/link'

export function KpiCard({
  title,
  rightAction,
  children,
  className = '',
  span = 1,
  href,
}: {
  title?: string
  rightAction?: React.ReactNode
  children: React.ReactNode
  className?: string
  span?: 1 | 2 | 3
  href?: string
}) {
  const card = (
    <div
      className={`kpi-card kpi-span-${span} ${className}`}
      style={href ? { cursor: 'pointer' } : undefined}
    >
      {(title || rightAction) && (
        <div className="kpi-head">
          {title && <span className="kpi-label">{title}</span>}
          {rightAction && <span className="kpi-action">{rightAction}</span>}
        </div>
      )}
      <div className="kpi-body">{children}</div>
    </div>
  )
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {card}
      </Link>
    )
  }
  return card
}

export function KpiValue({
  children,
  small,
}: {
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <div className={`kpi-value ${small ? 'kpi-value-sm' : ''}`}>{children}</div>
  )
}

export function KpiSub({ children }: { children: React.ReactNode }) {
  return <div className="kpi-sub">{children}</div>
}

export function KpiSeeMore({ href }: { href: string }) {
  return (
    <Link href={href} className="kpi-see-more">
      Voir plus
    </Link>
  )
}
