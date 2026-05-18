import fs from 'node:fs'
import path from 'node:path'
import '../dashboard.css'
import { DashboardScripts } from './dashboard-scripts'

/**
 * Dashboard — port pixel-perfect du HTML reference
 * (cf. `reference bloom/dashboard.html`).
 *
 * Même stratégie que landing / onboard :
 *  - body HTML statique dans `app/dashboard-body.html` (sidebar, topbar,
 *    KPIs, projets, tâches, chrono live, décisions, journal, IA toast)
 *  - CSS dans `app/dashboard.css`
 *  - JS porté en TS dans `DashboardScripts` (mode toggle, sidebar collapse,
 *    chrono tick, tasks toggle, vote feedback)
 *
 * Les liens sidebar sont déjà remappés vers les vraies routes
 * (`/dashboard`, `/projects`, `/tasks`, `/chrono`, `/calendrier`,
 * `/decisions`, `/settings`).
 *
 * TODO (v3) : remplacer les données statiques (KPIs, tâches mock, votes)
 * par les vraies données via les hooks `useProjects`, `useTasks`,
 * `useTimer`, `useDecisions`, `useNotifications` — pour l'instant
 * cosmétique uniquement, identique au design ref.
 */
export default function DashboardPage() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), 'app', 'dashboard-body.html'),
    'utf8'
  )

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <DashboardScripts />
    </>
  )
}
