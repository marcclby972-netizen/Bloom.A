'use client'

/**
 * PlanSection — affiche le plan actuel + features clés + bouton vers /pricing.
 *
 * Pour les users grandfathered (créés avant PRICING_LAUNCH_DATE), affiche
 * un badge "Beta gratuit" — ils sont auto sur 'team' tant que le plan
 * payant n'est pas activé.
 */

import Link from 'next/link'
import { Section } from './Section'
import { useCurrentUser } from '@/hooks'
import {
  canUseFeature,
  getProjectLimit,
  getMembersIncluded,
  getPlanPriceCents,
} from '@/lib/rules/plan-capabilities'
import type { Plan } from '@/lib/v3-types'

const PLAN_LABEL: Record<Plan, string> = {
  free: 'Free',
  solo: 'Solo',
  team: 'Team',
}

const PLAN_TAGLINE: Record<Plan, string> = {
  free: 'Pour découvrir Bloom',
  solo: 'Pour freelances et founders solo',
  team: 'Pour cofondateurs',
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Gratuit'
  return `${(cents / 100).toFixed(0)} € / mois`
}

const PRICING_LAUNCH_DATE = new Date('2026-05-19T00:00:00Z').getTime()

export function PlanSection() {
  const { data: user, loading } = useCurrentUser()
  const plan: Plan = (user?.settings.plan as Plan | undefined) ?? 'free'

  const isGrandfathered =
    !!user && new Date(user.createdAt).getTime() < PRICING_LAUNCH_DATE

  const projectLimit = getProjectLimit(plan)
  const members = getMembersIncluded(plan)

  return (
    <Section
      id="plan"
      eyebrow="Abonnement"
      title="Mon plan"
      description="Ce que ton plan actuel débloque. Tu peux changer à tout moment."
    >
      {loading && !user ? (
        <p style={{ color: 'var(--bloom-text-muted)', fontSize: 13 }}>
          Chargement…
        </p>
      ) : (
        <>
          {/* Plan card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 20,
              padding: 18,
              background: 'var(--bloom-surface-2)',
              border: '1px solid var(--bloom-border)',
              borderRadius: 14,
              marginBottom: 18,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--bloom-text)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  {PLAN_LABEL[plan]}
                </span>
                {isGrandfathered && (
                  <span
                    style={{
                      padding: '3px 8px',
                      background: 'rgba(255,138,26,0.16)',
                      color: '#FF8A1A',
                      fontSize: 10.5,
                      fontWeight: 700,
                      borderRadius: 5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Beta · Gratuit jusqu&apos;au lancement payant
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--bloom-text-muted)',
                  marginBottom: 12,
                }}
              >
                {PLAN_TAGLINE[plan]} ·{' '}
                <strong style={{ color: 'var(--bloom-text)' }}>
                  {formatPrice(getPlanPriceCents(plan))}
                </strong>
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 12.5,
                  color: 'var(--bloom-text-muted)',
                }}
              >
                <li>
                  ✓{' '}
                  {Number.isFinite(projectLimit)
                    ? `${projectLimit} projets max`
                    : 'Projets illimités'}
                </li>
                <li>✓ {members} membre{members > 1 ? 's' : ''} inclus</li>
                <li>
                  {canUseFeature(plan, 'marketing_drafts') ? '✓' : '✗'}{' '}
                  Module marketing (posts + calendrier)
                </li>
                <li>
                  {canUseFeature(plan, 'decisions') ? '✓' : '✗'}{' '}
                  Gouvernance, votes & dépenses
                </li>
                <li>
                  {canUseFeature(plan, 'contributions_equity') ? '✓' : '✗'}{' '}
                  Score d&apos;équité automatique
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
            >
              {plan === 'free' ? 'Passer au plan supérieur' : 'Changer de plan'}
            </Link>
          </div>

          <p
            style={{
              fontSize: 11.5,
              color: 'var(--bloom-text-faint)',
              lineHeight: 1.55,
            }}
          >
            Pour annuler ton abonnement, utilise la zone de danger plus bas.
            Le changement prend effet à la fin de la période de facturation.
          </p>
        </>
      )}
    </Section>
  )
}
