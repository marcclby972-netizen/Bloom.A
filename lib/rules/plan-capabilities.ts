/**
 * Plan capabilities — pure fonction qui détermine quelles features sont
 * accessibles selon le plan abonnement (Free / Solo / Team).
 *
 * Source de vérité : Notion "💰 Stratégie de pricing"
 * (page id 362bc505-2ea3-81da-a7e2-d4a6bb18e7c5).
 *
 * Comportement défensif : si plan est null/undefined/invalide → fallback
 * sur 'free' (jamais throw, jamais débloquer une feature par erreur).
 *
 * Ce module doit rester pure : pas de Supabase, pas d'I/O. Il est
 * appelé depuis les services (enforcement) ET côté UI (badges/locks).
 */

import type { Plan } from '@/lib/v3-types'

const INFINITY = Number.POSITIVE_INFINITY

export type Feature =
  // Plan free
  | 'project_create'              // toujours possible (limite via getProjectLimit)
  | 'task_create'
  | 'chrono'
  | 'stats_basic'

  // Plan solo+
  | 'projects_unlimited'
  | 'stats_full'
  | 'stats_overall'
  | 'marketing_drafts'
  | 'marketing_calendar'
  | 'ai_summary_week'
  | 'ai_post_drafts'              // rédaction posts LinkedIn

  // Plan team uniquement
  | 'team_invite'
  | 'team_dashboard'
  | 'governance_rules'
  | 'decisions'
  | 'expenses'
  | 'contributions_equity'
  | 'marketing_stats'
  | 'ai_unlimited'
  | 'ai_imbalance_detection'

const CAPABILITIES: Record<Feature, ReadonlyArray<Plan>> = {
  // Tous les plans
  project_create: ['free', 'solo', 'team'],
  task_create: ['free', 'solo', 'team'],
  chrono: ['free', 'solo', 'team'],
  stats_basic: ['free', 'solo', 'team'],

  // Solo + Team
  projects_unlimited: ['solo', 'team'],
  stats_full: ['solo', 'team'],
  stats_overall: ['solo', 'team'],
  marketing_drafts: ['solo', 'team'],
  marketing_calendar: ['solo', 'team'],
  ai_summary_week: ['solo', 'team'],
  ai_post_drafts: ['solo', 'team'],

  // Team uniquement
  team_invite: ['team'],
  team_dashboard: ['team'],
  governance_rules: ['team'],
  decisions: ['team'],
  expenses: ['team'],
  contributions_equity: ['team'],
  marketing_stats: ['team'],
  ai_unlimited: ['team'],
  ai_imbalance_detection: ['team'],
}

/**
 * @returns true si le plan a accès à la feature.
 *          Plan null/undefined → fallback 'free'.
 */
export function canUseFeature(
  plan: Plan | null | undefined,
  feature: Feature
): boolean {
  const safePlan: Plan = plan ?? 'free'
  return CAPABILITIES[feature].includes(safePlan)
}

/**
 * @returns nombre max de projets actifs pour ce plan.
 *          free=2, solo/team=∞.
 */
export function getProjectLimit(plan: Plan | null | undefined): number {
  const safePlan: Plan = plan ?? 'free'
  switch (safePlan) {
    case 'free':
      return 2
    case 'solo':
    case 'team':
      return INFINITY
  }
}

/**
 * @returns nombre de membres inclus dans le plan (sans add-on).
 *          free=1, solo=1, team=3.
 */
export function getMembersIncluded(plan: Plan | null | undefined): number {
  const safePlan: Plan = plan ?? 'free'
  switch (safePlan) {
    case 'free':
    case 'solo':
      return 1
    case 'team':
      return 3
  }
}

/**
 * @returns prix de l'add-on par membre supplémentaire (cents/mois).
 *          0 pour les plans qui n'autorisent pas l'add-on.
 */
export function getAddonPriceCents(plan: Plan | null | undefined): number {
  const safePlan: Plan = plan ?? 'free'
  return safePlan === 'team' ? 900 : 0
}

/**
 * Prix mensuel de base du plan en centimes.
 */
export function getPlanPriceCents(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 0
    case 'solo':
      return 900
    case 'team':
      return 2900
  }
}

/**
 * Quotas IA mensuels par plan (cf. Notion).
 * Note : non-enforcés pour l'instant (cf. décision utilisateur), mais
 * exposés pour affichage dans /pricing.
 */
export function getAiSuggestionsQuota(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 3
    case 'solo':
      return 15
    case 'team':
      return INFINITY
  }
}

export function getAiPostDraftsQuota(plan: Plan): number {
  switch (plan) {
    case 'free':
      return 0
    case 'solo':
      return 5
    case 'team':
      return 20
  }
}
