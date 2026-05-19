'use client'

/**
 * HeroGreeting — bloc d'accueil grand format inspiré Iko°OS.
 *
 * Avatar circulaire à gauche · date du jour en petit · "Bonjour, {prénom}"
 * en très grand titre. Bouton "Modifier" en haut à droite → /settings.
 *
 * Sépare visuellement le hero du reste via une barre fine en bas.
 */

import Link from 'next/link'

const DAYS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

function formatToday(): string {
  const d = new Date()
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function initials(label: string | null | undefined, fallback: string): string {
  if (!label) return fallback.slice(0, 2).toUpperCase()
  return label
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export function HeroGreeting({
  userName,
  userEmail,
}: {
  userName: string | null
  userEmail: string | null
}) {
  const firstName = userName?.split(/\s+/)[0] ?? 'là'
  const av = initials(userName, userEmail ?? '?')

  return (
    <div className="hero-greet">
      <div className="hero-avatar" aria-hidden="true">
        {av}
      </div>
      <div className="hero-body">
        <div className="hero-date">{formatToday()}</div>
        <h1 className="hero-title">Bonjour, {firstName}</h1>
      </div>
      <Link href="/settings" className="hero-edit">
        Modifier
      </Link>
    </div>
  )
}
