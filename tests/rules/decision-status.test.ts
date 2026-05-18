/**
 * Unit tests for the pure decision-status algorithm.
 * No Supabase, no mocks — just data in, status out.
 */

import { describe, it, expect } from 'vitest'
import {
  computeDecisionStatusPure, selectApplicableRule,
} from '@/lib/rules/decision-status'
import type {
  Decision, Vote, GovernanceRule, ValidationMode, DecisionKind,
} from '@/lib/v3-types'

// ── Test fixtures ─────────────────────────────────────────────

const makeDecision = (overrides: Partial<Decision> = {}): Decision => ({
  id: 'd1',
  teamId: 't1',
  kind: 'expense',
  title: 'Test',
  description: null,
  amountCents: 5000,
  status: 'pending',
  createdBy: 'u-marc',
  createdAt: '2026-05-18T10:00:00Z',
  decidedAt: null,
  deadline: null,
  ...overrides,
})

const makeVote = (userId: string, value: Vote['value']): Vote => ({
  id: `v-${userId}-${value}`,
  decisionId: 'd1',
  userId,
  value,
  createdAt: '2026-05-18T10:00:00Z',
})

const makeRule = (
  validationMode: ValidationMode,
  overrides: Partial<GovernanceRule> = {}
): GovernanceRule => ({
  id: `r-${validationMode}`,
  teamId: 't1',
  type: 'spending_threshold',
  thresholdAmountCents: 0,
  validationMode,
  active: true,
  createdBy: 'u-marc',
  createdAt: '2026-05-18T09:00:00Z',
  updatedAt: '2026-05-18T09:00:00Z',
  ...overrides,
})

const FOUNDERS_AND_ASSOCIATES = [
  { userId: 'u-marc', role: 'founder' as const },
  { userId: 'u-alex', role: 'founder' as const },
  { userId: 'u-sam', role: 'associate' as const },
]

// ── single_owner ─────────────────────────────────────────────

describe('computeDecisionStatusPure — single_owner', () => {
  const rule = makeRule('single_owner')

  it('approved when 1 founder votes for', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('approved')
    expect(r.tally.requiredFor).toBe(1)
  })

  it('pending when only associate votes for (not founder)', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-sam', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('pending')
  })

  it('pending when no votes', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('pending')
  })
})

// ── majority_vote ────────────────────────────────────────────

describe('computeDecisionStatusPure — majority_vote', () => {
  const rule = makeRule('majority_vote')

  it('approved when > 50% vote for (2/3 founders+associates)', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for'), makeVote('u-alex', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('approved')
    expect(r.tally.requiredFor).toBe(2) // floor(3/2)+1 = 2
  })

  it('pending when 1/3 votes for (50% not reached)', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('pending')
  })

  it('requires 2 votes for in a team of 2 (majority of 2 = 2)', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for')],
      eligible: [
        { userId: 'u-marc', role: 'founder' },
        { userId: 'u-alex', role: 'founder' },
      ],
      rules: [rule],
    })
    expect(r.status).toBe('pending')
    expect(r.tally.requiredFor).toBe(2)
  })
})

// ── unanimous ────────────────────────────────────────────────

describe('computeDecisionStatusPure — unanimous', () => {
  const rule = makeRule('unanimous')

  it('approved when 100% vote for', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: FOUNDERS_AND_ASSOCIATES.map((m) => makeVote(m.userId, 'for')),
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('approved')
  })

  it('rejected as soon as 1 vote against', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [
        makeVote('u-marc', 'for'),
        makeVote('u-alex', 'against'),
      ],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('rejected')
    expect(r.reason).toContain('contre')
  })

  it('pending when partial for votes and no against yet', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('pending')
  })
})

// ── deadline ─────────────────────────────────────────────────

describe('computeDecisionStatusPure — deadline', () => {
  const rule = makeRule('majority_vote')
  const pastDeadline = '2020-01-01T00:00:00Z'

  it('expired when deadline passed and not approved', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision({ deadline: pastDeadline }),
      votes: [makeVote('u-marc', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('expired')
  })

  it('still approved if deadline passed but threshold already met', () => {
    // pre-existing approved status overrides expired
    const r = computeDecisionStatusPure({
      decision: makeDecision({ deadline: pastDeadline, status: 'approved' }),
      votes: [makeVote('u-marc', 'for'), makeVote('u-alex', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [rule],
    })
    expect(r.status).toBe('approved')
  })
})

// ── edge cases ───────────────────────────────────────────────

describe('computeDecisionStatusPure — edge cases', () => {
  it('rejected when 0 eligible members', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [],
      eligible: [],
      rules: [makeRule('majority_vote')],
    })
    expect(r.status).toBe('rejected')
    expect(r.tally.totalEligible).toBe(0)
  })

  it('defaults to majority_vote when no rule applies', () => {
    const r = computeDecisionStatusPure({
      decision: makeDecision(),
      votes: [makeVote('u-marc', 'for'), makeVote('u-alex', 'for')],
      eligible: FOUNDERS_AND_ASSOCIATES,
      rules: [], // no rules
    })
    expect(r.status).toBe('approved') // 2/3 majority reached
  })
})

// ── selectApplicableRule ─────────────────────────────────────

describe('selectApplicableRule — spending_threshold selection', () => {
  const kind: DecisionKind = 'expense'

  it('picks the highest threshold <= amount', () => {
    const r1 = makeRule('single_owner', {
      id: 'low', type: 'spending_threshold', thresholdAmountCents: 1000,
    })
    const r2 = makeRule('majority_vote', {
      id: 'mid', type: 'spending_threshold', thresholdAmountCents: 5000,
    })
    const r3 = makeRule('unanimous', {
      id: 'high', type: 'spending_threshold', thresholdAmountCents: 50000,
    })

    // Amount 10_000 → r2 (5000 ≤ 10000 < 50000)
    const picked = selectApplicableRule([r1, r2, r3], kind, 10_000)
    expect(picked?.id).toBe('mid')
  })

  it('returns null if no rules at all', () => {
    expect(selectApplicableRule([], 'expense', 5000)).toBeNull()
  })

  it('falls back to matching kind for non-expense', () => {
    const distRule = makeRule('unanimous', {
      id: 'd', type: 'distribution', thresholdAmountCents: null,
    })
    const otherRule = makeRule('single_owner', {
      id: 'o', type: 'other', thresholdAmountCents: null,
    })
    const picked = selectApplicableRule([distRule, otherRule], 'distribution', null)
    expect(picked?.id).toBe('d')
  })
})
