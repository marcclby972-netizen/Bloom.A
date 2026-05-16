# Bloom Mobile (iOS + Android)

App native React Native + Expo, partage le **même Supabase** que le web.
Dark mode par défaut. SF Pro sur iOS, système sur Android.

---

## Installation

```bash
cd mobile
npm install
cp .env.example .env
# remplir EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY
# (mêmes valeurs que web/.env.local)
```

## Run en dev

```bash
# iOS simulator
npm run ios

# Android emulator
npm run android

# Expo Go (test sur ton iPhone via le QR code)
npm start
```

Note iOS : le simulateur Apple Sign In ne fonctionne pas — utilise un vrai
iPhone via Expo Go ou un build TestFlight.

## Build prod (EAS)

```bash
npx eas-cli login
npx eas-cli build:configure
npm run build:ios      # ou build:android
```

---

## Stack

| Layer | Choix | Pourquoi |
|---|---|---|
| Framework | **Expo SDK 52** + React Native 0.76 | Nouvelle archi, Hermes, Live Activities ready |
| Routing | **Expo Router** (file-based) | Familier (style Next.js), typed routes |
| Style | **NativeWind v4** (Tailwind) | Même DSL que le web, theme partagé |
| Backend | **Supabase JS** + AsyncStorage | Auth + DB + Realtime, sessions persistées |
| Auth | Apple Sign In + email/password | Apple = priorité iOS, email = fallback |
| Haptics | expo-haptics | UX brief : haptic sur toute action importante |
| Animations | react-native-reanimated 3 | Perf 60fps, transitions natives |
| SVG | react-native-svg | Pour les icônes + chrono ring |

---

## Structure

```
mobile/
├── app/                       file-based routing (Expo Router)
│   ├── _layout.tsx            root + AuthProvider + AuthGate
│   ├── (public)/              non-authentifié
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx        3 slides pitch
│   │   ├── auth.tsx           Apple Sign In + email
│   │   └── setup.tsx          Solo vs Associés + invites
│   └── (tabs)/                authentifié, tab bar bottom
│       ├── _layout.tsx        5 tabs, Chrono center bigger
│       ├── index.tsx          Dashboard (perso + org switcher)
│       ├── projects.tsx       Liste projets
│       ├── chrono.tsx         Timer plein écran
│       ├── todos.tsx          To-do tabbed (Aujourd'hui/Planifié/Terminé)
│       └── profile.tsx        Profil + settings + logout
├── lib/
│   ├── supabase.ts            Client Supabase + AsyncStorage
│   ├── auth.tsx               AuthProvider + useAuth()
│   └── haptics.ts             Helpers expo-haptics
├── components/                (à venir : composants partagés)
├── assets/                    (à ajouter : icon.png, splash.png)
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── app.json                   Expo config
└── tsconfig.json
```

---

## Compte Supabase

L'app mobile utilise la **même base** que le web (`bloom.mchgroup.fr`).
Connecte-toi avec ton compte web existant — tes données sont déjà là.

### Tables ajoutées pour le mode Organisation

Migration : `../supabase/migrations/20260517_organizations.sql`

| Table | Rôle |
|---|---|
| `organizations` | Une org par co-fondateurs |
| `organization_members` | Membres + rôles (founder/collaborator/accountant) + equity % |
| `organization_invites` | Invitations email en attente |
| `organization_rules` | Règles de gouvernance (seuil de vote, fréquence distribution…) |
| `decisions` | Décisions à voter |
| `decision_votes` | Votes des membres |
| `journal_entries` | Journal **immuable** (RLS interdit UPDATE/DELETE) |

Lance la migration depuis le SQL Editor Supabase ou la CLI :
```bash
supabase db push
```

---

## Roadmap (état actuel)

### ✅ Phase 1 — Auth & Onboarding
- 3 slides pitch swipables avec dots animées
- Sign in with Apple (iOS natif)
- Email + password en fallback
- Question "Seul ou avec associés ?" + création org + invites

### ✅ Phase 2 — Navigation
- Tab bar 5 onglets, Chrono au centre en gros bouton brand
- Context switcher Personnel / Organisation en haut

### 🟡 Phase 3 — Projets (stub)
- Liste rendue avec données mockées
- TODO : wire à Supabase `projects`, drill-down avec onglets Tâches/Temps/Membres
- TODO : swipe right (terminer) + swipe left (supprimer) via gesture-handler

### ✅ Phase 4 — Chrono (basique)
- Cercle SVG animé + Start/Pause/Stop
- Persistance via `AppState` (recalcule elapsed au foreground)
- TODO : **Live Activity** + **Widget iOS** (nécessite Xcode + module natif)
- TODO : notification "pause après 2h" via expo-notifications
- TODO : sauvegarder time_entry dans Supabase au Stop

### 🟡 Phase 5 — To-do (stub)
- Onglets Aujourd'hui/Planifié/Terminé
- Toggle avec haptic success
- TODO : wire Supabase + swipe gestures

### ⏳ Phase 6 — Co-fondateurs & règles
- Tables prêtes en DB
- TODO : écran Membres dans Profil, gestion rôles + equity
- TODO : éditeur de règles (seuil vote, fréquence distribution)

### ⏳ Phase 7 — Décisions & votes
- Tables prêtes en DB
- TODO : liste décisions, modal de création, votes
- TODO : push notif via expo-notifications + Supabase webhook

### ⏳ Phase 8 — Journal
- Table prête (immutable via RLS)
- TODO : écran liste chronologique avec filtres

### ⏳ Phase 9 — Agent IA (3 use cases)
- TODO : API route web (`app/api/iris/*`) qui appelle Claude
- TODO : 3 endpoints :
  - `summary` (résumé hebdo)
  - `pact-wizard` (pacte d'associés)
  - `alerts` (scan 24h)

### ⏳ Phase 10 — Profil & abonnement
- Profile screen présent
- TODO : Stripe Customer Portal via deep link
- TODO : édition avatar, notifications par type, theme picker

---

## Live Activity + Widget iOS

Le brief demande Live Activity et widget home screen pour le chrono.
Ces features nécessitent un **module natif Swift** :

1. `npx create-expo-module live-activity` ou utiliser `expo-live-activity` (community)
2. Configurer ActivityKit dans `ios/`
3. Pour le widget : extension target dans Xcode + WidgetKit
4. Ces étapes ne marchent **pas** dans Expo Go — il faut un build natif via EAS

Voir : https://docs.expo.dev/modules/get-started/

---

## Sign in with Apple — setup

1. Apple Developer Account requis
2. Dans Xcode (après `npx expo prebuild`) : activer la capability "Sign in with Apple"
3. Dans Supabase Dashboard : Auth → Providers → Apple → coller le Service ID + clé
4. Bundle ID Expo (`fr.mchgroup.bloom`) doit matcher Apple Developer

---

## Stripe

Le brief mentionne 3 plans : Solo (gratuit), Team 29 €, Business 79 €.
L'écran Profil affiche le plan actuel mais ne déclenche pas encore Stripe Checkout.

À faire :
1. Créer les produits + prices dans Stripe Dashboard
2. API route web `/api/stripe/checkout` qui crée la session
3. Deep link de retour : `bloom://stripe/success` et `/cancel`
4. Webhook Stripe → Supabase pour synchroniser le statut subscription

---

## Commands cheatsheet

```bash
npm start                    # Metro + dev server
npm run ios                  # iOS simulator
npm run android              # Android emulator
npx expo prebuild            # Generate ios/ + android/ folders for native modules
npx eas-cli build --platform ios   # TestFlight build
npx eas-cli submit --platform ios  # App Store submission
```
