'use client'

/**
 * Dashboard-page enhancements — port direct du <script> du HTML reference
 * (cf. `reference bloom/dashboard.html`).
 *
 * 4 IIFEs portés :
 *  1. Mode toggle Solo ↔ Équipe (slider animé, ajoute `.mode-team` à #app)
 *  2. Sidebar collapse (toggle `.collapsed` sur #app)
 *  3. Live chrono tick (incrémente totalSec chaque seconde, met à jour
 *     les éléments #chrono-h / #chrono-m / #chrono-s)
 *  4. Tasks : checkbox toggle .done
 *  5. Decisions : feedback visuel sur clic vote-btn
 *
 * Le HTML est intact ; on s'attache uniquement aux IDs / classes existants.
 */

import { useEffect } from 'react'

export function DashboardScripts() {
  useEffect(() => {
    const cleanups: Array<() => void> = []

    // ─── 1. Mode toggle Solo / Équipe ───
    const app = document.getElementById('app')
    const toggle = document.querySelector<HTMLElement>('.mode-toggle')
    const slider = toggle?.querySelector<HTMLElement>('.slider') ?? null
    const modeButtons = toggle?.querySelectorAll<HTMLButtonElement>(
      'button[data-mode]'
    )

    if (app && toggle && slider && modeButtons) {
      const positionSlider = (btn: HTMLElement) => {
        const tRect = toggle.getBoundingClientRect()
        const bRect = btn.getBoundingClientRect()
        slider.style.left = `${bRect.left - tRect.left}px`
        slider.style.width = `${bRect.width}px`
      }
      const select = (mode: string) => {
        modeButtons.forEach((b) => {
          const active = b.dataset.mode === mode
          b.classList.toggle('on', active)
          b.setAttribute('aria-selected', active ? 'true' : 'false')
          if (active) positionSlider(b)
        })
        app.classList.toggle('mode-team', mode === 'team')
      }

      const handlers: Array<() => void> = []
      modeButtons.forEach((b) => {
        const fn = () => select(b.dataset.mode ?? 'solo')
        b.addEventListener('click', fn)
        handlers.push(() => b.removeEventListener('click', fn))
      })

      requestAnimationFrame(() => {
        const initial = toggle.querySelector<HTMLElement>('button.on')
        if (initial) positionSlider(initial)
      })

      const onResize = () => {
        const active = toggle.querySelector<HTMLElement>('button.on')
        if (active) positionSlider(active)
      }
      window.addEventListener('resize', onResize)

      cleanups.push(() => {
        handlers.forEach((off) => off())
        window.removeEventListener('resize', onResize)
      })
    }

    // ─── 2. Sidebar collapse ───
    const sbToggle = document.getElementById('sb-toggle')
    if (sbToggle && app) {
      const onSbToggle = () => app.classList.toggle('collapsed')
      sbToggle.addEventListener('click', onSbToggle)
      cleanups.push(() => sbToggle.removeEventListener('click', onSbToggle))
    }

    // ─── 3. Live chrono tick ───
    const chH = document.getElementById('chrono-h')
    const chM = document.getElementById('chrono-m')
    const chS = document.getElementById('chrono-s')
    if (chH && chM && chS) {
      let totalSec = 1 * 3600 + 24 * 60 + 36
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
      const tick = window.setInterval(() => {
        totalSec++
        chH.textContent = pad(Math.floor(totalSec / 3600))
        chM.textContent = pad(Math.floor((totalSec % 3600) / 60))
        chS.textContent = pad(totalSec % 60)
      }, 1000)
      cleanups.push(() => window.clearInterval(tick))
    }

    // ─── 4. Tasks : toggle done on click ───
    const taskRows = document.querySelectorAll<HTMLElement>('.task-row')
    taskRows.forEach((row) => {
      const onRow = (e: Event) => {
        const target = e.target as HTMLElement
        if (target.closest('a, button')) return
        const cb = row.querySelector('.checkbox')
        cb?.classList.toggle('done')
        row.classList.toggle('done')
      }
      row.addEventListener('click', onRow)
      cleanups.push(() => row.removeEventListener('click', onRow))
    })

    // ─── 5. Decisions : vote button micro feedback ───
    const voteBtns = document.querySelectorAll<HTMLElement>(
      '.decision .vote-btn'
    )
    voteBtns.forEach((btn) => {
      const onVote = () => {
        const all = btn.parentElement?.querySelectorAll<HTMLElement>('.vote-btn')
        all?.forEach((b) => (b.style.opacity = '0.4'))
        btn.style.opacity = '1'
        btn.style.background = 'var(--ink)'
        btn.style.color = '#fff'
        btn.style.borderColor = 'var(--ink)'
      }
      btn.addEventListener('click', onVote)
      cleanups.push(() => btn.removeEventListener('click', onVote))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return null
}
