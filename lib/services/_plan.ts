/**
 * Helper interne : récupère le plan actif du user courant (côté service).
 *
 * Lit directement `user_settings.settings.plan` ou applique la logique
 * grandfather si absent — DOIT rester en sync avec
 * `lib/services/users.ts:computeDefaultPlan`.
 *
 * Volontairement isolé (pas via getCurrentUser) pour éviter un cycle et
 * réduire le coût (1 query Supabase au lieu de 2).
 */

import { createClient } from '@/lib/supabase/server'
import { ServiceFailure } from '@/lib/supabase/auth-helpers'
import { canUseFeature, type Feature } from '@/lib/rules/plan-capabilities'
import type { Plan } from '@/lib/v3-types'
import type { User as SbUser } from '@supabase/supabase-js'

const PRICING_LAUNCH_DATE = '2026-05-19T00:00:00Z'

function computeDefaultPlan(createdAt: string): Plan {
  return new Date(createdAt).getTime() < new Date(PRICING_LAUNCH_DATE).getTime()
    ? 'team'
    : 'free'
}

export async function getUserPlan(sbUser: SbUser): Promise<Plan> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', sbUser.id)
    .maybeSingle()

  const settings = data?.settings as { plan?: Plan } | null | undefined
  if (settings?.plan === 'free' || settings?.plan === 'solo' || settings?.plan === 'team') {
    return settings.plan
  }
  return computeDefaultPlan(sbUser.created_at)
}

/**
 * Throws une ServiceFailure 'plan_limit' si le plan n'autorise pas la feature.
 * Wrapping simple — utiliser dans les services avant l'I/O destructive.
 */
export async function assertPlanFeature(
  sbUser: SbUser,
  feature: Feature,
  hint?: string
): Promise<Plan> {
  const plan = await getUserPlan(sbUser)
  if (!canUseFeature(plan, feature)) {
    throw new ServiceFailure({
      code: 'plan_limit',
      message:
        hint ??
        `Cette fonctionnalité nécessite un plan supérieur (actuel : ${plan}).`,
      details: { plan, feature },
    })
  }
  return plan
}
