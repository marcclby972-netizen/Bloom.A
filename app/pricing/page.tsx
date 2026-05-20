'use client'

/**
 * Pricing — 3 plans Free/Solo/Team aligné Notion "💰 Stratégie de pricing"
 * (page id 362bc505-2ea3-81da-a7e2-d4a6bb18e7c5).
 *
 * Pas de Stripe checkout wired — les CTA pointent vers /onboard avec un
 * query param `?plan=` qui pourra être branché plus tard.
 *
 * 3 sections :
 *  1. Hero : 3 cards comparées
 *  2. Table features détaillée (chrono, projets, équipe, marketing, etc.)
 *  3. Table quotas IA (note "Bientôt" — pas d'enforcement implémenté)
 *  4. Note add-on +9€/membre
 */

import Link from 'next/link'
import './pricing.css'

type Plan = 'free' | 'solo' | 'team'

type PlanCard = {
  id: Plan
  name: string
  price: string
  priceUnit: string
  audience: string
  members: string
  cta: string
  highlight?: boolean
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 €',
    priceUnit: '/mois',
    audience: 'Découverte',
    members: '1 membre',
    cta: 'Commencer gratuitement',
  },
  {
    id: 'solo',
    name: 'Solo',
    price: '9 €',
    priceUnit: '/mois',
    audience: 'Freelance / founder seul',
    members: '1 membre',
    cta: 'Choisir Solo',
    highlight: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '29 €',
    priceUnit: '/mois',
    audience: 'Cofondateurs',
    members: '3 membres inclus',
    cta: 'Choisir Team',
  },
]

type FeatureRow = {
  label: string
  values: [string, string, string] // [Free, Solo, Team]
  bold?: boolean
}

const PRODUIT: FeatureRow[] = [
  { label: 'Chrono & time tracking', values: ['✓', '✓', '✓'] },
  { label: 'Projets', values: ['2 max', 'Illimité', 'Illimité'], bold: true },
  { label: 'Tâches', values: ['✓', '✓', '✓'] },
  { label: 'Dashboard Solo', values: ['✓', '✓', '✓'] },
  { label: 'Dashboard Équipe', values: ['—', '—', '✓'], bold: true },
  { label: 'Stats de temps', values: ['Basique', 'Complètes', 'Complètes'] },
  { label: 'Stats globales', values: ['—', '✓', '✓'] },
]

const MARKETING: FeatureRow[] = [
  { label: 'Module marketing (posts)', values: ['—', '✓', '✓'] },
  { label: 'Calendrier de publication', values: ['—', '✓', '✓'] },
  { label: 'Stats marketing', values: ['—', '—', '✓'] },
]

const EQUIPE: FeatureRow[] = [
  { label: 'Inviter des associés', values: ['—', '—', '✓'], bold: true },
  { label: "Score d'équité", values: ['—', '—', '✓'] },
  { label: 'Votes & décisions', values: ['—', '—', '✓'] },
  { label: 'Règles de gouvernance', values: ['—', '—', '✓'] },
  { label: 'Dépenses', values: ['—', '—', '✓'] },
]

const IA: FeatureRow[] = [
  { label: 'Suggestions de tâches', values: ['3/mois', '15/mois', 'Illimité'] },
  { label: 'Résumé de semaine', values: ['—', '✓', '✓'] },
  { label: 'Rédaction posts LinkedIn', values: ['—', '5/mois', '20/mois'] },
  { label: 'Détection déséquilibre équité', values: ['—', '—', '✓ auto'] },
  { label: 'Prévision de charge', values: ['—', '—', '✓ auto'] },
  { label: 'Alertes gouvernance', values: ['—', '—', '✓ auto'] },
]

export default function PricingPage() {
  return (
    <div className="pp-shell">
      <header className="pp-header">
        <Link href="/" className="pp-brand">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="pp-bg" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0" stopColor="#FF8A1A" />
                <stop offset="1" stopColor="#FBBE4D" />
              </linearGradient>
            </defs>
            <path d="M14 2C16.5 5 16.5 8 14 11C11.5 8 11.5 5 14 2Z" fill="url(#pp-bg)" />
            <path d="M26 14C23 16.5 20 16.5 17 14C20 11.5 23 11.5 26 14Z" fill="url(#pp-bg)" />
            <path d="M14 26C11.5 23 11.5 20 14 17C16.5 20 16.5 23 14 26Z" fill="url(#pp-bg)" />
            <path d="M2 14C5 11.5 8 11.5 11 14C8 16.5 5 16.5 2 14Z" fill="url(#pp-bg)" />
            <circle cx="14" cy="14" r="2.4" fill="#F3F3F2" />
          </svg>
          Bloom
        </Link>
        <nav className="pp-nav">
          <Link href="/login">Se connecter</Link>
          <Link href="/onboard" className="pp-cta-light">
            Essai gratuit
          </Link>
        </nav>
      </header>

      <main className="pp-main">
        <section className="pp-hero">
          <h1>
            Un OS pour cofondateurs.{' '}
            <span className="pp-accent">Un prix par workspace.</span>
          </h1>
          <p>
            Le fondateur paie, ses associés rejoignent gratuitement dans la
            limite du plan. Pas de seat tax cachée.
          </p>
        </section>

        {/* 3 cards */}
        <section className="pp-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`pp-card ${plan.highlight ? 'pp-card-highlight' : ''}`}
            >
              {plan.highlight && (
                <span className="pp-badge">Populaire freelance</span>
              )}
              <h3 className="pp-card-name">{plan.name}</h3>
              <div className="pp-card-price">
                <span className="pp-price">{plan.price}</span>
                <span className="pp-price-unit">{plan.priceUnit}</span>
              </div>
              <div className="pp-card-audience">{plan.audience}</div>
              <div className="pp-card-members">{plan.members}</div>
              <Link
                href={`/onboard?plan=${plan.id}`}
                className={`pp-card-cta ${plan.highlight ? 'pp-cta-primary' : 'pp-cta-secondary'}`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>

        {/* Note add-on */}
        <p className="pp-addon-note">
          <strong>Plus de 3 associés ?</strong> +9&nbsp;€/mois par membre
          supplémentaire à partir du 4e — ajustable à tout moment, sans
          changer de plan.
        </p>

        {/* Table features produit */}
        <FeatureTable title="Produit" rows={PRODUIT} />
        <FeatureTable title="Marketing" rows={MARKETING} />
        <FeatureTable title="Équipe & gouvernance" rows={EQUIPE} />
        <FeatureTable
          title={
            <>
              IA{' '}
              <span className="pp-soon-badge">Bientôt</span>
            </>
          }
          rows={IA}
        />

        <section className="pp-bottom-cta">
          <h2>Commence aujourd&apos;hui, change de plan plus tard.</h2>
          <p>
            14 jours d&apos;essai gratuit sur Solo et Team. Pas de carte
            bancaire requise. Annulation en 1 clic.
          </p>
          <Link href="/onboard" className="pp-cta-primary pp-bottom-cta-btn">
            Démarrer gratuitement
          </Link>
        </section>
      </main>
    </div>
  )
}

function FeatureTable({
  title,
  rows,
}: {
  title: React.ReactNode
  rows: FeatureRow[]
}) {
  return (
    <section className="pp-table-wrap">
      <h2 className="pp-table-title">{title}</h2>
      <table className="pp-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Free</th>
            <th>Solo</th>
            <th>Team</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={row.bold ? 'pp-row-bold' : ''}>
              <td>{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className={v === '✓' ? 'pp-yes' : v === '—' ? 'pp-no' : ''}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
