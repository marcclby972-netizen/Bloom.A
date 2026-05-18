'use client'

/**
 * Onboarding-page enhancements — port direct du <script> du HTML reference
 * (cf. `reference bloom/onboarding.html`).
 *
 * Le HTML utilise des `onclick="goNext()"` inline → on attache les fonctions à
 * `window` au mount, puis on nettoie au unmount. Permet de garder l'HTML
 * intact (pixel-perfect) sans avoir à réécrire chaque handler.
 *
 * Flows :
 *  - solo : signup → choice → solo-project → solo-task → solo-chrono → final
 *  - team : signup → choice → team-config → team-profile → team-gov → team-invite → final
 *
 * Effets visuels : progress dots, sélection de cards (choice/swatches/gov),
 * ajout dynamique d'invitations (max 5), confetti final.
 */

import { useEffect } from 'react'

type Mode = 'solo' | 'team' | null

declare global {
  interface Window {
    goNext?: () => void
    goBack?: () => void
    goFinal?: () => void
    skipSolo?: () => void
    addInvite?: () => void
  }
}

export function OnboardScripts() {
  useEffect(() => {
    const state: {
      mode: Mode
      projectName: string
      history: string[]
    } = {
      mode: null,
      projectName: '',
      history: ['signup'],
    }

    const FLOWS = {
      solo: ['signup', 'choice', 'solo-project', 'solo-task', 'solo-chrono', 'final'],
      team: ['signup', 'choice', 'team-config', 'team-profile', 'team-gov', 'team-invite', 'final'],
      base: ['signup', 'choice'],
    } as const

    const currentFlow = (): readonly string[] => {
      if (!state.mode) return FLOWS.base
      return FLOWS[state.mode]
    }
    const currentStep = () => state.history[state.history.length - 1]

    const updateProgress = () => {
      const flow = currentFlow()
      const idx = flow.indexOf(currentStep())
      const dots = document.querySelectorAll<HTMLElement>('#progress .dot')
      dots.forEach((d, i) => {
        d.classList.remove('on', 'done')
        const pct = i / (dots.length - 1)
        const target = pct * (flow.length - 1)
        if (target < idx) d.classList.add('done')
        else if (Math.round(target) === idx) d.classList.add('on')
      })
    }

    const showStep = (name: string) => {
      document
        .querySelectorAll<HTMLElement>('.step')
        .forEach((s) => s.classList.remove('active'))
      const el = document.querySelector<HTMLElement>(`[data-step="${name}"]`)
      if (el) el.classList.add('active')
      updateProgress()
    }

    const onEnterStep = (name: string) => {
      if (name === 'solo-task') {
        const pn =
          (document.getElementById('proj-name') as HTMLInputElement | null)?.value ||
          state.projectName ||
          'votre projet'
        state.projectName = pn
        const ctx = document.getElementById('task-context')
        if (ctx) {
          ctx.textContent = `Ajoutons une première tâche à « ${pn} ». Une seule, pour démarrer.`
        }
      }
      if (name === 'solo-chrono') {
        const cp = document.getElementById('chrono-proj')
        if (cp) cp.textContent = state.projectName || 'votre projet'
      }
      if (name === 'final') {
        const sub = document.getElementById('final-sub')
        const sideL = document.getElementById('final-side-l')
        const sideV = document.getElementById('final-side-v')
        const projs = document.getElementById('final-projs')
        const next = document.getElementById('next-action')
        if (state.mode === 'team') {
          if (sub)
            sub.textContent =
              'Votre équipe est configurée. Vos associés recevront leur invitation par email.'
          if (sideL) sideL.textContent = 'Règles actives'
          if (sideV) sideV.textContent = '1'
          if (projs) projs.textContent = '0'
          if (next)
            next.innerHTML =
              '<b>Prochaine étape</b> · explorez le mode Associés et préparez votre prochaine décision à voter.'
        } else {
          if (sub) sub.textContent = 'Tout est en place. Vous pouvez commencer à piloter votre activité.'
          if (next)
            next.innerHTML =
              '<b>Prochaine étape</b> · démarrez votre premier chrono ou ajoutez une autre tâche.'
        }
        launchConfetti()
      }
    }

    const goNext = () => {
      const flow = currentFlow()
      const idx = flow.indexOf(currentStep())
      const next = flow[idx + 1]
      if (!next) return
      state.history.push(next)
      showStep(next)
      onEnterStep(next)
    }
    const goBack = () => {
      if (state.history.length <= 1) return
      state.history.pop()
      showStep(currentStep())
    }
    const goFinal = () => {
      state.history.push('final')
      showStep('final')
      onEnterStep('final')
    }
    const skipSolo = () => {
      state.projectName = 'Mon premier projet'
      goNext()
    }
    const addInvite = () => {
      const list = document.getElementById('invite-list')
      if (!list) return
      const rows = list.querySelectorAll('.invite-row').length
      if (rows >= 5) return
      const row = document.createElement('div')
      row.className = 'invite-row'
      row.innerHTML = `
        <input type="email" class="input" placeholder="associé${rows + 1}@email.com" />
        <button type="button" class="invite-remove" aria-label="Retirer" onclick="this.parentElement.remove()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>`
      list.appendChild(row)
    }

    const launchConfetti = () => {
      const root = document.getElementById('confetti')
      if (!root) return
      root.innerHTML = ''
      const colors = ['#E37520', '#FBBE4D', '#ECECEC', '#22C55E', '#60A5FA']
      for (let i = 0; i < 36; i++) {
        const c = document.createElement('i')
        c.style.background = colors[i % colors.length]
        c.style.left = Math.random() * 100 + '%'
        c.style.animationDelay = Math.random() * 0.4 + 's'
        c.style.animationDuration = 1.2 + Math.random() * 0.8 + 's'
        root.appendChild(c)
      }
      const card = root.parentElement
      if (card) card.classList.add('show')
    }

    // ─── attach inline-handler functions to window ───
    window.goNext = goNext
    window.goBack = goBack
    window.goFinal = goFinal
    window.skipSolo = skipSolo
    window.addInvite = addInvite

    // ─── Choice cards (solo vs team) ───
    const choiceCards =
      document.querySelectorAll<HTMLElement>('.choice-card')
    const onChoice = (e: Event) => {
      const card = e.currentTarget as HTMLElement
      choiceCards.forEach((c) => c.classList.remove('selected'))
      card.classList.add('selected')
      state.mode = (card.dataset.mode as Mode) ?? null
      const btn = document.getElementById(
        'choice-continue'
      ) as HTMLButtonElement | null
      if (btn) {
        btn.disabled = false
        btn.style.opacity = '1'
      }
    }
    choiceCards.forEach((c) => c.addEventListener('click', onChoice))

    // ─── Color swatches ───
    const swatches = document.querySelectorAll<HTMLElement>('.color-swatch')
    const onSwatch = (e: Event) => {
      const sw = e.currentTarget as HTMLElement
      swatches.forEach((c) => (c.style.border = '2px solid transparent'))
      sw.style.border = '2px solid var(--orange-2)'
    }
    swatches.forEach((s) => s.addEventListener('click', onSwatch))

    // ─── Team size buttons ───
    const sizeBtns = document.querySelectorAll<HTMLElement>('.size-btn')
    const onSize = (e: Event) => {
      const btn = e.currentTarget as HTMLElement
      sizeBtns.forEach((b) => {
        b.style.background = ''
        b.style.borderColor = ''
      })
      btn.style.background = 'var(--surface-3)'
      btn.style.borderColor = 'var(--border-strong)'
    }
    sizeBtns.forEach((b) => b.addEventListener('click', onSize))

    // ─── Governance radio ───
    const govOpts = document.querySelectorAll<HTMLElement>(
      '#gov-options .gov-option'
    )
    const onGov = (e: Event) => {
      const opt = e.currentTarget as HTMLElement
      govOpts.forEach((o) => o.classList.remove('selected'))
      opt.classList.add('selected')
    }
    govOpts.forEach((o) => o.addEventListener('click', onGov))

    // ─── init ───
    showStep('signup')

    return () => {
      delete window.goNext
      delete window.goBack
      delete window.goFinal
      delete window.skipSolo
      delete window.addInvite
      choiceCards.forEach((c) => c.removeEventListener('click', onChoice))
      swatches.forEach((s) => s.removeEventListener('click', onSwatch))
      sizeBtns.forEach((b) => b.removeEventListener('click', onSize))
      govOpts.forEach((o) => o.removeEventListener('click', onGov))
    }
  }, [])

  return null
}
