@AGENTS.md
@guideline.md

***

```markdown
# Glowup (anciennement Bloom)

Application SaaS de pilotage pour associés, cofondateurs et freelances. Gestion de gouvernance, contributions, temps, finances et collaborations transparentes.

---

## Stack technique (détectée depuis le codebase)

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + CSS modules (mix des deux)
- **UI Components**: Composants customs + possiblement Shadcn/ui
- **State Management**: Context API (context.tsx détecté dans lib)
- **Animations**: À définir (Framer Motion recommandé)
- **Forms**: À définir (React Hook Form + Zod recommandé)
- **Time tracking**: Custom hooks (use-timer.ts)
- **Notifications**: Custom system (notifications.ts)
- **Social OAuth**: LinkedIn, Google (social-oauth.ts)
- **Deployment**: Vercel (détecté via next-env.d.ts)

---

## Architecture du projet

### Structure racine
```
/glowup
├── .claude/              # Config Claude (AGENTS.md déjà présent)
├── .next/                # Build Next.js
├── app/                  # App Router Next.js
│   ├── api/              # API routes
│   ├── auth/             # Routes authentification
│   ├── calendrier/       # Module calendrier
│   ├── chrono/           # Module time tracking
│   ├── contact/          # Module contacts
│   ├── contacts/         # Module contacts (variante)
│   ├── cookies/          # Gestion cookies
│   ├── dashboard/        # Dashboard principal
│   ├── integrations-gui/ # Interface intégrations
│   ├── login/            # Page login
│   ├── marketing/        # Module marketing
│   ├── onboard/          # Onboarding
│   ├── pipeline/         # Pipeline (CRM)
│   ├── pricing/          # Pricing
│   ├── privacy/          # Privacy policy
│   ├── projects/         # Module projets
│   ├── settings/         # Paramètres
│   ├── stats/            # Statistiques
│   ├── terms/            # Terms of service
│   ├── todos/            # Todos/Tasks
│   ├── vault/            # Coffre-fort docs
│   ├── vocal/            # Module vocal
│   └── error.tsx, favicon.ico, globals.css, layout.tsx, not-found.tsx, page.tsx
│
├── components/           # Composants React
│   ├── ai/               # Composants IA
│   ├── calendar/         # Composants calendrier
│   ├── cookies/          # Composants cookies
│   ├── crm/              # Composants CRM
│   ├── dashboard/        # Composants dashboard
│   ├── layout/           # Composants layout (sidebar, topbar, etc.)
│   ├── marketing/        # Composants marketing
│   ├── notifications/    # Composants notifications
│   ├── pipeline/         # Composants pipeline
│   ├── shared/           # Composants partagés
│   ├── tasks/            # Composants tasks
│   ├── timer/            # Composants timer/chrono
│   ├── ui/               # Composants UI réutilisables
│   └── vocal/            # Composants vocal
│
├── lib/                  # Librairies et utilitaires
│   ├── supabase/         # Client Supabase
│   │   ├── admin.ts
│   │   ├── cloud-sync.ts
│   │   └── (autres helpers)
│   ├── context.tsx       # Context React global
│   ├── cookies.ts        # Gestion cookies
│   ├── date-utils.ts     # Utilitaires dates
│   ├── notifications.ts  # Système notifications
│   ├── social-oauth.ts   # OAuth social (LinkedIn, Google)
│   ├── speech.d.ts       # Types Speech API
│   ├── store.ts          # Store (probablement Zustand ou custom)
│   ├── types.ts          # Types globaux
│   ├── use-speech.ts     # Hook vocal
│   ├── use-timer.ts      # Hook timer/chrono
│   ├── utils.ts          # Utilitaires généraux
│   └── vault.ts          # Logique vault
│
├── mobile/               # Code mobile (possiblement React Native ou PWA)
├── node_modules/         # Dépendances
├── public/               # Assets statiques
│   └── assets/
│       ├── bloom-logo-blanc.png
│       ├── bloom-logo-noir.png
│       ├── bloom-logo.png
│       ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│
├── supabase/             # Config Supabase locale
├── test/                 # Tests
├── .env.example          # Exemple variables d'env
├── .env.local            # Variables d'env locales (à ne pas commit)
├── .eslintrc.json        # Config ESLint
├── .gitignore            # Gitignore
├── AGENTS.md             # Instructions agents IA (déjà présent)
├── CLAUDE.md             # Ce fichier (instructions Claude)
├── components.json       # Config composants (Shadcn/ui ?)
├── eslint.config.mjs     # Config ESLint moderne
├── globals.css           # Styles globaux
├── guideline.md          # Guidelines projet (déjà présent)
├── next-env.d.ts         # Types Next.js auto-générés
├── next.config.ts        # Config Next.js
├── package-lock.json     # Lock dépendances
├── package.json          # Dépendances et scripts
├── postcss.config.mjs    # Config PostCSS
├── proxy.ts              # Proxy (API externe ?)
├── README.md             # Documentation projet
└── tsconfig.json         # Config TypeScript
```

---

## Conventions de code

### Naming (détecté depuis le codebase)

- **Composants React**: PascalCase (ex: `DashboardWidget.tsx`)
- **Fichiers utils**: kebab-case (ex: `date-utils.ts`, `use-timer.ts`)
- **Hooks customs**: kebab-case avec préfixe `use-` (ex: `use-speech.ts`, `use-timer.ts`)
- **Types**: PascalCase dans `types.ts` (ex: `UserType`, `ProjectType`)
- **Routes (app dir)**: kebab-case (ex: `/dashboard`, `/integrations-gui`)

### Structure des composants

- Un composant par fichier
- Ordre: imports → types → composant → exports
- Props typées avec TypeScript
- Composants dans `/components` organisés par feature (dashboard, timer, crm, etc.)

### Style

- **Mix Tailwind CSS + CSS modules** (les deux coexistent dans le projet)
- Privilégier Tailwind pour la majorité des styles
- CSS modules pour les styles complexes ou réutilisables
- Pas de CSS inline
- Mobile-first responsive

### Git

- Commits en anglais
- Format conventionnel: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Branches: `feature/nom`, `fix/nom`, `refactor/nom`

---

## Design system

### Palette (basée sur les logos détectés)

- **Background**: `#111111` (sombre)
- **Surface**: `#ECECEC` (clair)
- **Logo colors**: Orange/jaune (détecté dans bloom-logo)
- **Text light**: `#ECECEC`
- **Text dark**: `#111111`
- **Accent**: À définir (gradient orange recommandé pour cohérence branding)

### Typographie

- À définir (recommandation: Inter pour body, Bricolage Grotesque pour display)
- Charger via Google Fonts avec preconnect

### Spacing

- Scale Tailwind par défaut: `4px`, `8px`, `16px`, `24px`, `32px`, `48px`, `64px`

### Radius

- Cards: `16-24px`
- Buttons: `12px`
- Inputs: `8px`

---

## Modules fonctionnels (détectés depuis /app et /components)

### Core

- **Auth** (`/app/auth`, `/app/login`, `lib/social-oauth.ts`) : Authentification Supabase + OAuth social (LinkedIn, Google)
- **Dashboard** (`/app/dashboard`, `/components/dashboard`) : Hub central personnalisé
- **Onboarding** (`/app/onboard`) : Parcours d'onboarding

### Productivité

- **Chrono/Timer** (`/app/chrono`, `/components/timer`, `lib/use-timer.ts`) : Time tracking avec hooks customs
- **Todos/Tasks** (`/app/todos`, `/components/tasks`) : Gestion de tâches
- **Projects** (`/app/projects`) : Gestion de projets
- **Calendrier** (`/app/calendrier`, `/components/calendar`) : Agenda et événements

### CRM & Pipeline

- **CRM** (`/components/crm`) : Gestion de contacts/clients
- **Pipeline** (`/app/pipeline`, `/components/pipeline`) : Pipeline de ventes/projets
- **Contacts** (`/app/contact`, `/app/contacts`) : Module contacts

### Collaboration

- **Notifications** (`/components/notifications`, `lib/notifications.ts`) : Système de notifications
- **Vocal** (`/app/vocal`, `/components/vocal`, `lib/use-speech.ts`) : Interface vocale (Speech API)

### Marketing & Content

- **Marketing** (`/app/marketing`, `/components/marketing`) : Module marketing/posts
- **AI** (`/components/ai`) : Features IA (génération content, assistant)

### Stockage & Données

- **Vault** (`/app/vault`, `lib/vault.ts`) : Coffre-fort documents sécurisé
- **Stats** (`/app/stats`) : Statistiques et analytics

### Settings & Legal

- **Settings** (`/app/settings`) : Paramètres user/équipe
- **Pricing** (`/app/pricing`) : Pages pricing
- **Privacy** (`/app/privacy`) : Privacy policy
- **Terms** (`/app/terms`) : Terms of service
- **Cookies** (`/app/cookies`, `/components/cookies`, `lib/cookies.ts`) : Gestion cookies GDPR

### Intégrations

- **Integrations GUI** (`/app/integrations-gui`) : Interface de gestion des intégrations

---

## Règles métier importantes

### Modes d'utilisation

- **Solo** : Freelances, consultants → features simplifiées
- **Équipe** : Cofondateurs, associés → features complètes (gouvernance, votes, contributions)

### Time tracking (Chrono)

- Hook custom `use-timer.ts` pour gérer l'état du timer
- Un seul chrono actif à la fois par user
- Lié obligatoirement à un projet ou une tâche
- Enregistrement auto régulier (définir fréquence)
- Validation : pas de chrono > 24h

### Notifications

- Système custom dans `lib/notifications.ts`
- Types à définir : décisions, mentions, rappels, alertes IA

### Vault (Coffre-fort)

- Stockage sécurisé de documents sensibles
- Permissions par user/équipe
- Chiffrement recommandé

### Vocal

- Speech API intégrée (`lib/use-speech.ts`, `lib/speech.d.ts`)
- Permet dictée, commandes vocales
- Accessibilité ++

---

## Guidelines de développement

### Performance

- Lazy loading pour composants lourds (dashboard, stats)
- Suspense boundaries partout
- Images optimisées avec `next/image`
- Preload les fonts
- Code splitting par route (Next.js le fait auto)

### Sécurité

- **Validation inputs** : Utiliser Zod partout (à mettre en place si pas encore fait)
- **Row Level Security (RLS)** : Activé sur Supabase (vérifier dans `/supabase`)
- **Sanitize** : Toutes les données user avant stockage/affichage
- **CSRF protection** : Sur toutes les API routes
- **OAuth sécurisé** : `social-oauth.ts` déjà en place

### Accessibilité

- Semantic HTML
- Labels sur tous les inputs
- Focus states visibles (keyboard navigation)
- Contrast ratio WCAG AA minimum
- Module vocal améliore l'accessibilité

### Testing

- Tests unitaires : Vitest ou Jest
- Tests E2E : Playwright
- Coverage minimum : 70%
- Tests à ajouter dans `/test`

### État global

- **Context API** : `lib/context.tsx` pour état UI léger
- **Store** : `lib/store.ts` (vérifier si Zustand ou custom)
- Préférer Server Components Next.js quand possible
- Client Components uniquement pour interactivité

### Supabase

- **Client Server** : Pour Server Components
- **Client Browser** : Pour Client Components
- Typer toutes les queries avec types générés
- RLS activée sur toutes les tables sensibles

---

## Commandes et scripts

### Dev

```bash
npm run dev          # Démarrer le serveur de dev (port 3000 par défaut)
npm run build        # Build de production
npm run start        # Démarrer le build
npm run lint         # Linter ESLint
npm run type-check   # Vérifier les types TypeScript (si script existe)
```

### Database (Supabase)

```bash
# À ajouter si pas encore fait
npm run db:push      # Pousser le schema vers Supabase
npm run db:pull      # Récupérer le schema depuis Supabase
npm run db:seed      # Seeder la DB
npm run db:types     # Générer les types TypeScript depuis le schema
```

### Tests

```bash
# À configurer
npm run test         # Tests unitaires
npm run test:e2e     # Tests E2E
npm run test:watch   # Tests en mode watch
npm run test:coverage # Coverage report
```

---

## Points d'attention spécifiques

### Supabase

- Utiliser `lib/supabase/admin.ts` pour les opérations admin (côté serveur uniquement)
- Utiliser `lib/supabase/cloud-sync.ts` pour la synchro (si offline-first)
- **IMPORTANT** : Ne jamais exposer les clés admin côté client

### Modules customs

- **Timer** : `use-timer.ts` hook pour chrono → à réutiliser partout, pas de réimplémentation
- **Speech** : `use-speech.ts` hook pour vocal → intégrer dans les inputs si pertinent
- **Notifications** : `lib/notifications.ts` → système centralisé, ne pas créer de système parallèle
- **Vault** : `lib/vault.ts` → logique sécurité critique, bien tester

### Formulaires

- **Validation** : Utiliser Zod pour tous les forms
- **Gestion état** : React Hook Form recommandé
- Validation inline
- Messages d'erreur clairs **en français**

### API Routes

- Toujours valider les inputs (Zod)
- Gérer les erreurs proprement (try/catch + status codes appropriés)
- Logger les erreurs importantes (Sentry recommandé)
- Rate limiting sur les endpoints sensibles

### CSS

- **Mix Tailwind + CSS modules** : OK mais privilégier Tailwind
- Utiliser CSS modules uniquement pour :
  - Animations complexes
  - Styles très spécifiques impossibles en Tailwind
  - Styles réutilisables dans plusieurs composants
- Pas de CSS inline (sauf cas exceptionnels animés par JS)

---

## Workflow de développement

### Avant de coder

1. Lire les specs dans `/guideline.md` et `AGENTS.md`
2. Vérifier les types existants dans `/lib/types.ts`
3. Regarder les composants similaires dans `/components` pour cohérence
4. Vérifier si un hook custom existe déjà (timer, speech, etc.)

### Pendant le dev

1. Créer une branche depuis `main` : `git checkout -b feature/nom-feature`
2. Coder en suivant les conventions détectées
3. Tester localement : `npm run dev`
4. Commit régulièrement : `git commit -m "feat: add feature X"`

### Avant de push

1. Vérifier les types : `npm run type-check` (ou `npx tsc --noEmit`)
2. Linter : `npm run lint`
3. Build : `npm run build` (vérifier qu'il passe)
4. Tests : `npm run test` (quand configuré)

### Review

- Auto-review avant PR
- Vérifier que tout est typé (pas de `any`)
- Pas de `console.log` oubliés
- Pas de code commenté inutile
- Pas de fichiers `.env` commités

---

## Ressources et documentation

### Documentation interne

- `/guideline.md` - Guidelines projet (déjà présent)
- `/AGENTS.md` - Instructions pour agents IA (déjà présent)
- `/README.md` - Documentation projet

### Documentation externe

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [React](https://react.dev/)

### Design & Figma

- [Lien vers maquettes Figma] (à ajouter si existe)

---

## Notes importantes pour Claude

### Contexte produit en évolution

> **L'UI va changer et sûrement le fonctionnement** (note du dev, mai 2026)

**Implications** :
- Ne pas s'attacher rigidement aux implémentations actuelles
- Privilégier la **modularité** et la **réutilisabilité**
- Composants découplés pour faciliter les refactos
- Bien typer pour faciliter les migrations
- Documenter les choix architecturaux

**Attitude** :
- Rester flexible sur les specs UI/UX
- Proposer plusieurs approches quand pertinent
- Anticiper les changements (composants paramétrables)

### Fichiers de référence principaux

- `AGENTS.md` : Instructions pour agents IA (déjà présent, prioritaire)
- `guideline.md` : Guidelines projet (déjà présent, prioritaire)
- `CLAUDE.md` : Ce fichier (instructions Claude)

**Ordre de priorité en cas de conflit** :
1. `AGENTS.md`
2. `guideline.md`
3. `CLAUDE.md`

### Langue

- **Code** : Anglais (variables, fonctions, commentaires)
- **UI** : Français (labels, messages, erreurs)
- **Docs** : Français (README, guidelines)

---

## Variables d'environnement (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
# OAuth Social
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
# Stripe (si payments)
STRIPE_PUBLIC_KEY=xxx
STRIPE_SECRET_KEY=xxx
# Autres à définir selon besoins
```

---

## TODO / À implémenter

- [ ] Configurer tests (Vitest + Playwright)
- [ ] Ajouter Zod pour validation forms
- [ ] Générer types TypeScript depuis Supabase schema
- [ ] Configurer Sentry pour error tracking
- [ ] Ajouter rate limiting API routes
- [ ] Documenter les hooks customs (`use-timer`, `use-speech`)
- [ ] Optimiser images dans `/public/assets`
- [ ] Configurer PWA (si mobile web souhaité)
- [ ] Ajouter analytics (Plausible ou Posthog recommandé)

---

🚀 **Claude, tu as maintenant tout le contexte du projet Glowup. Code en respectant ces guidelines !**
```

***

