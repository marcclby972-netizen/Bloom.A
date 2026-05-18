'use client'

/**
 * Widget team-only "Règles actives" — liste des règles de gouvernance
 * `active = true`. Stamp visuel selon le mode (vote / solo / unanime).
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getGovernanceRulesAction } from '@/lib/actions/governance'
import type {
  GovernanceRule,
  GovernanceRuleType,
  ValidationMode,
} from '@/lib/v3-types'

const TYPE_LABEL: Record<GovernanceRuleType, string> = {
  spending_threshold: 'Dépense au-dessus du seuil',
  hiring: 'Recrutement',
  equity_change: 'Dilution / parts',
  distribution: 'Distribution / dividendes',
  other: 'Autre',
}

const MODE_LABEL: Record<ValidationMode, string> = {
  single_owner: 'Décision fondateur',
  majority_vote: 'Validation par vote majoritaire',
  unanimous: 'Unanimité requise',
}

const MODE_CLASS: Record<ValidationMode, string> = {
  single_owner: 'solo',
  majority_vote: 'vote',
  unanimous: 'unanimous',
}

const MODE_STAMP: Record<ValidationMode, string> = {
  single_owner: 'SOLO',
  majority_vote: 'VOTE',
  unanimous: 'UNANI.',
}

function formatThreshold(cents: number | null): string | null {
  if (cents == null) return null
  const euros = cents / 100
  if (euros >= 1000) return `> ${(euros / 1000).toFixed(0)} k€`
  return `> ${euros.toFixed(0)} €`
}

export function GovernanceRulesWidget({ teamId }: { teamId: string }) {
  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void getGovernanceRulesAction(teamId).then((r) => {
      if (cancelled) return
      if (r.ok) setRules(r.data.filter((g) => g.active))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [teamId])

  return (
    <div className="widget w-span-4 team-only">
      <div className="w-head">
        <div className="w-title">
          <span className="ico">
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10v6H2zM5 7.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Règles actives
        </div>
        <Link href="/decisions" className="w-link">
          + Ajouter
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading && rules.length === 0 && (
          <div className="rule-row" style={{ opacity: 0.5 }}>
            <span className="ico">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <div>
              <div className="nm">Chargement…</div>
            </div>
          </div>
        )}
        {!loading && rules.length === 0 && (
          <div className="rule-row" style={{ opacity: 0.6 }}>
            <span className="ico">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <div>
              <div className="nm">Aucune règle</div>
              <div className="desc">Définissez vos règles de gouvernance</div>
            </div>
          </div>
        )}
        {rules.slice(0, 4).map((r) => {
          const threshold = formatThreshold(r.thresholdAmountCents)
          const title =
            r.type === 'spending_threshold' && threshold
              ? `Dépenses ${threshold}`
              : TYPE_LABEL[r.type]
          return (
            <div className="rule-row" key={r.id}>
              <span className="ico">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <div>
                <div className="nm">{title}</div>
                <div className="desc">{MODE_LABEL[r.validationMode]}</div>
              </div>
              <span className={`stamp ${MODE_CLASS[r.validationMode]}`}>
                {MODE_STAMP[r.validationMode]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
