'use client'

/**
 * Calendrier — placeholder en attendant l'intégration calendar.
 *
 * Le module agenda nécessite : (a) un modèle event/meeting dans v3,
 * (b) une intégration Google Calendar/iCloud côté server, (c) un parsing
 * iCal/RFC5545 pour les évènements récurrents.
 *
 * En attendant on rend la coquille du shell + une page "Bientôt" cohérente
 * avec le reste de l'app.
 */

import Link from 'next/link'
import {
  DashboardShell,
  PageHeader,
} from '../dashboard/_components/DashboardShell'

export default function CalendrierPage() {
  return (
    <DashboardShell screenLabel="Calendrier">
      <PageHeader
        eyebrow="Vue"
        title="Calendrier"
        right={
          <span
            className="tag"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(236,236,236,0.55)',
            }}
          >
            Bientôt
          </span>
        }
      />

      <div
        className="widget"
        style={{
          padding: '48px 36px',
          textAlign: 'center',
          background:
            'linear-gradient(135deg, rgba(227,117,32,0.06) 0%, rgba(251,190,77,0.03) 100%)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 18px',
            borderRadius: 18,
            background: 'var(--gradient)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 18 18"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <rect x="2.5" y="4" width="13" height="11" rx="1.6" />
            <path d="M2.5 7h13M6 2.5v3M12 2.5v3" />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 8,
          }}
        >
          Le calendrier arrive bientôt
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(236,236,236,0.65)',
            lineHeight: 1.55,
            maxWidth: 480,
            margin: '0 auto 24px',
          }}
        >
          On travaille sur l&apos;intégration Google&nbsp;Calendar et iCloud
          pour réunir tes rendez-vous, tes votes d&apos;équipe et tes
          créneaux chrono en une seule vue.
        </p>
        <Link href="/dashboard" className="btn btn-ghost-dark">
          ← Retour au dashboard
        </Link>
      </div>
    </DashboardShell>
  )
}
