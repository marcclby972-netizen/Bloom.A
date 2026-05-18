'use client'

/**
 * Settings-page enhancements — port direct du <script> du HTML reference
 * (cf. `reference bloom/settings.html`).
 *
 * Comportements :
 *  - Section nav : clic met `.active` sur le lien correspondant
 *  - IntersectionObserver suit la section visible et met à jour `.active`
 *  - Toggles : .on / .off + déclenche showSaveBar()
 *  - Theme cards + swatches : sélection unique + showSaveBar()
 *  - Inputs/select/textarea : input/change → showSaveBar()
 *  - Save bar : show/hide + saveAndHide() (label "Enregistré.")
 *
 * Le `onclick="hideSaveBar()"` / `onclick="saveAndHide()"` du HTML
 * inline est résolu en attachant les fonctions à `window`.
 */

import { useEffect } from 'react'

declare global {
  interface Window {
    hideSaveBar?: () => void
    saveAndHide?: () => void
  }
}

export function SettingsScripts() {
  useEffect(() => {
    const cleanups: Array<() => void> = []

    const showSaveBar = () => {
      document.getElementById('save-bar')?.classList.add('show')
    }
    const hideSaveBar = () => {
      document.getElementById('save-bar')?.classList.remove('show')
    }
    const saveAndHide = () => {
      const bar = document.getElementById('save-bar')
      if (!bar) return
      const lbl = bar.querySelector<HTMLElement>('.lbl')
      if (lbl) lbl.innerHTML = '<b>Enregistré.</b>'
      setTimeout(() => {
        bar.classList.remove('show')
        setTimeout(() => {
          if (lbl)
            lbl.innerHTML = '<b>Modifications non enregistrées.</b>'
        }, 400)
      }, 1100)
    }

    window.hideSaveBar = hideSaveBar
    window.saveAndHide = saveAndHide

    // ─── Section nav clic + IntersectionObserver ───
    const links = document.querySelectorAll<HTMLAnchorElement>(
      '.s-nav a[href^="#"]'
    )
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('section.section')
    )

    const onLinkClick = (e: Event) => {
      links.forEach((x) => x.classList.remove('active'))
      ;(e.currentTarget as HTMLElement).classList.add('active')
    }
    links.forEach((l) => {
      l.addEventListener('click', onLinkClick)
      cleanups.push(() => l.removeEventListener('click', onLinkClick))
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).id
            links.forEach((l) =>
              l.classList.toggle(
                'active',
                l.getAttribute('href') === '#' + id
              )
            )
          }
        })
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
    )
    sections.forEach((s) => io.observe(s))
    cleanups.push(() => io.disconnect())

    // ─── Toggles ───
    const toggles = document.querySelectorAll<HTMLElement>('.toggle')
    toggles.forEach((t) => {
      const fn = () => {
        t.classList.toggle('on')
        showSaveBar()
      }
      t.addEventListener('click', fn)
      cleanups.push(() => t.removeEventListener('click', fn))
    })

    // ─── Theme cards ───
    const themeCards = document.querySelectorAll<HTMLElement>('.theme-card')
    themeCards.forEach((card) => {
      const fn = () => {
        themeCards.forEach((c) => c.classList.remove('selected'))
        card.classList.add('selected')
        showSaveBar()
      }
      card.addEventListener('click', fn)
      cleanups.push(() => card.removeEventListener('click', fn))
    })

    // ─── Swatches ───
    const swatches = document.querySelectorAll<HTMLElement>('.swatch')
    swatches.forEach((sw) => {
      const fn = () => {
        swatches.forEach((s) => s.classList.remove('selected'))
        sw.classList.add('selected')
        showSaveBar()
      }
      sw.addEventListener('click', fn)
      cleanups.push(() => sw.removeEventListener('click', fn))
    })

    // ─── Inputs / select / textarea trigger save bar ───
    const fields = document.querySelectorAll<HTMLElement>(
      '.input, .select, .textarea'
    )
    fields.forEach((el) => {
      el.addEventListener('input', showSaveBar)
      el.addEventListener('change', showSaveBar)
      cleanups.push(() => {
        el.removeEventListener('input', showSaveBar)
        el.removeEventListener('change', showSaveBar)
      })
    })

    return () => {
      delete window.hideSaveBar
      delete window.saveAndHide
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
