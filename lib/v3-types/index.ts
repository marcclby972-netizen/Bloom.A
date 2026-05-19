/**
 * Bloom v3 — Types canoniques du domaine.
 *
 * Source de vérité côté code : ces types doivent rester en sync avec la
 * migration `supabase/migrations/20260518_bloom_v3_core.sql`.
 *
 * Convention :
 * - camelCase côté code, snake_case côté DB (les services s'occupent du mapping).
 * - Toutes les dates sont `string` (ISO) en provenance de Supabase.
 *   Les conversions vers Date / ms se font côté présentation.
 * - Les types brut de la DB sont dans `./db.ts` (à régénérer via
 *   `supabase gen types typescript` quand le schéma bouge).
 *
 * Si conflit entre ces types et `lib/types.ts` (legacy v2) : v3 gagne pour
 * le nouveau code, v2 reste pour le code archivé.
 */

// ─────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user'

export type UserSettings = {
  language?: 'fr' | 'en'
  timezone?: string                     // ex: "Europe/Paris"
  notifications?: {
    email?: boolean
    push?: boolean
  }
  [key: string]: unknown
}

export type User = {
  id: string                            // = auth.users.id
  email: string
  name: string | null
  role: UserRole
  settings: UserSettings
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Team & Membership
// ─────────────────────────────────────────────────────────────

export type TeamRole = 'founder' | 'associate' | 'guest'

export type MembershipPermissions = {
  // Granular permissions per feature.
  // Absent key = inherits default for the role.
  finance?: 'read' | 'write' | 'none'
  decisions?: 'read' | 'write' | 'none'
  projects?: 'read' | 'write' | 'none'
  governance?: 'read' | 'write' | 'none'
}

export type Team = {
  id: string
  name: string
  createdBy: string                     // user_id
  createdAt: string
  updatedAt: string
}

export type Membership = {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  /** Equity / parts en % (0..100). null = non défini. */
  shares: number | null
  permissions: MembershipPermissions
  status: 'active' | 'inactive'
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived'

export type Project = {
  id: string
  /** null = projet solo (perso). Sinon scoped à une team. */
  teamId: string | null
  ownerUserId: string
  name: string
  description: string
  status: ProjectStatus
  color: string | null
  dueDate: string | null                // ISO date (YYYY-MM-DD)
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// Task
// ─────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  projectId: string
  assigneeUserId: string | null
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// TimeEntry — chrono
// ─────────────────────────────────────────────────────────────

export type TimeEntry = {
  id: string
  userId: string
  projectId: string | null
  taskId: string | null
  startedAt: string                     // ISO timestamp
  /** null = encore en cours. Contrainte DB : 1 max par user. */
  endedAt: string | null
  /** Calculé en DB (generated column). null si en cours. */
  durationSeconds: number | null
  note: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Governance — Rules & Decisions
// ─────────────────────────────────────────────────────────────

export type GovernanceRuleType =
  | 'spending_threshold'
  | 'hiring'
  | 'equity_change'
  | 'distribution'
  | 'other'

export type ValidationMode = 'single_owner' | 'majority_vote' | 'unanimous'

export type GovernanceRule = {
  id: string
  teamId: string
  type: GovernanceRuleType
  /** Seuil en centimes (€ × 100). Utilisé seulement si type = spending_threshold. */
  thresholdAmountCents: number | null
  validationMode: ValidationMode
  active: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type DecisionKind =
  | 'expense'
  | 'rule_change'
  | 'distribution'
  | 'equity_change'
  | 'other'

export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'

export type Decision = {
  id: string
  teamId: string
  kind: DecisionKind
  title: string
  description: string | null
  /** Montant en centimes si pertinent (kind = expense). */
  amountCents: number | null
  status: DecisionStatus
  createdBy: string
  createdAt: string
  /** null = pas de deadline. Sinon ISO timestamp. */
  decidedAt: string | null
  deadline?: string | null              // si la décision a une date limite
}

export type VoteValue = 'for' | 'against' | 'abstain'

export type Vote = {
  id: string
  decisionId: string
  userId: string
  value: VoteValue
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_decision'
  | 'vote_result'
  | 'task_assigned'
  | 'timer_reminder'
  | 'rule_change'
  | 'member_joined'
  | 'team_invite'

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Helpers — résultats de calculs métier
// ─────────────────────────────────────────────────────────────

/** Résultat de `computeDecisionStatus()` — utilisé par le service governance. */
export type DecisionComputedStatus = {
  status: DecisionStatus
  /** Détail : combien de votes pour / contre / abstention sur le total requis. */
  tally: {
    for: number
    against: number
    abstain: number
    requiredFor: number                 // seuil de "for" pour passer (selon rule)
    totalEligible: number               // nombre de membres actifs habilités à voter
  }
  /** Raison textuelle pour debug / affichage admin. */
  reason: string
}

/** Snapshot temps pour un user sur une période (utilisé par getTimeStatsForUser). */
export type TimePeriod = 'day' | 'week' | 'month' | 'all'

export type TimeStats = {
  totalSeconds: number
  byProject: Array<{ projectId: string | null; seconds: number }>
  byDay: Array<{ date: string; seconds: number }> // date YYYY-MM-DD
  entriesCount: number
  averagePerDaySeconds: number          // sur la période
}

// ─────────────────────────────────────────────────────────────
// Expenses (dépenses équipe + auto-vote si seuil dépassé)
// ─────────────────────────────────────────────────────────────

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type Expense = {
  id: string
  teamId: string
  createdBy: string
  amountCents: number
  currency: string
  category: string | null
  description: string
  receiptUrl: string | null
  status: ExpenseStatus
  /** ID de la décision liée si auto-vote déclenché, null sinon. */
  decisionId: string | null
  /** ISO date 'YYYY-MM-DD'. */
  spentAt: string
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// Equity / Contributions (agrégation pour une team)
// ─────────────────────────────────────────────────────────────

export type MemberContribution = {
  userId: string
  membershipId: string
  role: TeamRole
  sharesPct: number | null
  /** Secondes totales trackées sur la période. */
  timeSeconds: number
  /** Total dépensé en centimes par ce membre (toutes catégories). */
  expensesCents: number
}

export type TeamContributionsResult = {
  teamId: string
  /** Période couverte (ISO timestamps). */
  from: string
  to: string
  members: MemberContribution[]
  /** Score d'équité 0..100 (cf. lib/rules/equity-score). */
  equityScore: number
  /** Alertes textuelles à afficher à l'utilisateur. */
  equityAlerts: string[]
}

// ─────────────────────────────────────────────────────────────
// Events (calendrier natif Bloom)
// ─────────────────────────────────────────────────────────────

export type Event = {
  id: string
  userId: string
  /** null = évènement perso (solo). Sinon scopé à une team. */
  teamId: string | null
  /** Lien optionnel vers un projet. */
  projectId: string | null
  /** Lien optionnel vers une tâche. */
  taskId: string | null
  title: string
  description: string | null
  startsAt: string                      // ISO
  endsAt: string                        // ISO
  allDay: boolean
  /** Hex couleur (ex. '#E37520'). Null = couleur par défaut. */
  color: string | null
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// Errors — types métier (pas Error JS — payload structuré)
// ─────────────────────────────────────────────────────────────

export type ServiceError = {
  code:
    | 'unauthorized'
    | 'not_found'
    | 'forbidden'
    | 'conflict'                        // ex: timer déjà actif
    | 'validation'
    | 'unknown'
  message: string
  details?: Record<string, unknown>
}
