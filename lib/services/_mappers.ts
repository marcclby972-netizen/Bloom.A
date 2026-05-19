/**
 * Mappers DB ↔ Domain (snake_case ↔ camelCase) pour les services v3.
 *
 * Convention :
 * - DB = snake_case (cf. lib/v3-types/db.ts)
 * - Domain = camelCase (cf. lib/v3-types/index.ts)
 * - Chaque entité a son `fromDb*` (DB → Domain) et `toDb*` partial pour les inserts.
 *
 * Si tu ajoutes une entité v3 → ajoute son mapper ici (DRY).
 */

import type {
  Team, Membership, Project, Task, TimeEntry,
  GovernanceRule, Decision, Vote, Notification, Event,
  VoteValue, TaskStatus, TaskPriority, ProjectStatus,
  TeamRole, GovernanceRuleType, ValidationMode,
  DecisionKind, DecisionStatus, NotificationType,
  MembershipPermissions,
} from '@/lib/v3-types'
import type {
  DbTeam, DbMembership, DbProject, DbTask, DbTimeEntry,
  DbGovernanceRule, DbDecision, DbVote, DbNotification, DbEvent,
} from '@/lib/v3-types/db'

// ─────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────

export function fromDbTeam(row: DbTeam): Team {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Membership (alias view sur organization_members)
// ─────────────────────────────────────────────────────────────

export function fromDbMembership(row: DbMembership): Membership {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role as TeamRole,
    shares: row.shares,
    permissions: (row.permissions || {}) as MembershipPermissions,
    status: row.status,
    createdAt: row.created_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Project v3
// ─────────────────────────────────────────────────────────────

export function fromDbProject(row: DbProject): Project {
  return {
    id: row.id,
    teamId: row.team_id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description || '',
    status: row.status as ProjectStatus,
    color: row.color,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Task v3
// ─────────────────────────────────────────────────────────────

export function fromDbTask(row: DbTask): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    assigneeUserId: row.assignee_user_id,
    title: row.title,
    description: row.description || '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────
// TimeEntry v3
// ─────────────────────────────────────────────────────────────

export function fromDbTimeEntry(row: DbTimeEntry): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    note: row.note || '',
    createdAt: row.created_at,
  }
}

// ─────────────────────────────────────────────────────────────
// GovernanceRule
// ─────────────────────────────────────────────────────────────

export function fromDbGovernanceRule(row: DbGovernanceRule): GovernanceRule {
  return {
    id: row.id,
    teamId: row.team_id,
    type: row.type as GovernanceRuleType,
    thresholdAmountCents: row.threshold_amount_cents,
    validationMode: row.validation_mode as ValidationMode,
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Decision + Vote
//
// DB schema uses `organization_id` (legacy column name) → we expose `teamId`.
// DB votes use 'yes' | 'no' | 'abstain' → domain uses 'for' | 'against' | 'abstain'.
// ─────────────────────────────────────────────────────────────

const DB_VOTE_TO_VALUE: Record<DbVote['vote'], VoteValue> = {
  yes: 'for',
  no: 'against',
  abstain: 'abstain',
}

const VALUE_TO_DB_VOTE: Record<VoteValue, DbVote['vote']> = {
  for: 'yes',
  against: 'no',
  abstain: 'abstain',
}

export function fromDbDecision(row: DbDecision): Decision {
  return {
    id: row.id,
    teamId: row.organization_id,
    kind: row.kind as DecisionKind,
    title: row.title,
    description: row.description,
    amountCents: row.amount_cents,
    status: row.status as DecisionStatus,
    createdBy: row.created_by,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    deadline: null, // not in current DB schema
  }
}

export function fromDbVote(row: DbVote): Vote {
  return {
    id: row.id,
    decisionId: row.decision_id,
    userId: row.user_id,
    value: DB_VOTE_TO_VALUE[row.vote] ?? 'abstain',
    createdAt: row.created_at,
  }
}

export function voteValueToDb(v: VoteValue): DbVote['vote'] {
  return VALUE_TO_DB_VOTE[v]
}

// ─────────────────────────────────────────────────────────────
// Notification
//
// DB column is `read: boolean`. Domain exposes `readAt: string | null`
// (timestamp when marked read, or null if unread). We synthesize the
// timestamp from `created_at` when read=true since the legacy schema
// doesn't track the actual read timestamp.
// ─────────────────────────────────────────────────────────────

export function fromDbNotification(row: DbNotification): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: (row.type || 'team_invite') as NotificationType,
    title: row.title || '',
    body: row.body,
    payload: row.payload || {},
    readAt: row.read ? row.created_at : null,
    createdAt: row.created_at,
  }
}

// ─────────────────────────────────────────────────────────────
// Event v3 (calendrier)
// ─────────────────────────────────────────────────────────────

export function fromDbEvent(row: DbEvent): Event {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    projectId: row.project_id,
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
