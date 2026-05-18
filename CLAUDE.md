@AGENTS.md
@brandguidline.md

# Bloom — Working with this repo

## Quick orientation
- **App** : Next.js 16 App Router + TypeScript + Supabase + Tailwind v4
- **Vision** : OS pour cofondateurs (gouvernance, contributions, décisions, temps)
- **Architecture** : feature-sliced (`lib/services/` server-only, `lib/actions/` server actions, `hooks/` clients, `lib/rules/` pure fns testées)
- **Détail produit + plan refonte** : `REFONTE_PLAN.md`
- **Design system + tokens + structure des pages** : `brandguidline.md`

## ⚠️ UI workflow — IMPORTANT
Le design est dans `reference bloom/` (HTML faits avec Claude Design). Pour
toute tâche UI :

1. **Toujours commencer par ouvrir le HTML reference correspondant** :
   - Landing → `reference bloom/bloom-landing.html`
   - Onboarding → `reference bloom/onboarding.html`
   - Dashboard → `reference bloom/dashboard.html`
   - Settings → `reference bloom/settings.html`
2. Lire la section `<style>` pour les variables CSS exactes
3. Lire `brandguidline.md` pour les tokens et patterns canoniques
4. Réécrire en JSX + Tailwind v4 en consommant les tokens via CSS vars
5. NE PAS inventer de couleurs / radius / shadows — tout vient du HTML reference

## Couches v3 (du bas vers le haut)
| Couche | Path | Rôle |
|---|---|---|
| DB | `supabase/migrations/20260518_bloom_v3_core.sql` | Schema + RLS + index |
| Types | `lib/v3-types/{index,db}.ts` | camelCase domain + snake_case DB |
| Services | `lib/services/*.ts` | Server-only, throws ServiceFailure |
| Pure rules | `lib/rules/{decision-status,timer-constraint}.ts` | Testables sans Supabase |
| Server actions | `lib/actions/*.ts` | `'use server'` + `Result<T>` |
| Hooks | `hooks/use-*.ts` | Client, optimistic updates |
| Pages | `app/*/page.tsx` | Consomment les hooks |

## Tests
- `npm test` — 23 unit tests sur les pure rules
- `npm run e2e` — Playwright (timer + decision flows)
- Voir `tests/README.md` pour le setup E2E

## Conventions
- Imports v3 : `@/lib/v3-types`, `@/lib/services`, `@/lib/actions`, `@/hooks`
- Legacy types (lib/types.ts) : seulement pour code archivé `_archived/`
- Erreurs métier : `throw new ServiceFailure({ code, message, details? })`
- Pages auth : `requireUser()` server, `useCurrentUser()` client

## Pivot stratégique en cours
- Mobile (Expo) abandonné — code archivé dans `_archived/`
- Focus : web app + landing uniquement
- Cibles : freelances solo + équipes de 2-5 cofondateurs
