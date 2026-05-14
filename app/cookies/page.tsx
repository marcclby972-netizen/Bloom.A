'use client'

import { useState } from 'react'
import { COOKIE_CATALOG, type CookieDescriptor } from '@/lib/cookies'
import { CookiePreferencesModal } from '@/components/cookies/CookiePreferencesModal'

const LAST_UPDATED = '15 mai 2026'

const CATEGORY_LABELS: Record<string, { label: string; tone: string }> = {
  essential: { label: 'Strictement nécessaires', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  functional: { label: 'Fonctionnels', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  analytics: { label: 'Mesure d\'audience', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
  marketing: { label: 'Marketing', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' },
}

export default function CookiesPage() {
  const [prefsOpen, setPrefsOpen] = useState(false)

  const grouped = COOKIE_CATALOG.reduce<Record<string, CookieDescriptor[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  return (
    <>
      <div className="min-h-screen bg-background py-12 px-4">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Politique de cookies</h1>
          <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {LAST_UPDATED}</p>

          {/* Quick action */}
          <div className="mb-10 p-4 border border-border rounded-xl bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-medium">Modifier mes préférences</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vous pouvez activer ou désactiver chaque catégorie à tout moment.
              </p>
            </div>
            <button
              onClick={() => setPrefsOpen(true)}
              className="text-xs font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Gérer mes choix
            </button>
          </div>

          <Section title="1. Qu'est-ce qu'un cookie ?">
            <p>
              Un <strong>cookie</strong> est un petit fichier texte déposé sur votre appareil
              (ordinateur, mobile, tablette) par un site web que vous visitez. Il permet
              notamment au site de vous reconnaître d&apos;une page à l&apos;autre, de mémoriser
              vos préférences ou de mesurer la fréquentation.
            </p>
            <p>
              Cette politique couvre également les technologies similaires que nous utilisons :{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">localStorage</code>,{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">sessionStorage</code> et{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">IndexedDB</code>, qui sont
              des espaces de stockage dans votre navigateur fonctionnellement équivalents aux cookies.
            </p>
          </Section>

          <Section title="2. Cadre légal">
            <p>
              Bloom respecte le{' '}
              <strong>Règlement Général sur la Protection des Données (RGPD)</strong>, la{' '}
              <strong>directive ePrivacy</strong> et les recommandations de la{' '}
              <strong>CNIL</strong> en matière de cookies et traceurs.
            </p>
            <ul>
              <li>
                Aucun cookie autre que strictement nécessaire n&apos;est déposé avant votre
                consentement explicite.
              </li>
              <li>
                Refuser les cookies non essentiels est aussi simple que de les accepter
                (deux clics maximum).
              </li>
              <li>
                Vous pouvez modifier ou retirer votre consentement à tout moment.
              </li>
              <li>
                Votre choix est mémorisé pour ne pas vous solliciter à chaque visite, et
                réexaminé si la politique évolue de manière significative.
              </li>
            </ul>
          </Section>

          <Section title="3. Cookies utilisés par Bloom">
            <p>
              Voici la liste exhaustive des cookies et technologies similaires utilisés par
              Bloom, regroupés par finalité :
            </p>

            {(['essential', 'functional', 'analytics', 'marketing'] as const).map((cat) => {
              const items = grouped[cat] || []
              const meta = CATEGORY_LABELS[cat]
              return (
                <div key={cat} className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold">{meta.label}</h3>
                    <span className={'text-[10px] font-medium px-2 py-0.5 rounded-full ' + meta.tone}>
                      {items.length} {items.length > 1 ? 'entrées' : 'entrée'}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Aucun cookie de cette catégorie n&apos;est actuellement déposé par Bloom.
                    </p>
                  ) : (
                    <div className="space-y-2 not-prose">
                      {items.map((c) => (
                        <div key={c.name} className="border border-border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <code className="text-xs font-mono font-medium break-all">{c.name}</code>
                            <span className="text-[10px] text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-muted">
                              {c.type}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {c.purpose}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                            <span><strong>Émetteur :</strong> {c.provider}</span>
                            <span><strong>Durée :</strong> {c.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </Section>

          <Section title="4. Vos choix">
            <p>Vous disposez de plusieurs moyens pour gérer vos cookies :</p>
            <ul>
              <li>
                <strong>Via Bloom :</strong> utilisez le bouton « Gérer mes choix » en haut de
                cette page, ou ouvrez{' '}
                <a href="/settings" className="text-primary hover:underline">Paramètres → Données → Cookies</a>.
              </li>
              <li>
                <strong>Via votre navigateur :</strong> tous les navigateurs modernes (Chrome,
                Firefox, Safari, Edge…) permettent de bloquer ou supprimer les cookies depuis
                leurs paramètres de confidentialité.
              </li>
              <li>
                <strong>En cas de blocage total :</strong> vous serez automatiquement déconnecté
                de votre compte à chaque rechargement de page, et certaines préférences
                d&apos;affichage ne seront plus mémorisées.
              </li>
            </ul>
          </Section>

          <Section title="5. Pas de cookies tiers">
            <p>
              Bloom <strong>n&apos;utilise aucun cookie tiers à des fins publicitaires ou de
              suivi inter-sites</strong>. Nous ne faisons pas appel à Google Analytics,
              Facebook Pixel, ni à aucun réseau publicitaire.
            </p>
            <p>
              Les seuls cookies déposés proviennent soit directement de Bloom, soit de notre
              prestataire d&apos;authentification Supabase (uniquement pour maintenir votre
              session connectée).
            </p>
            <p>
              Lorsque vous connectez un service externe (LinkedIn, YouTube, Google Calendar,
              Stripe…) via les intégrations OAuth, ces services peuvent déposer leurs propres
              cookies pendant le flux de connexion sur leur domaine — pas sur celui de Bloom.
              Reportez-vous à leurs politiques respectives.
            </p>
          </Section>

          <Section title="6. Durée de conservation de votre consentement">
            <p>
              Votre choix de consentement est conservé <strong>13 mois maximum</strong>,
              conformément aux recommandations de la CNIL. Au-delà, ou si la présente
              politique évolue de manière significative, la bannière sera réaffichée pour
              que vous puissiez confirmer ou modifier votre choix.
            </p>
          </Section>

          <Section title="7. Évolution de cette politique">
            <p>
              Cette politique peut être amenée à évoluer. Toute modification matérielle
              (nouveau type de cookie, nouvelle finalité, nouveau prestataire) entraînera
              un nouvel affichage de la bannière de consentement.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Pour toute question relative aux cookies ou à la protection de vos données,
              contactez-nous à{' '}
              <a href="mailto:marc.clby.972@gmail.com" className="text-primary hover:underline">
                marc.clby.972@gmail.com
              </a>.
            </p>
            <p>
              Vous disposez également du droit d&apos;introduire une réclamation auprès de la{' '}
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                CNIL
              </a>.
            </p>
          </Section>

          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <a href="/" className="text-sm text-primary hover:underline">← Retour à Bloom</a>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <a href="/privacy" className="hover:underline">Politique de confidentialité</a>
              <span>·</span>
              <a href="/terms" className="hover:underline">Conditions d&apos;utilisation</a>
            </div>
          </div>
        </article>
      </div>

      <CookiePreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 mt-6">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/80 space-y-3">
        {children}
      </div>
    </section>
  )
}
