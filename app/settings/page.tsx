import fs from 'node:fs'
import path from 'node:path'
import '../settings.css'
import { SettingsScripts } from './settings-scripts'

/**
 * Settings — port pixel-perfect du HTML reference
 * (cf. `reference bloom/settings.html`).
 *
 * Même stratégie que les 3 autres pages :
 *  - body HTML statique dans `app/settings-body.html` (sidebar, topbar
 *    "Retour → Dashboard", panneau de nav latéral, sections Profil /
 *    Compte / Notifications / Apparence / Équipe / Facturation /
 *    Intégrations / Données / Avancé)
 *  - CSS dans `app/settings.css`
 *  - JS porté en TS dans `SettingsScripts` (section nav active state,
 *    IntersectionObserver, toggles, theme cards, swatches, save bar)
 *
 * Liens remappés : tb-back / brand → /dashboard, sidebar items → routes
 * réelles (/projects, /tasks, /chrono, /decisions, /settings).
 *
 * TODO (v3) : remplacer les inputs / toggles statiques par les actions
 * `updateProfileAction`, `updateNotificationPreferencesAction`,
 * `markNotificationReadAction`, etc. — pour l'instant cosmétique.
 */
export default function SettingsPage() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), 'app', 'settings-body.html'),
    'utf8'
  )

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <SettingsScripts />
    </>
  )
}
