import fs from 'node:fs'
import path from 'node:path'
import './landing.css'
import { LandingScripts } from './landing-scripts'

/**
 * Landing — port pixel-perfect du HTML reference (cf. reference bloom/bloom-landing.html).
 *
 * Stratégie :
 *  - Le HTML body est stocké tel quel dans `app/landing-body.html` (sans le
 *    `<script>` final) — read au build/request time via fs (Server Component).
 *  - Le CSS du reference est dans `app/landing.css` (importé en global).
 *  - Le JS du reference est porté en TS dans `LandingScripts` (composant
 *    'use client' qui monte les listeners + IntersectionObserver + billing toggle).
 *  - Les liens d'auth (`/login`, `/onboard`) sont déjà remappés dans le HTML.
 *
 * Pour modifier le visuel : éditer `reference bloom/bloom-landing.html` (la
 * source de design) puis re-exporter le body + CSS dans `app/landing-body.html`
 * et `app/landing.css` (cf. workflow dans brandguidline.md).
 */
export default function LandingPage() {
  const bodyHtml = fs.readFileSync(
    path.join(process.cwd(), 'app', 'landing-body.html'),
    'utf8'
  )

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <LandingScripts />
    </>
  )
}
