/**
 * Unit tests pour computeEquityScorePure.
 *
 * Couverture :
 *  - empty team
 *  - parfaitement aligné → score 100
 *  - écarts légers (5pp) → score 90, pas d'alerte
 *  - écart warning (8pp) → alerte warning
 *  - écart critical (20pp) → alerte critical
 *  - normalisation quand sum des shares ≠ 100
 *  - membre sans shares (null)
 *  - totalValue = 0 → score 100
 *  - conversion temps → € avec taux custom
 */

import { describe, it, expect } from 'vitest'
import {
  computeEquityScorePure,
  type EquityMemberInput,
} from '@/lib/rules/equity-score'

const member = (overrides: Partial<EquityMemberInput> = {}): EquityMemberInput => ({
  userId: 'u-default',
  sharesPct: 50,
  contributionSeconds: 0,
  contributionCents: 0,
  ...overrides,
})

describe('computeEquityScorePure', () => {
  it('renvoie 100 sur équipe vide', () => {
    const r = computeEquityScorePure({ members: [] })
    expect(r.overall).toBe(100)
    expect(r.perMember).toEqual([])
    expect(r.alerts).toEqual([])
  })

  it('renvoie 100 si toutes les contributions sont 0', () => {
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50 }),
        member({ userId: 'b', sharesPct: 50 }),
      ],
    })
    expect(r.overall).toBe(100)
    expect(r.alerts).toEqual([])
  })

  it('renvoie 100 si parts non déclarées (sharesPct=null partout)', () => {
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: null, contributionSeconds: 3600 }),
        member({ userId: 'b', sharesPct: null, contributionSeconds: 3600 }),
      ],
    })
    expect(r.overall).toBe(100)
  })

  it('parfaitement aligné → score 100 sans alerte', () => {
    // 2 membres 50/50, contributions égales en temps
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50, contributionSeconds: 7200 }),
        member({ userId: 'b', sharesPct: 50, contributionSeconds: 7200 }),
      ],
    })
    expect(r.overall).toBe(100)
    expect(r.alerts).toHaveLength(0)
    expect(r.perMember[0].deltaPct).toBeCloseTo(0)
  })

  it('écart 5pp → score ~90, pas d alerte', () => {
    // 2 membres 50/50, mais a contribue 55% du temps
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50, contributionSeconds: 5500 }),
        member({ userId: 'b', sharesPct: 50, contributionSeconds: 4500 }),
      ],
    })
    // avg(deltaA=5, deltaB=5) = 5pp → score = 100 - 2*5 = 90
    expect(r.overall).toBe(90)
    expect(r.alerts).toHaveLength(0)        // sous le seuil warning de 8pp
    expect(r.perMember[0].alertLevel).toBe('none')
  })

  it('écart 10pp → alerte warning', () => {
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50, contributionSeconds: 6000 }),
        member({ userId: 'b', sharesPct: 50, contributionSeconds: 4000 }),
      ],
    })
    expect(r.perMember[0].alertLevel).toBe('warning')
    expect(r.perMember[1].alertLevel).toBe('warning')
    expect(r.alerts.length).toBeGreaterThan(0)
    expect(r.overall).toBeLessThan(90)
  })

  it('écart 25pp → alerte critical, score bas', () => {
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50, contributionSeconds: 7500 }),
        member({ userId: 'b', sharesPct: 50, contributionSeconds: 2500 }),
      ],
    })
    expect(r.perMember[0].alertLevel).toBe('critical')
    expect(r.alerts.some((a) => a.includes('fortement'))).toBe(true)
    expect(r.overall).toBeLessThan(60)
  })

  it('normalise les shares quand somme ≠ 100', () => {
    // 3 membres avec 40 + 40 + 30 = 110% (input mal défini)
    // Contributions égales → après normalisation chaque membre = 33.3%
    // donc deltas faibles
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 40, contributionSeconds: 3600 }),
        member({ userId: 'b', sharesPct: 40, contributionSeconds: 3600 }),
        member({ userId: 'c', sharesPct: 30, contributionSeconds: 3600 }),
      ],
    })
    // normalized shares : 40/110*100 = 36.36, 40/110*100 = 36.36, 30/110*100 = 27.27
    // contrib pct : 33.33 each
    // delta a/b = ~3pp, delta c = ~6pp → moyenne ~4pp → score ~92
    expect(r.overall).toBeGreaterThan(80)
    expect(r.perMember.every((m) => m.alertLevel === 'none')).toBe(true)
  })

  it("inclut l'argent investi dans la valeur de contribution", () => {
    // a : 0h de temps, 10 000 € investis
    // b : 200h de temps (200*50€=10 000 €), 0€
    // Avec rate par défaut 50€/h → valeurs égales → 50/50 → aligné avec parts
    const r = computeEquityScorePure({
      members: [
        member({
          userId: 'a',
          sharesPct: 50,
          contributionSeconds: 0,
          contributionCents: 1_000_000,
        }),
        member({
          userId: 'b',
          sharesPct: 50,
          contributionSeconds: 200 * 3600,
          contributionCents: 0,
        }),
      ],
    })
    expect(r.perMember[0].contribPct).toBeCloseTo(50, 0)
    expect(r.perMember[1].contribPct).toBeCloseTo(50, 0)
    expect(r.overall).toBe(100)
  })

  it('respecte le taux horaire custom', () => {
    // a : 1h à 100€/h = 100€, b : 200€ investis → b vaut 2× a
    const r = computeEquityScorePure({
      members: [
        member({ userId: 'a', sharesPct: 50, contributionSeconds: 3600 }),
        member({
          userId: 'b',
          sharesPct: 50,
          contributionSeconds: 0,
          contributionCents: 20000,
        }),
      ],
      hourlyRateEur: 100,
    })
    // a vaut 100€ = 10000c, b vaut 20000c → totalValue 30000
    // a contribPct = 33.33, b = 66.67
    // shares normalisées : 50/50 chacun
    // delta a = 16.67, delta b = 16.67 → avg 16.67 → score = 100 - 33.33 = 67
    expect(r.perMember[0].contribValueCents).toBe(10000)
    expect(r.perMember[1].contribValueCents).toBe(20000)
    expect(r.overall).toBeLessThanOrEqual(70)
    expect(r.perMember[0].alertLevel).toBe('warning')
  })
})
