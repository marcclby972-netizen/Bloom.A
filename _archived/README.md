# Code archivé (Bloom v2)

Code fonctionnel mais **hors scope du modèle v3** (OS pour cofondateurs).
Conservé ici pour pouvoir le ressortir si besoin, mais **pas exécuté**
par l'app.

> ⚠️ Ne pas importer ce code depuis `app/` ou `lib/`. Les chemins d'alias
> `@/` ne pointent PAS vers `_archived/`.

## Plan d'archivage (par bloc, exécuté dans le commit "feat(v3) archive sweep")

### À déplacer ici (depuis `app/`)
| Chemin actuel | Raison |
|---|---|
| `app/contacts/` | CRM hors scope |
| `app/contact/[id]/` | CRM hors scope |
| `app/pipeline/` | CRM hors scope |
| `app/marketing/` | Posts marketing hors scope |
| `app/vault/` | Coffre-fort mots de passe hors scope |
| `app/vocal/` | Notes vocales hors scope |
| `app/stats/` | Refonte plus tard, hors scope v3 |

### À déplacer ici (depuis `components/`)
| Chemin actuel | Raison |
|---|---|
| `components/crm/` | CRM hors scope |
| `components/marketing/` | Marketing hors scope |
| `components/vocal/` | Vocal hors scope |
| `components/vault/` | Vault hors scope |
| `components/pipeline/` | CRM hors scope |
| `components/timer/TimerWidget.tsx` | Sera remplacé par `hooks/use-timer.ts` v3 + UI minimal |

### À retirer du menu / nav (sans déplacer le fichier pour l'instant)
| Action | Détails |
|---|---|
| Sidebar / TopPillNav | Retirer entrées CRM, Marketing, Vault, Vocal, Stats |
| `app/api/stripe/` | Pas utilisé par v3 immédiat — garde le code mais retire les routes du nav |
| `app/api/linkedin/`, `app/api/youtube/`, `app/api/google-calendar/` | OAuth tiers — garder uniquement Google Calendar (agenda partagé v3 plus tard) |
| `app/integrations-guide/` | Admin-only, garde le code mais retire du menu |

### Tables DB qui ne servent plus (mais qu'on ne drop pas)
- `contacts`, `interactions` (CRM)
- `posts` (marketing)
- `vocal_projects`, `vocal_notes` (vocal)
- `prompt_notes` (vault legacy)
- `linkedin_posts` (déjà drop dans 20260515)
- `oauth_tokens` legacy linkedin/youtube → garder pour Google Calendar

Ces tables restent en RLS, mais aucun code v3 ne les lit.

---

## Quand peut-on supprimer pour de bon ?

Quand l'app v3 tourne en prod depuis 2 mois sans demande de retour
sur ces features, on supprime physiquement :
1. Les dossiers `_archived/`
2. Les tables DB legacy (migration `2026xxxx_drop_legacy_v2.sql`)
3. Les routes API tierces non utilisées
