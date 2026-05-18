import fs from 'node:fs'
import path from 'node:path'
import '../onboard.css'
import { OnboardScripts } from './onboard-scripts'

/**
 * Onboard — port pixel-perfect du HTML reference
 * (cf. `reference bloom/onboarding.html`).
 *
 * Stratégie identique au Landing :
 *  - HTML body stocké tel quel dans `app/onboard-body.html` (sans `<script>`).
 *  - CSS dans `app/onboard.css` (importé en global pour cette page).
 *  - JS porté en TS dans `OnboardScripts` (composant 'use client' qui
 *    réattache les fonctions inline `onclick="goNext()"` à `window` et
 *    monte les listeners pour les cards/swatches/governance).
 *
 *  - Les liens "Se connecter" / "Ouvrir le dashboard" sont déjà remappés
 *    vers `/login` et `/dashboard` dans le HTML.
 *
 *  TODO (v3) : remplacer les flows simulés par des appels server actions
 *  (`createTeamAction`, `inviteMemberAction`, `createProjectAction`,
 *  `createTaskAction`, `startTimerAction`) — cf. `lib/actions/*`. Pour
 *  l'instant la page est cosmétique et redirige vers `/dashboard` à la fin.
 */
export default function OnboardPage() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), 'app', 'onboard-body.html'),
    'utf8'
  )

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <OnboardScripts />
    </>
  )
}
