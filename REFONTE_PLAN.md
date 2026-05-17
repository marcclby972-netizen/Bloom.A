# Refonte fonctionnelle Bloom v3 — Plan

> Document de référence pour la refonte. Aucun design ici, focus **logique métier
> et architecture**. UI minimaliste (div / form / input / button) pour tester.

---

## 1. Vision produit (rappel)

Bloom = **OS pour associés, cofondateurs et freelances**.
- Cœur : gouvernance + contributions + décisions + temps + finances.
- Mode solo = bonus, pas le centre.

---

## 2. État actuel (analyse rapide)

### Ce qui est aligné (à garder + adapter)
| Existant | Sort |
|---|---|
| `auth/login`, `auth/callback` | **Garder** (Supabase Auth OK) |
| `app/dashboard/` | Garder structure, refondre data |
| `app/projects/` | Garder, refondre data |
| `app/todos/` → renommer `app/tasks/` | Migrer vers nouvelle structure |
| `app/chrono/` | Garder, refondre data |
| `app/onboard/` | Garder, simplifier (solo / team) |
| `app/settings/` | Garder, simplifier |
| `app/calendrier/` | Garder optionnellement (agenda) |
| `lib/supabase/{client,server,middleware}.ts` | Garder |
| `lib/use-timer.ts` | Migrer vers `hooks/use-timer.ts` v3 |
| `supabase/migrations/20260517_organizations.sql` | Sert de base pour `teams`, `decisions`, `votes` (rename + refactor) |

### Ce qui dégage (archivage, pas suppression DB pour préserver data)
| Existant | Raison |
|---|---|
| `app/contacts/`, `app/contact/[id]/` | CRM hors scope |
| `app/pipeline/` | CRM hors scope |
| `app/marketing/` | Marketing posts hors scope |
| `app/vault/` | Coffre-fort mots de passe hors scope |
| `app/vocal/` | Notes audio hors scope |
| `app/stats/` | À reconcevoir plus tard, sort pour l'instant |
| `app/studio/` (déjà supprimé) | OK |
| `app/integrations-guide/` | Admin-only, garder pour plus tard, peut être archivé |
| `app/cookies/`, `app/privacy/`, `app/terms/` | Legal, **garder** |
| `app/pricing/` | Marketing, **garder** |
| Composants : `components/crm/`, `components/marketing/`, `components/vocal/`, `components/vault/`, `components/pipeline/` | Move to `_archived/` |
| Tables DB : `contacts`, `interactions`, `posts`, `vocal_projects`, `vocal_notes`, `prompt_notes`, `linkedin_posts` (déjà drop) | **Garder en DB**, ne plus toucher depuis l'app |

### À créer (nouveau modèle métier)
- Tables : `teams`, `memberships`, `governance_rules`, `notifications` (déjà existe), `decisions` + `decision_votes` (refacto depuis org migration)
- Services : `lib/services/{users,teams,projects,tasks,time,governance,notifications}.ts`
- Hooks : `hooks/{useCurrentUser,useCurrentTeam,useProjects,useTasks,useTimer,useDecisions,useNotifications}.ts`
- Pages : `app/decisions/`, `app/tasks/`, refonte `app/dashboard/`, `app/projects/`, `app/chrono/`

---

## 3. Architecture cible

```
app/
  layout.tsx                       (minimal — header + nav)
  page.tsx                         (landing — keep)
  auth/
    login/page.tsx
    signup/page.tsx                (à créer)
    callback/route.ts              (existe)
  onboard/page.tsx                 (simplifié : solo / team)
  dashboard/page.tsx               (refonte minimale)
  projects/
    page.tsx                       (liste)
    [id]/page.tsx                  (détail)
  tasks/page.tsx                   (nouveau, remplace /todos)
  chrono/page.tsx                  (refonte)
  decisions/
    page.tsx                       (liste)
    [id]/page.tsx                  (détail + votes)
  settings/page.tsx                (simplifié)
  _archived/                       (anciennes pages, hors routing actif)
    contacts/, pipeline/, marketing/, vault/, vocal/, stats/, …

lib/
  supabase/
    client.ts                      (existe)
    server.ts                      (existe)
    middleware.ts                  (existe)
    types.gen.ts                   (généré, à régénérer après migration)
  v3-types/                        (NOUVEAU — namespace v3 séparé du legacy `types.ts`)
    index.ts                       (types canoniques métier)
    db.ts                          (types DB bruts snake_case)
  services/
    users.ts                       (NOUVEAU)
    teams.ts                       (NOUVEAU)
    projects.ts                    (NOUVEAU — refacto depuis lib/projects.ts mobile)
    tasks.ts                       (NOUVEAU)
    time.ts                        (NOUVEAU — refacto depuis use-timer)
    governance.ts                  (NOUVEAU)
    notifications.ts               (NOUVEAU)
  rules/
    decision-status.ts             (logique computeDecisionStatus)
    timer-constraint.ts            (1 timer actif max par user)
  date-utils.ts                    (existe, garder)
  admin.ts                         (garder)
  cookies.ts                       (garder)
  utils.ts                         (garder — cn helper)

hooks/                              (NOUVEAU dossier — séparé de lib/)
  use-current-user.ts
  use-current-team.ts
  use-projects.ts
  use-tasks.ts
  use-timer.ts
  use-decisions.ts
  use-notifications.ts

components/
  ui/                              (shadcn — garder)
  layout/                          (à simplifier, supprimer TopPillNav)
    AppShell.tsx
    SideNav.tsx                    (NOUVEAU — minimal)
  cookies/                         (garder)
  _archived/                       (anciens composants)

supabase/
  migrations/
    20260514_cloud_sync.sql        (legacy — garde les anciennes tables vivantes)
    20260515_*.sql                 (legacy)
    20260517_organizations.sql     (legacy — sera complété)
    20260518_bloom_v3_core.sql     (NOUVEAU — teams, memberships, gov rules,
                                    refacto decisions/votes/notifications,
                                    nouveau projects/tasks/time_entries v3)
```

---

## 4. Modèle métier (entités)

Cf. brief du user §1, repris ici comme reference :

### Tables v3 à créer / refondre

| Table | Statut | Notes |
|---|---|---|
| `users` | Existe (Supabase auth.users + user_settings) | Wrapper en service |
| `teams` | **Renommé depuis `organizations`** | Refacto noms colonnes |
| `memberships` | **Renommé depuis `organization_members`** | Ajout `shares` numeric(5,2) nullable, `permissions` jsonb |
| `projects` | **v3** | Ajout `team_id` (nullable solo) + clean colonnes legacy (collaborators, linked_*, etc.) |
| `tasks` | **v3** | Ajout `assignee_user_id` nullable, `priority` enum, garde `project_id`, retire `linked_todo_id` |
| `time_entries` | **v3** | Refacto : `started_at`, `ended_at` nullable (= en cours), `duration_seconds` computed, contrainte unique partielle `(user_id) where ended_at is null` |
| `decisions` | Existe (mobile migration) | OK — déjà bien structuré |
| `decision_votes` | Existe | Renommer `votes` (alias view) ou garder le nom |
| `governance_rules` | **Refonte depuis `organization_rules`** | Schema riche : `type`, `threshold_amount`, `validation_mode`, `active` |
| `notifications` | Existe (legacy) | OK, garde + adapte |
| `journal_entries` | Existe (mobile migration) | Garder, immuable |

### Règles métier
- 1 seul `time_entry` actif par user (constraint unique partielle).
- Decision status calculé via `computeDecisionStatus()` côté service :
  - si rule = `single_owner` → 1 vote founder suffit
  - si rule = `majority_vote` → >50% des memberships actifs
  - si rule = `unanimous` → 100% des memberships actifs
  - si deadline dépassée → `expired`
- Permissions par feature dans `memberships.permissions` (jsonb, ex: `{ "finance": "read", "decisions": "write" }`).

---

## 5. Méthode (ordre d'exécution)

| Bloc | Contenu | Estimation |
|---|---|---|
| **1. DB + Types** | Migration SQL v3 + types TS + audit Supabase client | ✅ ce session |
| **2. Services** | `lib/services/*.ts` (7 fichiers) | session suivante |
| **3. Hooks** | `hooks/*.ts` (7 fichiers) | session suivante |
| **4. Pages minimales** | Refonte routing + UI test | 1-2 sessions |
| **5. Archivage** | Move anciens dossiers vers `_archived/`, retirer du routing | inclus dans bloc 4 |
| **6. Tests** | Vitest + Playwright setup + premiers tests | dernière session |

Chaque bloc = 1 commit indépendant pour pouvoir revert si besoin.

---

## 6. Risques & garde-fous

- **Pas de drop table** sur les legacy (`contacts`, `posts`, etc.) → on garde la data, on coupe juste l'accès UI.
- **Pas de breaking change auth** : Supabase Auth tel quel, on continue d'utiliser `useAuth()` existant.
- **L'app continue de tourner** pendant la transition : pages archivées restent accessibles si on n'a pas encore migré (juste hors menu).
- **Migration DB additive** : on ne touche pas aux colonnes existantes, on ajoute. Rename via vues si besoin.
- **Le code archivé garde un README** dans `_archived/` qui dit pourquoi et quand le ressortir.

---

## 7. Convention de code

- Service : fonction async, prend les params explicites (`userId`, `teamId`), retourne data typée, throw `Error` brut.
- Hook : retourne `{ data, loading, error, refetch }` (ou variantes pour timer).
- Types : tout dans `lib/types/index.ts`. Re-exporter depuis `lib/types/db.ts` les types générés.
- Pas de service appelé depuis Server Component qui passe par fetch — appel direct via `supabase.from(...)` côté server.

---

*Plan validé → exécution Bloc 1 ci-dessous.*
