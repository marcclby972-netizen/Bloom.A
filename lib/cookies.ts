'use client'

/**
 * Cookie & local-storage consent management.
 *
 * Bloom n'utilise pas de tracker tiers, mais on respecte quand même la directive
 * ePrivacy / RGPD : on demande consentement explicite au premier visit, on
 * laisse l'user refuser tout ce qui n'est pas strictement nécessaire, et on
 * documente chaque cookie posé.
 *
 * Catégories :
 * - essential : auth Supabase + CSRF — toujours actif, ne peut pas être désactivé
 * - functional : theme, polices, état de la sidebar — stocké en localStorage
 * - analytics : aucune mesure d'audience pour le moment, slot réservé
 * - marketing : aucun cookie publicitaire pour le moment, slot réservé
 */

export type CookieCategory = 'essential' | 'functional' | 'analytics' | 'marketing'

export type CookiePreferences = {
  essential: true            // toujours true, locked
  functional: boolean
  analytics: boolean
  marketing: boolean
  /** ISO timestamp of when consent was given */
  consentedAt: string
  /** Version of the cookie policy the user consented to */
  policyVersion: number
}

/**
 * Bumper cette version quand la politique cookies change matériellement
 * (nouveau type de cookie, nouveau finalité, etc.) — ça re-déclenchera
 * la bannière chez tous les users.
 */
export const COOKIE_POLICY_VERSION = 1

const STORAGE_KEY = 'bloom_cookie_consent'

const DEFAULT_PREFS: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  consentedAt: '',
  policyVersion: 0,
}

const ACCEPT_ALL: Omit<CookiePreferences, 'consentedAt' | 'policyVersion'> = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
}

const REJECT_ALL: Omit<CookiePreferences, 'consentedAt' | 'policyVersion'> = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
}

// ── Listeners (so the UI re-renders when preferences change) ──

const listeners = new Set<() => void>()
function notify() {
  for (const cb of listeners) try { cb() } catch {/* ignore */}
}

export function subscribeCookiePrefs(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

// ── Read / write ──

export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>
    return {
      essential: true,
      functional: !!parsed.functional,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      consentedAt: typeof parsed.consentedAt === 'string' ? parsed.consentedAt : '',
      policyVersion: typeof parsed.policyVersion === 'number' ? parsed.policyVersion : 0,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function setCookiePreferences(
  prefs: Omit<CookiePreferences, 'consentedAt' | 'policyVersion'>
) {
  if (typeof window === 'undefined') return
  const full: CookiePreferences = {
    ...prefs,
    essential: true,
    consentedAt: new Date().toISOString(),
    policyVersion: COOKIE_POLICY_VERSION,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full))
  notify()
}

/**
 * Vrai si l'user n'a jamais consenti, ou si la politique a été mise à jour
 * depuis son dernier consentement → on réaffiche la bannière.
 */
export function needsConsent(): boolean {
  if (typeof window === 'undefined') return false
  const prefs = getCookiePreferences()
  if (!prefs.consentedAt) return true
  if (prefs.policyVersion < COOKIE_POLICY_VERSION) return true
  return false
}

export function acceptAll() {
  setCookiePreferences(ACCEPT_ALL)
}

export function rejectAll() {
  setCookiePreferences(REJECT_ALL)
}

/**
 * Reset complet (utile pour debug ou pour le bouton "Revoir mes choix").
 * Ré-affichera la bannière au prochain render.
 */
export function resetConsent() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  notify()
}

// ── Catalogue des cookies effectivement posés ──
// Source de vérité pour la page /cookies et la modal de personnalisation.

export type CookieDescriptor = {
  name: string
  category: CookieCategory
  provider: string
  purpose: string
  duration: string
  type: 'cookie' | 'localStorage' | 'sessionStorage' | 'indexedDB'
}

export const COOKIE_CATALOG: CookieDescriptor[] = [
  // ── Essentiels (auth + sécurité) ──
  {
    name: 'sb-<project>-auth-token',
    category: 'essential',
    provider: 'Supabase',
    purpose: 'Maintien de la session authentifiée. Sans ce cookie, vous devez vous reconnecter à chaque visite.',
    duration: '1 an (renouvelé à chaque connexion)',
    type: 'cookie',
  },
  {
    name: 'sb-<project>-auth-token-code-verifier',
    category: 'essential',
    provider: 'Supabase',
    purpose: 'Protection CSRF lors du flux OAuth (PKCE).',
    duration: 'Session',
    type: 'cookie',
  },
  // ── Fonctionnels (préférences UI) ──
  {
    name: 'bloom_settings',
    category: 'functional',
    provider: 'Bloom',
    purpose: 'Vos préférences d\'interface : thème (clair/sombre), polices, modèle IA par défaut, paramètres notifications.',
    duration: 'Persistant (jusqu\'à suppression manuelle)',
    type: 'localStorage',
  },
  {
    name: 'bloom_tasks, bloom_projects, bloom_contacts, …',
    category: 'functional',
    provider: 'Bloom',
    purpose: 'Cache local de vos données (tâches, projets, contacts, etc.) pour un affichage instantané. Synchronisé avec votre compte cloud.',
    duration: 'Persistant',
    type: 'localStorage',
  },
  {
    name: 'bloom_cookie_consent',
    category: 'essential',
    provider: 'Bloom',
    purpose: 'Mémorise vos choix de consentement aux cookies pour ne pas réafficher la bannière.',
    duration: 'Persistant',
    type: 'localStorage',
  },
  {
    name: 'bloom_cloud_migration_done',
    category: 'essential',
    provider: 'Bloom',
    purpose: 'Marqueur indiquant que la migration initiale de vos données vers le cloud a été effectuée.',
    duration: 'Persistant',
    type: 'localStorage',
  },
  // ── Analytics : aucun pour le moment ──
  // ── Marketing : aucun pour le moment ──
]
