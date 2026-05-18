'use client'

/**
 * Mode toggle Solo ↔ Équipe — pilote la classe `.mode-team` sur #app pour
 * révéler/cacher les widgets `.team-only`/`.solo-only` via CSS.
 *
 * Le slider animé est positionné via getBoundingClientRect dans un effet.
 *
 * Source de vérité = `isSolo` (vient de useCurrentTeam). Cliquer "Équipe"
 * sans team active sélectionne la première team disponible, sinon redirige
 * vers /onboard pour en créer une.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Team } from '@/lib/v3-types'

export function ModeToggle({
  isSolo,
  teams,
  onSelectTeam,
}: {
  isSolo: boolean
  teams: Team[]
  onSelectTeam: (team: Team | null) => void
}) {
  const router = useRouter()
  const toggleRef = useRef<HTMLDivElement | null>(null)
  const sliderRef = useRef<HTMLSpanElement | null>(null)
  const soloRef = useRef<HTMLButtonElement | null>(null)
  const teamRef = useRef<HTMLButtonElement | null>(null)

  // Position du slider sous le bouton actif
  useEffect(() => {
    const reposition = () => {
      const toggle = toggleRef.current
      const slider = sliderRef.current
      const active = isSolo ? soloRef.current : teamRef.current
      if (!toggle || !slider || !active) return
      const tRect = toggle.getBoundingClientRect()
      const aRect = active.getBoundingClientRect()
      slider.style.left = `${aRect.left - tRect.left}px`
      slider.style.width = `${aRect.width}px`
    }
    // Initial position (after layout)
    requestAnimationFrame(reposition)
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [isSolo])

  // Toggle la classe sur #app
  useEffect(() => {
    const app = document.getElementById('app')
    if (app) app.classList.toggle('mode-team', !isSolo)
  }, [isSolo])

  const pickSolo = () => onSelectTeam(null)
  const pickTeam = () => {
    if (teams.length > 0) {
      onSelectTeam(teams[0])
    } else {
      router.push('/onboard')
    }
  }

  return (
    <div
      ref={toggleRef}
      className="mode-toggle"
      role="tablist"
      aria-label="Mode dashboard"
    >
      <span className="slider" ref={sliderRef} id="mode-slider" />
      <button
        ref={soloRef}
        type="button"
        className={isSolo ? 'on' : ''}
        data-mode="solo"
        role="tab"
        aria-selected={isSolo ? 'true' : 'false'}
        onClick={pickSolo}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M2 11.5c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Solo
      </button>
      <button
        ref={teamRef}
        type="button"
        className={!isSolo ? 'on' : ''}
        data-mode="team"
        role="tab"
        aria-selected={!isSolo ? 'true' : 'false'}
        onClick={pickTeam}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="4.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9.5" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M1.5 11c0-1.7 1.3-3 3-3s3 1.3 3 3M8 11c0-1.3 1-2.4 2.3-2.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Équipe
      </button>
    </div>
  )
}
