/**
 * Tests pour computeStreakByPlatform — couvre les 6 cas du plan :
 * empty / 1 jour / 7 consécutifs / break / multi-plateformes / target=2.
 */

import { describe, it, expect } from 'vitest'
import {
  computeStreakByPlatform,
  type SocialPlatform,
} from '@/lib/rules/streak'

/** Helper : date locale jour J - n */
function daysAgo(n: number, hour = 12): Date {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

describe('computeStreakByPlatform', () => {
  it('retourne 0/0 si aucun post', () => {
    const r = computeStreakByPlatform(
      new Map(),
      new Map<SocialPlatform, { perDay: number }>([['linkedin', { perDay: 1 }]])
    )
    expect(r.get('linkedin')).toEqual({ current: 0, longest: 0 })
  })

  it('retourne 0/0 si target_per_day = 0 (pas d objectif)', () => {
    const published = new Map<SocialPlatform, Date[]>([
      ['x', [daysAgo(0), daysAgo(1), daysAgo(2)]],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['x', { perDay: 0 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    expect(r.get('x')).toEqual({ current: 0, longest: 0 })
  })

  it('streak = 1 si publié aujourd hui avec target=1', () => {
    const published = new Map<SocialPlatform, Date[]>([
      ['linkedin', [daysAgo(0)]],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['linkedin', { perDay: 1 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    expect(r.get('linkedin')).toEqual({ current: 1, longest: 1 })
  })

  it('streak = 7 si 7 jours consécutifs', () => {
    const published = new Map<SocialPlatform, Date[]>([
      ['linkedin', [0, 1, 2, 3, 4, 5, 6].map((n) => daysAgo(n))],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['linkedin', { perDay: 1 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    expect(r.get('linkedin')?.current).toBe(7)
    expect(r.get('linkedin')?.longest).toBe(7)
  })

  it('break au milieu : current=3, longest=5', () => {
    // J-9..J-5 (5 jours), pause J-4 J-3, puis J-2 J-1 J0 (3 jours)
    const published = new Map<SocialPlatform, Date[]>([
      [
        'linkedin',
        [9, 8, 7, 6, 5, 2, 1, 0].map((n) => daysAgo(n)),
      ],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['linkedin', { perDay: 1 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    expect(r.get('linkedin')?.current).toBe(3)
    expect(r.get('linkedin')?.longest).toBe(5)
  })

  it('multi-plateformes indépendantes', () => {
    const published = new Map<SocialPlatform, Date[]>([
      ['linkedin', [0, 1, 2].map((n) => daysAgo(n))],
      ['x', [0].map((n) => daysAgo(n))],
      ['instagram', []],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['linkedin', { perDay: 1 }],
      ['x', { perDay: 1 }],
      ['instagram', { perDay: 1 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    expect(r.get('linkedin')?.current).toBe(3)
    expect(r.get('x')?.current).toBe(1)
    expect(r.get('instagram')?.current).toBe(0)
  })

  it('target=2 : seuls les jours avec ≥2 posts comptent', () => {
    // J0 : 2 posts, J-1 : 2 posts, J-2 : 1 post (raté), J-3 : 3 posts
    const published = new Map<SocialPlatform, Date[]>([
      [
        'x',
        [
          daysAgo(0, 9),
          daysAgo(0, 18),
          daysAgo(1, 8),
          daysAgo(1, 20),
          daysAgo(2, 12),
          daysAgo(3, 9),
          daysAgo(3, 12),
          daysAgo(3, 18),
        ],
      ],
    ])
    const targets = new Map<SocialPlatform, { perDay: number }>([
      ['x', { perDay: 2 }],
    ])
    const r = computeStreakByPlatform(published, targets)
    // J0 + J-1 atteints (current = 2), pas J-2 (raté), J-3 atteint
    // longest = 2 (j0+j-1) ou 1 (j-3) → max = 2
    expect(r.get('x')?.current).toBe(2)
    expect(r.get('x')?.longest).toBe(2)
  })
})
