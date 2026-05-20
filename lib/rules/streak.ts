/**
 * Streak — pure fonction qui calcule la série de jours consécutifs
 * où l'objectif de publication par plateforme a été atteint.
 *
 * Définition :
 *  - Pour chaque plateforme, target_per_day = N → un jour "atteint" est
 *    un jour où le user a publié ≥ N posts sur cette plateforme.
 *  - target_per_day = 0 → pas d'objectif → streak = 0 toujours.
 *  - current streak = nombre de jours consécutifs atteints en remontant
 *    depuis `today` inclus, jusqu'au premier jour raté.
 *  - longest streak = plus longue série consécutive sur les données fournies.
 *
 * Pas d'I/O — appelable depuis n'importe où (service, composant).
 */

export type SocialPlatform = 'linkedin' | 'x' | 'instagram' | 'tiktok'

export type StreakResult = {
  current: number
  longest: number
}

/**
 * Convertit une Date en ISO day 'YYYY-MM-DD' en local timezone.
 * Volontairement local (pas UTC) pour matcher la perception utilisateur.
 */
function toLocalIsoDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDay(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + deltaDays)
  return toLocalIsoDay(dt)
}

/**
 * @param publishedAtByPlatform — pour chaque plateforme, liste des timestamps
 *   publishedAt (Date) de tous les posts publiés sur la période d'analyse.
 *   Vide ou absent = pas de posts.
 * @param targets — map des objectifs par plateforme.
 * @param today — référence pour le current streak (default = now).
 *
 * @returns Map<platform, { current, longest }>. Toutes les plateformes
 *   présentes dans `targets` sont incluses dans le résultat (même si
 *   `current === longest === 0`).
 */
export function computeStreakByPlatform(
  publishedAtByPlatform: Map<SocialPlatform, Date[]>,
  targets: Map<SocialPlatform, { perDay: number }>,
  today: Date = new Date()
): Map<SocialPlatform, StreakResult> {
  const result = new Map<SocialPlatform, StreakResult>()
  const todayIso = toLocalIsoDay(today)

  for (const [platform, target] of targets) {
    if (target.perDay <= 0) {
      result.set(platform, { current: 0, longest: 0 })
      continue
    }
    const dates = publishedAtByPlatform.get(platform) ?? []
    if (dates.length === 0) {
      result.set(platform, { current: 0, longest: 0 })
      continue
    }

    // Compter posts par jour
    const countByDay = new Map<string, number>()
    for (const d of dates) {
      const iso = toLocalIsoDay(d)
      countByDay.set(iso, (countByDay.get(iso) ?? 0) + 1)
    }

    // Current streak : remonte depuis today tant que count[d] >= target
    let current = 0
    let cursor = todayIso
    while ((countByDay.get(cursor) ?? 0) >= target.perDay) {
      current++
      cursor = shiftDay(cursor, -1)
      // safety bound — pas de streak > 1 an
      if (current > 365) break
    }

    // Longest streak : itère sur les jours actifs triés et compte la
    // plus longue séquence consécutive. Inclut current dans le scan.
    const activeDays = Array.from(countByDay.entries())
      .filter(([, count]) => count >= target.perDay)
      .map(([iso]) => iso)
      .sort()

    let longest = 0
    let runStart: string | null = null
    let runLength = 0
    for (const iso of activeDays) {
      if (runStart === null) {
        runStart = iso
        runLength = 1
      } else {
        const expected = shiftDay(runStart, runLength)
        if (iso === expected) {
          runLength++
        } else {
          if (runLength > longest) longest = runLength
          runStart = iso
          runLength = 1
        }
      }
    }
    if (runLength > longest) longest = runLength
    // current peut être > longest si on a une série en cours plus longue
    // que toute série passée — on prend le max.
    if (current > longest) longest = current

    result.set(platform, { current, longest })
  }

  return result
}
