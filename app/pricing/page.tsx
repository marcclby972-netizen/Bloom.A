'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const FEATURES = [
  'Tâches, todo & calendrier illimités',
  'Projets & pipeline CRM',
  'Marketing : posts, métriques, ROI par projet',
  'Stripe : tracking revenus automatique',
  'Vocal : notes audio + transcription',
  'Coffre-fort : mots de passe chiffrés AES-256',
  'Iris IA (Claude, GPT-4, Gemini — apporte ta clé)',
  'Sync cloud cross-device',
  'Stats détaillées & objectifs',
  'Intégrations : Google Calendar, LinkedIn, YouTube, Notion, Whoop',
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  const monthly = 8.6
  const annual = 72.24
  const annualEquivMonthly = annual / 12
  const savings = ((monthly * 12 - annual) / (monthly * 12)) * 100

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 sm:px-10 lg:px-16 pt-6 pb-20 max-w-5xl mx-auto w-full">

        {/* Heading */}
        <div className="text-center pt-10 pb-12">
          <p className="card-num mb-3">/ TARIFS</p>
          <h1 className="h-display mb-4">Un prix simple. Tout inclus.</h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Une seule formule, paiement mensuel ou annuel. 30% de réduction sur l&apos;annuel.
            Annule quand tu veux, tes données restent exportables.
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex p-1 rounded-full bg-secondary">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                'h-10 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase',
                !yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                'h-10 px-5 text-[12px] font-medium tracking-tight rounded-full transition-colors uppercase relative',
                yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Annuel
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold">
                -{Math.round(savings)}%
              </span>
            </button>
          </div>
        </div>

        {/* Two pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Mensuel */}
          <div className={cn(
            'soft-card p-8 transition-all',
            !yearly && 'soft-card-hover ring-1 ring-foreground'
          )}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="card-num">/ MENSUEL</p>
              {!yearly && <span className="tag-pill">Sélectionné</span>}
            </div>
            <h3 className="text-lg font-semibold mt-2 mb-1">Bloom Pro</h3>
            <p className="text-sm text-muted-foreground mb-6">Facturé chaque mois, sans engagement.</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="kpi-display">{monthly.toFixed(2).replace('.', ',')} €</span>
                <span className="text-sm text-muted-foreground">/ mois</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Soit {(monthly * 12).toFixed(2).replace('.', ',')} € sur 12 mois</p>
            </div>

            <Link
              href="/onboard"
              className={cn(
                'w-full block text-center pill text-sm py-3',
                !yearly ? 'pill-dark' : ''
              )}
            >
              Commencer
            </Link>
          </div>

          {/* Annuel */}
          <div className={cn(
            'soft-card p-8 transition-all relative overflow-hidden',
            yearly && 'soft-card-hover ring-1 ring-foreground'
          )}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="card-num">/ ANNUEL</p>
              {yearly && <span className="tag-pill">Sélectionné</span>}
              {!yearly && <span className="tag-pill bg-emerald-100 text-emerald-800 border-emerald-200">2 mois offerts</span>}
            </div>
            <h3 className="text-lg font-semibold mt-2 mb-1">Bloom Pro · Annuel</h3>
            <p className="text-sm text-muted-foreground mb-6">Un paiement unique pour 12 mois.</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="kpi-display">{annual.toFixed(2).replace('.', ',')} €</span>
                <span className="text-sm text-muted-foreground">/ an</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Soit {annualEquivMonthly.toFixed(2).replace('.', ',')} € / mois · économie de {(monthly * 12 - annual).toFixed(2).replace('.', ',')} €
              </p>
            </div>

            <Link
              href="/onboard"
              className={cn(
                'w-full block text-center pill text-sm py-3',
                yearly ? 'pill-dark' : ''
              )}
            >
              Commencer
            </Link>
          </div>
        </div>

        {/* Features list */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="h-section text-center mb-8">Tout est inclus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 inline-flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6.5 5 8.5 9 4" />
                  </svg>
                </span>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto space-y-3">
          <h2 className="h-section text-center mb-8">Questions fréquentes</h2>
          <Faq q="Puis-je essayer avant de m'engager ?" a="Oui, 14 jours d'essai gratuit. Aucun moyen de paiement requis." />
          <Faq q="Comment annuler ?" a="Depuis Paramètres → Compte → Annuler l'abonnement. Effet immédiat à la fin du cycle en cours." />
          <Faq q="Mes données m'appartiennent ?" a="100%. Tu peux exporter tout en JSON depuis Paramètres → Données. Si tu supprimes ton compte, tout est effacé sous 30 jours." />
          <Faq q="Faut-il une clé API pour l'IA ?" a="Oui, tu apportes ta propre clé Anthropic / OpenAI / Google. Bloom ne facture pas l'usage IA." />
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Retour à Bloom
          </Link>
        </div>
      </div>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="soft-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
      >
        <span className="text-sm font-medium">{q}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={cn('transition-transform shrink-0 text-muted-foreground', open && 'rotate-180')}>
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>
      {open && <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground">{a}</div>}
    </div>
  )
}
