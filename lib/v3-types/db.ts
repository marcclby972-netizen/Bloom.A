/**
 * Bloom v3 — Types BD bruts (snake_case).
 *
 * Idéalement généré via :
 *   supabase gen types typescript --project-id <PROJECT_ID> > lib/types/db.ts
 *
 * En attendant la génération auto, on déclare ici à la main les types
 * des tables v3 critiques. Si schéma diverge → re-générer.
 *
 * Les services (`lib/services/*`) consomment ces types DB et les mappent
 * vers les types camelCase de `./index.ts`.
 */

import type {
  TeamRole, ProjectStatus, TaskStatus, TaskPriority,
  GovernanceRuleType, ValidationMode, DecisionKind, DecisionStatus,
  NotificationType,
} from './index'

// ─── Teams (vue depuis organizations) ──────────────────────────

export type DbTeam = {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Memberships (vue depuis organization_members) ─────────────

export type DbMembership = {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  shares: number | null
  permissions: Record<string, unknown>
  status: 'active' | 'inactive'
  created_at: string
}

// ─── Governance Rules ──────────────────────────────────────────

export type DbGovernanceRule = {
  id: string
  team_id: string
  type: GovernanceRuleType
  threshold_amount_cents: number | null
  validation_mode: ValidationMode
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── Projects v3 ───────────────────────────────────────────────

export type DbProject = {
  id: string
  team_id: string | null
  owner_user_id: string
  name: string
  description: string
  status: ProjectStatus
  color: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// ─── Tasks v3 ──────────────────────────────────────────────────

export type DbTask = {
  id: string
  project_id: string
  assignee_user_id: string | null
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Time Entries v3 ───────────────────────────────────────────

export type DbTimeEntry = {
  id: string
  user_id: string
  project_id: string | null
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null  // generated column
  note: string
  created_at: string
}

// ─── Decisions ─────────────────────────────────────────────────

export type DbDecision = {
  id: string
  organization_id: string             // legacy name in DB
  kind: DecisionKind
  title: string
  description: string | null
  amount_cents: number | null
  created_by: string
  status: DecisionStatus
  created_at: string
  decided_at: string | null
}

export type DbVote = {
  id: string
  decision_id: string
  user_id: string
  vote: 'yes' | 'no' | 'abstain'       // legacy name
  created_at: string
}

// ─── Notifications ─────────────────────────────────────────────

export type DbNotification = {
  id: string
  user_id: string
  type: NotificationType | string      // tolerant — DB n'a pas de check
  title: string
  body: string | null
  payload: Record<string, unknown>
  read: boolean                        // legacy bool, à wrapper en readAt
  created_at: string
}

// ─── Expenses v3 ───────────────────────────────────────────────

export type DbExpense = {
  id: string
  team_id: string
  created_by: string
  amount_cents: number
  currency: string
  category: string | null
  description: string
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  decision_id: string | null
  spent_at: string                     // 'YYYY-MM-DD'
  created_at: string
  updated_at: string
}

// ─── Events v3 ─────────────────────────────────────────────────

export type DbEvent = {
  id: string
  user_id: string
  team_id: string | null
  project_id: string | null
  task_id: string | null
  title: string
  description: string | null
  starts_at: string                    // ISO
  ends_at: string                      // ISO
  all_day: boolean
  color: string | null
  created_at: string
  updated_at: string
}
