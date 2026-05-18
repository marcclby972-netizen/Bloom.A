'use client'

/**
 * Landing-page enhancements — port direct du <script> du HTML reference.
 * - Add `.js-ok` class pour activer les transitions reveal (graceful degradation)
 * - IntersectionObserver pour `.reveal`, `.reveal-stagger`, `.ai-mock`, `.feat-card`
 * - Safety fallback à 1.8s
 * - Shadow du header au scroll
 * - Billing toggle (mensuel ↔ annuel) avec slider animé + swap prix
 */

import { useEffect } from 'react'

export function LandingScripts() {
  useEffect(() => {
    document.documentElement.classList.add('js-ok')

    // Reveal observer
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    document
      .querySelectorAll('.reveal, .reveal-stagger, .ai-mock, .feat-card')
      .forEach((el) => io.observe(el))

    // Safety force-reveal après 1.8s
    const safety = window.setTimeout(() => {
      document
        .querySelectorAll(
          '.reveal:not(.in), .reveal-stagger:not(.in), .ai-mock:not(.in), .feat-card:not(.in)'
        )
        .forEach((el) => el.classList.add('in'))
    }, 1800)

    // Header shadow on scroll
    const header = document.querySelector<HTMLElement>('.header-pill')
    const onScroll = () => {
      if (!header) return
      header.style.boxShadow =
        window.scrollY > 12
          ? '0 14px 40px -8px rgba(17,17,17,0.18), 0 0 0 1px rgba(17,17,17,0.06)'
          : ''
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Billing toggle ──
    const toggle = document.querySelector<HTMLElement>('.billing-toggle')
    const slider = toggle?.querySelector<HTMLElement>('.slider') ?? null
    const buttons = toggle?.querySelectorAll<HTMLButtonElement>(
      'button[data-billing]'
    )
    const priceValue = document.getElementById('price-value')
    const priceBilled = document.getElementById('price-billed')

    const PRICES = {
      monthly: {
        display: '8&nbsp;€',
        billed: 'Facturé mensuellement · sans engagement.',
      },
      annual: {
        display: '5,60&nbsp;€',
        billed:
          '<span class="strike">8 €</span> Facturé 67 €/an · économisez 29 € par siège.',
      },
    } as const

    const positionSlider = (activeBtn: HTMLElement) => {
      if (!toggle || !slider) return
      const tRect = toggle.getBoundingClientRect()
      const bRect = activeBtn.getBoundingClientRect()
      slider.style.left = `${bRect.left - tRect.left}px`
      slider.style.width = `${bRect.width}px`
    }

    const select = (billing: 'monthly' | 'annual') => {
      buttons?.forEach((b) => {
        const active = (b.dataset.billing as 'monthly' | 'annual') === billing
        b.classList.toggle('on', active)
        b.setAttribute('aria-selected', active ? 'true' : 'false')
        if (active) positionSlider(b)
      })
      if (priceValue) priceValue.innerHTML = PRICES[billing].display
      if (priceBilled) priceBilled.innerHTML = PRICES[billing].billed
    }

    const handlers: Array<() => void> = []
    buttons?.forEach((b) => {
      const fn = () =>
        select(b.dataset.billing as 'monthly' | 'annual')
      b.addEventListener('click', fn)
      handlers.push(() => b.removeEventListener('click', fn))
    })

    requestAnimationFrame(() => {
      const initial = toggle?.querySelector<HTMLElement>('button.on')
      if (initial) positionSlider(initial)
    })

    const onResize = () => {
      const active = toggle?.querySelector<HTMLElement>('button.on')
      if (active) positionSlider(active)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.clearTimeout(safety)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      handlers.forEach((off) => off())
      io.disconnect()
    }
  }, [])

  return null
}
