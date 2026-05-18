/**
 * Unit tests for canStartTimer (pure decision : noop | switch | start).
 */

import { describe, it, expect } from 'vitest'
import { canStartTimer } from '@/lib/rules/timer-constraint'
import type { TimeEntry } from '@/lib/v3-types'

const makeEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => ({
  id: 'te-1',
  userId: 'u-marc',
  projectId: 'p-bloom',
  taskId: null,
  startedAt: '2026-05-18T10:00:00Z',
  endedAt: null,
  durationSeconds: null,
  note: '',
  createdAt: '2026-05-18T10:00:00Z',
  ...overrides,
})

describe('canStartTimer', () => {
  it('returns start when no active entry', () => {
    expect(canStartTimer(null, { projectId: 'p-x' })).toBe('start')
    expect(canStartTimer(null, {})).toBe('start')
  })

  it('returns noop when same project + task (idempotent)', () => {
    const active = makeEntry({ projectId: 'p-bloom', taskId: 't-1' })
    expect(canStartTimer(active, { projectId: 'p-bloom', taskId: 't-1' })).toBe('noop')
  })

  it('returns noop when both null (no-project entry, no-project intent)', () => {
    const active = makeEntry({ projectId: null, taskId: null })
    expect(canStartTimer(active, {})).toBe('noop')
    expect(canStartTimer(active, { projectId: null, taskId: null })).toBe('noop')
  })

  it('returns switch when different project', () => {
    const active = makeEntry({ projectId: 'p-bloom', taskId: null })
    expect(canStartTimer(active, { projectId: 'p-other' })).toBe('switch')
  })

  it('returns switch when same project but different task', () => {
    const active = makeEntry({ projectId: 'p-bloom', taskId: 't-1' })
    expect(canStartTimer(active, { projectId: 'p-bloom', taskId: 't-2' })).toBe('switch')
  })

  it('returns switch when active has project but intent has none', () => {
    const active = makeEntry({ projectId: 'p-bloom' })
    expect(canStartTimer(active, {})).toBe('switch')
  })

  it('treats undefined projectId in intent as null (no project)', () => {
    const active = makeEntry({ projectId: null, taskId: null })
    expect(canStartTimer(active, { projectId: undefined })).toBe('noop')
  })
})
