/**
 * Tests pour plan-capabilities.ts — table-driven coverage des 3 plans
 * × principales features, plus les limites projets/membres/quotas.
 */

import { describe, it, expect } from 'vitest'
import {
  canUseFeature,
  getProjectLimit,
  getMembersIncluded,
  getAddonPriceCents,
  getPlanPriceCents,
  getAiSuggestionsQuota,
  getAiPostDraftsQuota,
  type Feature,
} from '@/lib/rules/plan-capabilities'

describe('canUseFeature', () => {
  it('chrono accessible sur tous les plans', () => {
    expect(canUseFeature('free', 'chrono')).toBe(true)
    expect(canUseFeature('solo', 'chrono')).toBe(true)
    expect(canUseFeature('team', 'chrono')).toBe(true)
  })

  it('projects_unlimited bloqué en free uniquement', () => {
    expect(canUseFeature('free', 'projects_unlimited')).toBe(false)
    expect(canUseFeature('solo', 'projects_unlimited')).toBe(true)
    expect(canUseFeature('team', 'projects_unlimited')).toBe(true)
  })

  it('team_invite uniquement en team', () => {
    expect(canUseFeature('free', 'team_invite')).toBe(false)
    expect(canUseFeature('solo', 'team_invite')).toBe(false)
    expect(canUseFeature('team', 'team_invite')).toBe(true)
  })

  it('toutes les features team-only sont bloquées en free/solo', () => {
    const teamOnly: Feature[] = [
      'team_invite',
      'team_dashboard',
      'governance_rules',
      'decisions',
      'expenses',
      'contributions_equity',
      'marketing_stats',
      'ai_unlimited',
      'ai_imbalance_detection',
    ]
    for (const f of teamOnly) {
      expect(canUseFeature('free', f)).toBe(false)
      expect(canUseFeature('solo', f)).toBe(false)
      expect(canUseFeature('team', f)).toBe(true)
    }
  })

  it('plan null/undefined → fallback safe sur free', () => {
    expect(canUseFeature(null, 'team_invite')).toBe(false)
    expect(canUseFeature(undefined, 'projects_unlimited')).toBe(false)
    expect(canUseFeature(null, 'chrono')).toBe(true)
  })

  it('marketing_drafts dispo solo + team', () => {
    expect(canUseFeature('free', 'marketing_drafts')).toBe(false)
    expect(canUseFeature('solo', 'marketing_drafts')).toBe(true)
    expect(canUseFeature('team', 'marketing_drafts')).toBe(true)
  })
})

describe('getProjectLimit', () => {
  it('free = 2 projets max', () => {
    expect(getProjectLimit('free')).toBe(2)
  })

  it('solo + team = illimité', () => {
    expect(getProjectLimit('solo')).toBe(Number.POSITIVE_INFINITY)
    expect(getProjectLimit('team')).toBe(Number.POSITIVE_INFINITY)
  })

  it('null fallback sur free → 2', () => {
    expect(getProjectLimit(null)).toBe(2)
    expect(getProjectLimit(undefined)).toBe(2)
  })
})

describe('getMembersIncluded', () => {
  it('free et solo = 1, team = 3', () => {
    expect(getMembersIncluded('free')).toBe(1)
    expect(getMembersIncluded('solo')).toBe(1)
    expect(getMembersIncluded('team')).toBe(3)
  })
})

describe('getAddonPriceCents', () => {
  it('seul team a un add-on (9€/mois = 900c)', () => {
    expect(getAddonPriceCents('free')).toBe(0)
    expect(getAddonPriceCents('solo')).toBe(0)
    expect(getAddonPriceCents('team')).toBe(900)
  })
})

describe('getPlanPriceCents', () => {
  it('matche Notion : free=0, solo=900, team=2900', () => {
    expect(getPlanPriceCents('free')).toBe(0)
    expect(getPlanPriceCents('solo')).toBe(900)
    expect(getPlanPriceCents('team')).toBe(2900)
  })
})

describe('quotas IA', () => {
  it('suggestions : free=3, solo=15, team=∞', () => {
    expect(getAiSuggestionsQuota('free')).toBe(3)
    expect(getAiSuggestionsQuota('solo')).toBe(15)
    expect(getAiSuggestionsQuota('team')).toBe(Number.POSITIVE_INFINITY)
  })

  it('post drafts : free=0, solo=5, team=20', () => {
    expect(getAiPostDraftsQuota('free')).toBe(0)
    expect(getAiPostDraftsQuota('solo')).toBe(5)
    expect(getAiPostDraftsQuota('team')).toBe(20)
  })
})
