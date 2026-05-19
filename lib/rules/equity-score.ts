/**
 * Equity score — pure fonction qui compare contributions réelles (temps + €)
 * vs parts déclarées (%) d'une équipe, et calcule un score de fairness 0-100.
 *
 * Méthode :
 *  1. Convertir le temps en € via un taux horaire de référence (default 50 €/h
 *     — c'est l'unité de compte interne ; ce taux ne sort jamais de la
 *     fonction).
 *  2. Sommer (timeValue + moneyInvested) par membre → totalValueByMember.
 *  3. Calculer la part contributive : memberValue / sumOfAllValues.
 *  4. Comparer à la part déclarée : deltaPct = abs(contribPct - sharesPct).
 *  5. Score global = 100 - moyenne(deltaPct) × 2 (clamp 0..100).
 *
 * Le score est volontairement pénalisant : 5pp d'écart moyen → score 90,
 * 10pp → 80 (alerte), 25pp → 50 (sérieux), 50pp+ → 0.
 *
 * Alertes générées par membre quand |contrib - parts| ≥ 8pp.
 */

const DEFAULT_HOURLY_RATE_EUR = 50

export type EquityMemberInput = {
  userId: string
  /** Parts déclarées en pourcentage (0..100). Null = pas de parts définies. */
  sharesPct: number | null
  /** Secondes totales trackées par ce membre sur la période. */
  contributionSeconds: number
  /** Montant total investi en centimes par ce membre. */
  contributionCents: number
}

export type EquityMemberResult = {
  userId: string
  /** Pourcentage des parts déclarées (= input.sharesPct, normalisé). */
  sharesPct: number
  /** Pourcentage des contributions (temps + €) réelles. */
  contribPct: number
  /** Écart absolu en points de pourcentage. */
  deltaPct: number
  /** Valeur monétaire de la contribution (centimes) pour audit. */
  contribValueCents: number
  /** Alerte si écart ≥ 8pp. */
  alertLevel: 'none' | 'warning' | 'critical'
}

export type EquityScoreResult = {
  /** Score global 0..100 (100 = parfaitement aligné). */
  overall: number
  /** Détails par membre. */
  perMember: EquityMemberResult[]
  /** Liste des alertes textuelles à afficher à l'UI. */
  alerts: string[]
  /** Métadonnées pour debug. */
  totalContribValueCents: number
  totalSharesPct: number
}

export function computeEquityScorePure(input: {
  members: EquityMemberInput[]
  /** Taux horaire de conversion temps → €. Default 50 €/h. */
  hourlyRateEur?: number
}): EquityScoreResult {
  const rate = input.hourlyRateEur ?? DEFAULT_HOURLY_RATE_EUR
  if (input.members.length === 0) {
    return {
      overall: 100,
      perMember: [],
      alerts: [],
      totalContribValueCents: 0,
      totalSharesPct: 0,
    }
  }

  // 1. Valoriser chaque membre (centimes)
  const valuedMembers = input.members.map((m) => {
    const timeValueCents = Math.round((m.contributionSeconds / 3600) * rate * 100)
    return {
      ...m,
      contribValueCents: timeValueCents + Math.max(0, m.contributionCents),
    }
  })

  const totalValueCents = valuedMembers.reduce(
    (sum, m) => sum + m.contribValueCents,
    0
  )
  const totalSharesPct = valuedMembers.reduce(
    (sum, m) => sum + Math.max(0, m.sharesPct ?? 0),
    0
  )

  // Si totalValue = 0 OU pas de parts déclarées → score parfait (rien à
  // comparer) mais on retourne quand même les détails.
  if (totalValueCents === 0 || totalSharesPct === 0) {
    return {
      overall: 100,
      perMember: valuedMembers.map((m) => ({
        userId: m.userId,
        sharesPct: m.sharesPct ?? 0,
        contribPct: 0,
        deltaPct: 0,
        contribValueCents: m.contribValueCents,
        alertLevel: 'none' as const,
      })),
      alerts: [],
      totalContribValueCents: totalValueCents,
      totalSharesPct,
    }
  }

  // 2. Calculer % contributif par membre (normalisé sur le total des
  // membres seulement — on ignore les non-membres / unaffected slices).
  const perMember: EquityMemberResult[] = valuedMembers.map((m) => {
    const contribPct = (m.contribValueCents / totalValueCents) * 100
    // Si totalSharesPct ne fait pas exactement 100, on normalise pour
    // éviter de pénaliser les teams où la somme = 99 ou 101.
    const normalizedShares =
      ((m.sharesPct ?? 0) / totalSharesPct) * 100
    const deltaPct = Math.abs(contribPct - normalizedShares)
    let alertLevel: 'none' | 'warning' | 'critical' = 'none'
    if (deltaPct >= 20) alertLevel = 'critical'
    else if (deltaPct >= 8) alertLevel = 'warning'
    return {
      userId: m.userId,
      sharesPct: normalizedShares,
      contribPct,
      deltaPct,
      contribValueCents: m.contribValueCents,
      alertLevel,
    }
  })

  // 3. Score : 100 - 2 × moyenne des deltas, clamp 0..100
  const avgDelta =
    perMember.reduce((sum, m) => sum + m.deltaPct, 0) / perMember.length
  const overall = Math.max(0, Math.min(100, Math.round(100 - avgDelta * 2)))

  // 4. Alertes textuelles
  const alerts: string[] = []
  for (const m of perMember) {
    if (m.alertLevel === 'critical') {
      const overOrUnder = m.contribPct > m.sharesPct ? 'sur-contribue' : 'sous-contribue'
      alerts.push(
        `Membre ${m.userId.slice(0, 8)} ${overOrUnder} fortement (${m.contribPct.toFixed(1)}% vs ${m.sharesPct.toFixed(1)}% des parts).`
      )
    } else if (m.alertLevel === 'warning') {
      const overOrUnder = m.contribPct > m.sharesPct ? 'sur-contribue' : 'sous-contribue'
      alerts.push(
        `Membre ${m.userId.slice(0, 8)} ${overOrUnder} légèrement (${m.contribPct.toFixed(1)}% vs ${m.sharesPct.toFixed(1)}% des parts).`
      )
    }
  }

  return {
    overall,
    perMember,
    alerts,
    totalContribValueCents: totalValueCents,
    totalSharesPct,
  }
}
