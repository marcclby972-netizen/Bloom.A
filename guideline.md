# Bloom — Design Guideline

> Source of truth pour le design. Tout ce qui touche à l'UI/UX du produit
> (landing + web app) doit s'aligner sur ce document.
>
> Référencé depuis `CLAUDE.md` → lu à chaque session.

---

## 0. Pivot stratégique (mai 2026)

- **Plus de mobile** : on abandonne l'app React Native (`bloom-mobile/`).
  Ce dossier reste en archive sur le disque mais n'est plus maintenu.
- **Web only** : la cible est **une web app + une landing**, hébergées
  ensemble dans ce repo (Next.js).
- **Pourquoi** : focalisation, vitesse d'itération, et le produit cœur
  (gouvernance + cockpit cofondateurs) se prête mieux à un écran large.

---

## 1. Identité produit

**Bloom** est un **OS pour associés et cofondateurs**.

| Axe | Position |
|---|---|
| Cœur | Gouvernance + transparence financière + décisions + contributions |
| Bonus | Mode solo (freelance) — pas le centre, mais accessible |
| Cibles primaires | Studios de 2–5 cofondateurs, petites équipes early-stage |
| Tonalité | Sérieuse mais moderne · cockpit · contrôle clair |
| Anti-cibles | Outils RH d'entreprise, time tracking flicage, template SaaS générique |

### Voix & ton (FR)

- **Direct, calme, sans bullshit.** Phrases courtes, verbes d'action.
- **Tu, pas vous.**
- **Honnête sur l'inconfort.** "Marc a fait 70%, Alex 30%. Pensez à en parler."
- **Interdit** : "leverage", "synergie", "disrupter", "game-changer", "boost",
  emojis comme icônes (jamais), exclamations dans les CTA.
- **Aimé** : équité, transparence, contribution, signal, équilibre, pacte,
  gouvernance, journal, cockpit.

| Mauvais | Bon |
|---|---|
| "Boostez votre productivité dès maintenant" | "Pilote ta boîte sans devenir flou." |
| "Notre IA révolutionnaire analyse vos données" | "L'IA repère ce qu'on n'ose pas dire." |
| "Plus jamais de conflits ✨" | "Des règles, pas des disputes." |

---

## 2. Design Tokens

### 2.1 Couleurs

Toujours utiliser les noms de rôle, jamais les hex bruts dans les composants.

#### Surfaces
| Token | Hex | Usage |
|---|---|---|
| `bg.page` | `#111111` | Fond global landing + app |
| `bg.panel.light` | `#ECECEC` | Header pill, sections features, footer |
| `bg.panel.deep` | `#1A1A1A` | Cards denses (pricing, widgets dashboard), footer panel |
| `bg.surface.subtle` | `#16161B` | Sub-panels internes au dashboard (entre `#111` et `#1A`) |
| `bg.surface.elev` | `#1F1F26` | Hover state sur widgets dashboard |

#### Texte
| Token | Hex | Sur |
|---|---|---|
| `ink.on-dark.primary` | `#ECECEC` | `bg.page`, `bg.panel.deep` |
| `ink.on-dark.muted` | `#C9C9C9` | Idem (secondaire) |
| `ink.on-dark.subtle` | `#8A8A8F` | Idem (tertiaire, captions) |
| `ink.on-light.primary` | `#111111` | `bg.panel.light` |
| `ink.on-light.muted` | `#4B4B4B` | Idem (secondaire) |
| `ink.on-light.subtle` | `#6B6B6B` | Idem (tertiaire) |

#### Accent gradient (signature)
```css
--accent-gradient: linear-gradient(135deg, #E37520 0%, #FBBE4D 100%);
--accent-start:    #E37520; /* gradient start */
--accent-end:      #FBBE4D; /* gradient end */
--accent-solid:    #F1962D; /* fallback solide / focus ring */
--accent-soft:     rgba(227, 117, 32, 0.12); /* glow, halo */
```

**Règles d'usage du gradient** :
- ✅ CTA primaires (boutons "Get started", "Créer une décision")
- ✅ Tags importants ("IA", "Critique", "Vote requis")
- ✅ Barres de progression, focus states de champs
- ✅ Liserés/bordures sur cards mises en avant (`border-image`)
- ❌ Fonds de gros blocs de texte
- ❌ Background de panels entiers
- ❌ Texte longue ligne (lisibilité)

#### Bordures
| Token | Hex | Sur |
|---|---|---|
| `border.on-dark.subtle` | `#26262B` | `bg.page` |
| `border.on-dark.deep` | `#2D2D33` | `bg.panel.deep` |
| `border.on-light.subtle` | `#D4D4D4` | `bg.panel.light` |

#### Sémantique (états)
| Token | Hex | Usage |
|---|---|---|
| `success` | `#22C55E` | Décision approuvée, équilibre OK |
| `warning` | `#F59E0B` | Déséquilibre 10–20%, alerte douce |
| `danger` | `#EF4444` | Vote rejeté, alerte critique, suppression |
| `info` | `#3B82F6` | Notifications neutres |

#### Contrastes (WCAG)
| Combinaison | Ratio | Niveau |
|---|---|---|
| `ink.on-dark.primary` sur `bg.page` | 14.5:1 | AAA |
| `ink.on-dark.muted` sur `bg.page` | 10.1:1 | AAA |
| `ink.on-dark.subtle` sur `bg.page` | 5.4:1 | AA |
| `ink.on-light.primary` sur `bg.panel.light` | 15.3:1 | AAA |
| `accent-solid` sur `bg.page` | 4.6:1 | AA (gros texte) |

---

### 2.2 Typographie

#### Fonts
| Famille | Source | Usage |
|---|---|---|
| **Madimi One** | Google Fonts | Display, logo wordmark, hero headline courte, mots-clés ("OS") |
| **Menbere** | Google Fonts (avec fallback **Inter** si indispo) | Body, UI, navigation, dashboard, cards, formulaires |

> ⚠️ **Vérification Menbere** : si l'import Google Fonts échoue (`Menbere` rare),
> fallback **Inter** (très proche en personnalité, dispo partout).
> Toujours déclarer la stack complète :
> `font-family: "Menbere", "Inter", system-ui, sans-serif;`

#### Échelle
| Token | Taille / Line-h | Weight | Font | Usage |
|---|---|---|---|---|
| `display-xl` | 80 / 88 | 400 | Madimi One | Hero landing only, tracking `-2%` |
| `display-lg` | 64 / 72 | 400 | Madimi One | H1 sections marketing exceptionnelles |
| `display-md` | 48 / 56 | 400 | Madimi One | Pricing prix (`8€`), titre footer brand |
| `h1` | 44 / 52 | 600 | Menbere | H1 page app (rare, dashboard) |
| `h2` | 36 / 44 | 600 | Menbere | Section heading (landing + app) |
| `h3` | 28 / 36 | 600 | Menbere | Sub-section, card title large |
| `h4` | 22 / 30 | 600 | Menbere | Widget title, modal title |
| `h5` | 18 / 26 | 600 | Menbere | List header, table header |
| `body-lg` | 18 / 28 | 400 | Menbere | Subheadline landing, body marketing |
| `body` | 16 / 24 | 400 | Menbere | Body par défaut, paragraphes |
| `body-sm` | 14 / 22 | 400 | Menbere | Body dense, table cells, descriptions cards |
| `caption` | 13 / 20 | 500 | Menbere | Métadonnées, helper text |
| `micro` | 11 / 16 | 600 | Menbere | Overline, labels uppercase, tags (tracking `+8%`) |
| `button` | 15 / 24 | 600 | Menbere | Tous boutons (sauf giant CTA = `button-lg` 17/26) |

#### Règles
- **Line-length** : 60–75 caractères sur desktop, 35–60 sur mobile.
- **Tracking** : `display-*` à `-2%`, `micro` à `+8%`, reste à `0`.
- **Anti-pattern** : Madimi One en body (>20 caractères) → illisible. Réserver à `display-*`.
- **Tabular nums** sur chiffres alignés (prix, KPI, timers, tables).

---

### 2.3 Espacement

Base **4px**, échelle géométrique :

| Token | px | Usage |
|---|---|---|
| `space-1` | 4 | Gaps inline minuscules |
| `space-2` | 8 | Gap entre icône + label |
| `space-3` | 12 | Padding interne pill, gap entre cards proches |
| `space-4` | 16 | Padding card par défaut, gap rows |
| `space-5` | 20 | Padding section card |
| `space-6` | 24 | Gouttière grille, marge entre cards |
| `space-8` | 32 | Padding interne panel |
| `space-10` | 40 | Marge entre sections internes |
| `space-12` | 48 | Padding vertical hero |
| `space-16` | 64 | Marge entre grandes sections landing |
| `space-20` | 80 | Marge latérale desktop |
| `space-24` | 96 | Padding vertical section feature |
| `space-32` | 128 | Padding hero spacieux |

---

### 2.4 Radius

Le langage de Bloom = **rounds généreux** (sauf champs de saisie).

| Token | px | Usage |
|---|---|---|
| `radius-xs` | 8 | Tags, badges micro |
| `radius-sm` | 12 | Inputs, tooltips |
| `radius-md` | 16 | Boutons rectangulaires, small cards |
| `radius-lg` | 20 | Widgets dashboard, sub-panels |
| `radius-xl` | 24 | Cards moyennes (features, pricing) |
| `radius-2xl` | 32 | **Panels features Attio**, **footer panel** |
| `radius-3xl` | 40 | Header pill, hero outer container |
| `radius-pill` | 9999 | Boutons pill, pills tags, header nav |

---

### 2.5 Ombres & glow

```css
/* Card sur fond sombre — séparation douce */
--shadow-soft:
  0 1px 0 rgba(255, 255, 255, 0.04) inset,
  0 4px 12px rgba(0, 0, 0, 0.4);

/* Card élevée (hover, mise en avant) */
--shadow-elev:
  0 1px 0 rgba(255, 255, 255, 0.06) inset,
  0 12px 32px rgba(0, 0, 0, 0.5);

/* Halo accent pour CTA hover ou nœud IA */
--shadow-accent-glow:
  0 0 24px rgba(227, 117, 32, 0.25);

/* Modal scrim */
--shadow-scrim: 0 0 0 9999px rgba(0, 0, 0, 0.55);
```

**Anti-pattern** : pas de `box-shadow` agressif (>0.5 opacité) — rester subtil
en dark mode.

---

### 2.6 États (hover / active / focus / disabled)

Tous les éléments interactifs doivent avoir 4 états visibles :

| État | Modification |
|---|---|
| **Default** | Couleur de base |
| **Hover** | Pour bouton accent : `transform: translateY(-1px)` + `shadow-accent-glow`. Pour bouton ghost : opacity 0.85. Pour card : `shadow-elev` + scale `1.005`. |
| **Active (pressed)** | Scale `0.98`. Durée 100ms. |
| **Focus-visible** | Ring 2px `accent-solid` + offset 2px. Toujours visible au clavier. **JAMAIS** retirer `outline`. |
| **Disabled** | Opacity `0.4`, `cursor: not-allowed`, pas de hover. |

---

## 3. Layout global

### 3.1 Grille

- **Max-width contenu** : `1200px` (landing + app dashboard)
- **Marges latérales desktop** : `80px` (`space-20`)
- **Marges latérales mobile** : `20px`
- **Grille** : 12 colonnes, gouttière `24px` (`space-6`)
- **Breakpoints** :
  - `sm` 640px (mobile large)
  - `md` 768px (tablette)
  - `lg` 1024px (desktop)
  - `xl` 1280px (desktop large)
  - `2xl` 1536px (très large — rare)

### 3.2 Z-index scale

```
0    : contenu normal
10   : sticky header
20   : floating widgets (chrono, FAB)
40   : dropdowns, popovers
60   : header pill (floats over everything)
80   : cookie banner, alerts barres
100  : modal scrim + modal content
150  : toast notifications
1000 : debug overlays
```

---

## 4. Composants canoniques

### 4.1 Boutons

#### CTA Primary (gradient accent)
```
height: 48px (par défaut) | 56px (giant CTA hero)
padding: 0 24px
radius: pill
background: var(--accent-gradient)
color: #111111  ← contraste sur orange clair
font: button (15/24, weight 600)
shadow: none par défaut, shadow-accent-glow on hover
icon: optional, 18px stroke 1.5
```
- Hover : `translateY(-1px)` + glow accent
- Active : `scale(0.98)` 100ms
- Loading : spinner remplace label, conserve dimensions

#### CTA Secondary (ghost light)
```
height: 48px
padding: 0 24px
radius: pill
background: transparent
border: 1px solid rgba(255,255,255,0.18) (sur dark) ou rgba(0,0,0,0.15) (sur light)
color: ink.on-dark.primary
```
- Hover : `background: rgba(255,255,255,0.05)` (dark) ou `rgba(0,0,0,0.04)` (light)

#### Button danger
```
background: var(--danger)
color: white
même structure que primary
```

### 4.2 Pills (tags / badges)

```
height: 28px
padding: 0 12px
radius: pill
font: micro (11/16, weight 600, uppercase, tracking +8%)
```

**Variantes** :
| Variante | Bg | Texte |
|---|---|---|
| `pill-neutral` | `rgba(255,255,255,0.06)` (dark) | `ink.on-dark.muted` |
| `pill-accent` | `var(--accent-gradient)` | `#111` |
| `pill-success` | `rgba(34,197,94,0.15)` | `#86EFAC` |
| `pill-warning` | `rgba(245,158,11,0.15)` | `#FCD34D` |
| `pill-danger` | `rgba(239,68,68,0.15)` | `#FCA5A5` |
| `pill-light` | `rgba(0,0,0,0.06)` (sur light) | `ink.on-light.muted` |

### 4.3 Cards

| Type | Bg | Border | Radius | Shadow |
|---|---|---|---|---|
| Widget dashboard | `bg.panel.deep` | `border.on-dark.deep` 1px | `radius-lg` | `shadow-soft` |
| Card landing | `bg.panel.light` | none | `radius-2xl` | none (pose sur dark) |
| Card mise en avant | `bg.panel.deep` | gradient border 1px | `radius-xl` | `shadow-elev` |

**Pattern card 2-col (sections features)** :
```
[Panel #ECECEC, radius-2xl, padding 64/48]
├── Col texte (5/12 desktop)
│   ├── Overline (micro, accent text)
│   ├── H2 (Menbere SemiBold 36/44)
│   ├── Body-lg paragraphe
│   ├── 3 bullets (icône + label)
│   └── Link CTA → (ghost text + arrow)
└── Col visuel (7/12 desktop)
    └── Mock UI du feature (radius-xl, shadow-soft)
```

### 4.4 Inputs

```
height: 44px
padding: 0 16px
radius: radius-sm (12px)
background: rgba(255,255,255,0.04) (sur dark) ou white (sur light)
border: 1px solid border.on-dark.subtle
font: body (16/24)
```
- Placeholder : `ink.on-dark.subtle`
- Focus : border `accent-solid` 1.5px, ring `accent-soft` 4px offset 0
- Error : border `danger`, helper text en `danger` dessous

### 4.5 Header pill (landing)

```
Position: fixed, top: 24px, centered
Height: 76px
Padding: 0 32px
Radius: radius-3xl (40px)
Background: bg.panel.light (#ECECEC)
Shadow: subtle (0 8px 24px rgba(0,0,0,0.2))
Z-index: 60
Width: auto, max ~960px

Contenu (horizontal):
[Logo Bloom (28px) + wordmark Madimi One 22px]
  -- gap 32px --
[Nav: Produits / Fonctionnalités / Prix / Ressources]
  -- ml-auto --
[Sign in (ghost dark)]  [Get started (gradient pill)]
```

**Mobile (<768px)** :
- Largeur ~ `calc(100% - 32px)`
- Nav remplacée par burger icon (4 lignes 1.5px noires)
- Sign in retiré, seul "Get started" reste

### 4.6 Footer panel

```
Position: dans le flow, marge top 64px
Margin: 0 24px (ne touche pas les bords)
Background: bg.panel.deep (#1A1A1A)
Radius: radius-2xl (32px)
Padding: 80px 64px
Shadow: 0 -8px 40px rgba(0,0,0,0.4)
Liseré haut: 1px linear-gradient(90deg, transparent, accent-soft, transparent)

Contenu (grille 4 col desktop, 1 col mobile):
Col 1 : Logo Bloom (Madimi One 32px) + baseline + signature
Col 2 : Produit  (Features, Dashboard, IA, Mode associés)
Col 3 : Ressources (Docs, Changelog, Roadmap, Blog)
Col 4 : Société (À propos, Contact, Confidentialité, CGU, Cookies)

Bas: ligne fine + ©Bloom 2026 + locale switcher
```

---

## 5. Spécifications écran — Landing

### 5.1 Structure globale

```
1. Header pill (fixed)
2. Hero — fond dark + gradient radial discret + cards flottantes
3. Section "Pourquoi Bloom" (intro courte + 3 KPIs)
4. Feature: Mode associés & règles (panel light Attio 2-col)
5. Feature: Journal immuable (panel light Attio 2-col, reverse)
6. Feature: Agent IA (panel light Attio 2-col)
7. Feature: Planificateur social / Agenda (panel light Attio 2-col, reverse)
8. Pricing (carte unique #1A1A1A centrée)
9. CTA final ("Prêt à fonder ensemble ?")
10. Footer panel
```

### 5.2 Hero

**Layout** : 2/3 texte (gauche), 1/3 espace pour visuel partiellement débordant.

- Zone morte au-dessus du header : `64px`
- Padding vertical hero : `space-32` haut, `space-24` bas
- Fond : `bg.page` + radial gradient discret derrière les cards (300px wide, accent-soft, blur 80px)

**Contenu** :
```
[Overline] : pill-accent "OS POUR ASSOCIÉS"
[H1 Madimi One 80/88] : "Fondez ensemble. Pilotez clairement."
[Body-lg 18/28 ink.on-dark.muted, max 540px] :
  "Le temps, l'argent et les règles sur la même page. Bloom est l'OS des
  cofondateurs qui veulent grandir sans se déchirer."
[Row CTA] :
  [Primary gradient pill "Commencer gratuitement"]
  [Ghost pill "Voir la démo →"]
```

**Visuel** : mock dashboard (Decisions + Equity balance) qui déborde à droite
sur ~120px hors de la grille, avec `shadow-elev`. À demi sorti du conteneur
hero pour effet de **break out**.

### 5.3 Section feature — Pattern Attio 2-col

Voir §4.3 (Cards). 4 features déclinés :

**5.3.1 Mode associés & règles**
- Overline : "GOUVERNANCE"
- H2 : "Des règles écrites, des disputes évitées."
- Body : "Définis tes seuils de vote, ton vesting, ta fréquence de distribution.
  Bloom applique automatiquement les règles à chaque décision."
- 3 bullets : Seuils de vote · Vesting auto · Distribution programmée
- Visuel : éditeur de règles (form avec sliders et toggles, fond dark dans la card light)

**5.3.2 Journal immuable**
- Overline : "TRANSPARENCE"
- H2 : "Un journal que personne ne peut réécrire."
- Body : "Chaque décision, dépense, changement d'équité est inscrit. Lecture seule.
  Pour toujours."
- 3 bullets : Append-only · Signature par membre · Export PDF audit
- Visuel : timeline verticale avec entries (avatar + action + horodatage + hash)

**5.3.3 Agent IA**
- Overline : "AGENT IA"
- H2 : "Iris voit ce que tu n'oses pas dire."
- Body : "Iris analyse les contributions, repère les déséquilibres, et te
  prévient avant que ça devienne un sujet de conflit."
- 3 bullets : Résumé hebdo · Wizard pacte d'associés · Alertes 24h/24
- Visuel : card-in-card avec un message Iris ("⚠️ Marc a fait 70% des heures…")
  + pulsation discrète sur le nœud Iris

**5.3.4 Planificateur social / Agenda**
- Overline : "PILOTAGE"
- H2 : "Toute l'équipe sur la même timeline."
- Body : "Voit qui fait quoi, quand. Programme les posts. Sync Google Calendar
  + Notion."
- 3 bullets : Agenda partagé · Posts programmables · Sync Google + Notion
- Visuel : mini-calendrier semaine avec blocs colorés par membre

### 5.4 Pricing

**Carte unique horizontale**, max-width `760px`, centrée.

```
Background: bg.panel.deep (#1A1A1A)
Border: 1px linear-gradient(accent-start, accent-end) — radius-xl
Radius: 32px
Padding: 56px 64px
Shadow: shadow-elev
```

Contenu :
```
[Pill-accent micro] "PLAN UNIQUE"
[Display-md "8€"] [body "/utilisateur/mois"]
[body-sm muted] "L'OS complet — IA, stockage, mode associés inclus."

[Grille 2 col, gap 48px]
├── Col "Inclus"
│   ✓ Tous les modules
│   ✓ 100 requêtes Iris / utilisateur / mois
│   ✓ 1 Go stockage
│   ✓ Journal immuable + export audit
│   ✓ Apple Sign In + email
│   ✓ Sync Google Calendar + Notion
└── Col "Parfait pour"
    • 2–5 cofondateurs
    • Studios indépendants
    • Équipes early-stage qui veulent éviter le drame

[CTA primary pill géant 56px, full-width col] "Commencer 14 jours d'essai"
[caption muted center] "Sans CB. Annule en 1 clic."
```

**Mobile** : carte verticale, 2 col → 1 col, padding réduit à `32px 24px`.

### 5.5 CTA final

Avant le footer. Section dark avec un panel light arrondi :
```
[Panel bg.panel.light, radius-2xl, padding 80 64, centered]
[H2 Madimi One 48px ink.on-light.primary]
  "Prêt à fonder ensemble ?"
[Body ink.on-light.muted max 480px center]
  "14 jours pour décider. Sans engagement."
[CTA primary gradient pill 56px]
```

---

## 6. Spécifications écran — Web App (Dashboard)

### 6.1 Layout global

```
┌─────────────────────────────────────────────────────┐
│ [Sidebar 72px]  [Main content]                       │
│                  ┌──────────────────────────────┐   │
│                  │  Top bar                     │   │
│                  ├──────────────────────────────┤   │
│                  │                              │   │
│                  │  Grille widgets              │   │
│                  │                              │   │
│                  │  [+ Ajouter un widget]       │   │
│                  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

- **Sidebar** : fixe, largeur 72px (icônes only, optionnellement extensible à 240px)
- **Top bar** : sticky, hauteur 64px, fond `bg.page` + border bottom subtle
- **Main padding** : `space-8` (32px) latéral, `space-6` vertical

### 6.2 Sidebar

```
Width: 72px (collapsed) | 240px (extended au hover ou pinned)
Background: bg.surface.subtle (#16161B)
Border-right: 1px border.on-dark.subtle

[Top: logo 32px, gap 32px]
[Nav items 48×48 carrés cliquables, gap 4px]
  ▢ Dashboard         (active = bg accent-soft + 3px liseré accent gauche)
  ▢ Agenda
  ▢ Projets
  ▢ Cofondateurs
  ▢ Décisions    (badge orange si compte)
  ▢ Journal
  ▢ Iris (IA)
  ▢ Réglages

[Bottom: avatar 36px + menu profil au clic]
```

**État active** :
- Icône en `ink.on-dark.primary` (vs muted pour les autres)
- Liseré gauche 3px gradient accent (radius-pill bord gauche)
- Background `accent-soft`

### 6.3 Top bar

```
Height: 64px
Background: bg.page (translucide si scrollée + backdrop-blur)
Border-bottom: 1px border.on-dark.subtle
Padding: 0 32px

Contenu (flex):
[Workspace switcher] "BloomCo ▾"
  -- gap 24px --
[Salutation] "Bonsoir, Marc"
  -- ml-auto --
[Bouton ghost "+ Personnaliser"]
[Search icon button]
[Notifications bell (badge si non lus)]
[Avatar 32px → menu]
```

### 6.4 Grille widgets

Grille 12 colonnes, gouttière `24px`. Widgets en tailles standardisées :
- **S** : 3 col × 1 row (240px tall)
- **M** : 6 col × 1 row
- **L** : 6 col × 2 row (496px tall)
- **XL** : 12 col × 1 row (full width)

Widgets MVP :
| Widget | Taille | Contenu |
|---|---|---|
| **Agenda du jour** | M | Timeline verticale 06h–22h, slots colorés |
| **Tâches du jour** | M | Liste 5 items, checkbox + projet + priorité |
| **Charge équipe** | M | 2–5 avatars + barre horizontale heures cette semaine |
| **Décisions à voter** | M | Liste 3 décisions + count pending |
| **Équilibre associés** | L | Graphique stacked horizontal contributions % par membre, alerte si > 20% écart |
| **Alertes Iris** | M | 3 dernières alertes avec sévérité (info/warning/critique) |
| **Chrono global** | S | Big number HH:MM:SS + projet en cours + bouton stop |
| **+ Ajouter un widget** | S | Carte dashed border + icône + label |

**Widget template** :
```
[Card bg.panel.deep, radius-lg, padding 20, border subtle]
[Header flex] :
  [H5 title]
  [-- ml-auto --]
  [icon menu 16px (…)]
[Content]
[Footer optional : "Voir tout →" link]
```

États widget :
- Hover : `shadow-elev` + `bg.surface.elev`
- Empty : illustration 48px + label muted + CTA inline "Configurer →"

### 6.5 Écrans secondaires (à spec ultérieurement)

- **/dashboard/decisions** : liste + détail décision avec votes
- **/dashboard/journal** : liste chronologique read-only
- **/dashboard/equity** : graphique parts + historique changements
- **/dashboard/iris** : conversations + résumés générés
- **/dashboard/settings** : règles de gouvernance, membres, abonnement

---

## 7. Motion Charter

### 7.1 Tokens

```css
/* Durations */
--dur-instant: 100ms;   /* button press, toggle, scale feedback */
--dur-fast:    180ms;   /* hover, color shift, focus glow */
--dur-base:    240ms;   /* state changes, menu open, tab switch */
--dur-slow:    320ms;   /* modal/sheet entry, layout changes */
--dur-page:    400ms;   /* route transitions (rare) */

/* Easings (toujours utiliser ces 4) */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* défaut entrée */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);  /* CTA, hovers nets */
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);   /* gradient buttons, signature */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);      /* exits seulement */

/* Règle d'or : exit = 75% × duration enter */
```

### 7.2 Règles globales

1. **`prefers-reduced-motion` toujours respecté** : override CSS à 0.01ms.
2. **`transform` + `opacity` uniquement** — jamais `width`/`height`/`top`/`left`.
3. **Max 2 éléments animés par viewport** — sinon ça pollue.
4. **60fps obligatoire** : tester sur Chrome DevTools Performance avant ship.
5. **Exit faster than enter** : 75% de la durée d'entrée.
6. **Interruptible** : un clic doit pouvoir interrompre une animation.

### 7.3 Micro-interactions par composant

#### CTA primary (gradient)
- Hover : `transform: translateY(-1px)` + `shadow-accent-glow` apparaît, `--dur-fast` `ease-out-expo`
- Active : `transform: scale(0.98)`, `--dur-instant`
- Click loading : opacity `0.6` + cursor wait, spinner replace label

#### CTA secondary / ghost
- Hover : `background-color` shift, `--dur-fast` `ease-out-quart`
- Active : scale `0.98`, `--dur-instant`

#### Pill / tag
- Hover (si interactif) : opacity 0.85, `--dur-fast`
- Click : scale `0.95` → restore

#### Card (widget, feature)
- Hover : `transform: translateY(-2px)` + `shadow-elev`, `--dur-base` `ease-out-quart`
- Sortie hover : `ease-in`, durée `--dur-fast`

#### Sidebar nav item
- Hover : background `rgba(255,255,255,0.04)`, icône `ink.on-dark.primary`
- Active state : liseré gauche apparaît avec scale-x animation (0 → 1), `--dur-base` `ease-out-expo`

#### Tab switcher (dans widget)
- Indicateur sous tab actif : translate-x, `--dur-base` `ease-out-quint`
- Crossfade du contenu : opacity 0 → 1, `--dur-fast`

#### Input focus
- Border `accent-solid` : fade in, `--dur-fast`
- Ring `accent-soft` : scale 0.9 → 1 + opacity, `--dur-base` `ease-out-expo`

#### Toggle / switch
- Thumb slide : translate-x, `--dur-base` `ease-out-quint`
- Track color : crossfade, `--dur-base`

#### Modal / sheet
- Backdrop fade : opacity 0 → 0.55, `--dur-slow` `ease-out-quart`
- Sheet entry : `translateY(20px)` + `scale(0.96)` + opacity 0 → 1, `--dur-slow` `ease-out-quint`
- Exit : reverse, durée `--dur-fast` (75%)

#### Toast
- Entry : `translateY(8px)` + opacity 0 → 1, `--dur-base` `ease-out-expo`
- Exit après 5s : opacity 1 → 0 + `translateY(-4px)`, `--dur-fast`

---

### 7.4 Scroll-reveal (sections features)

```css
/* Pattern Attio : texte glisse de la gauche, visuel de la droite */

/* État initial (avant intersection) */
.feature-text { transform: translateX(-24px); opacity: 0; }
.feature-visual { transform: translateX(24px); opacity: 0; }

/* État visible (in-view, déclenché par IntersectionObserver à 0.2 threshold) */
.feature-text.in-view {
  transform: translateX(0); opacity: 1;
  transition: transform var(--dur-slow) var(--ease-out-quart),
              opacity var(--dur-slow) ease-out;
}
.feature-visual.in-view {
  transform: translateX(0); opacity: 1;
  transition: transform var(--dur-slow) var(--ease-out-quart) 80ms,
              opacity var(--dur-slow) ease-out 80ms;
}
```

- **Threshold** : 0.2 (élément visible à 20%)
- **Délai entre texte et visuel** : 80ms (le visuel arrive juste après)
- **Trigger une seule fois** (pas de re-animation en scrollant back)

---

### 7.5 Hero landing — entrance stagger

```
T+0    : background gradient fade in (durée 400ms)
T+100  : overline pill fade-up (translateY 8px → 0, opacity)
T+200  : H1 fade-up + scale léger (0.98 → 1)
T+320  : body-lg fade-up
T+440  : CTAs fade-up + scale (les 2 en même temps)
T+560  : visuel dashboard slide-in from right (translateX 32px → 0)
```

Toutes les durées individuelles : `--dur-slow` (320ms), easing `ease-out-quart`.

---

### 7.6 Dashboard widgets — entrance stagger

À l'ouverture du dashboard, les widgets entrent en cascade :

```
[Pour chaque widget, dans l'ordre de la grille :]
- Délai = index × 50ms (max 250ms total)
- Animation : translateY(12px) + opacity 0 → 1
- Durée : --dur-base
- Easing : ease-out-quart
```

Limite : si > 6 widgets, capper à index 6 (les suivants apparaissent en parallèle).

---

### 7.7 Animations signature (toujours-actives)

À utiliser **avec parcimonie** — max 1–2 par écran.

#### Pulsation nœud Iris (sur le mock du hero + widget Alertes)
```css
@keyframes iris-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.15); opacity: 1; }
}
.iris-node { animation: iris-pulse 2.4s ease-in-out infinite; }
```
Durée 2.4s, jamais plus court (ne doit pas distraire).

#### Chrono counter
- Affichage tabular-nums
- Update à 1Hz (pas plus haut sinon flicker)
- Pas d'animation sur les digits — simple replace
- Couleur passe en `accent-solid` quand running, gris quand stopped

---

## 8. Accessibilité

### Checklist par feature
- [ ] Contraste texte ≥ 4.5:1 (body) / 3:1 (large text 18px+ ou 14px bold)
- [ ] `focus-visible` ring visible sur tous interactifs (jamais `outline: none`)
- [ ] Boutons icône → `aria-label` obligatoire
- [ ] Heading hierarchy respectée (h1 → h2 → h3, pas de skip)
- [ ] Forms : `label[for]` toujours, errors près du champ + `aria-live`
- [ ] `prefers-reduced-motion` respecté (override CSS global)
- [ ] Couleur jamais seul moyen (alerte = icône + couleur + label)
- [ ] Touch targets ≥ 44×44px sur mobile
- [ ] Toast `aria-live="polite"` + ne vole pas le focus

---

## 9. Anti-patterns à éviter

- 🚫 Madimi One en body ou paragraphes
- 🚫 Gradient orange en background de panel entier
- 🚫 Box-shadow agressif (>0.5 opacité) en dark mode
- 🚫 Animation avec `width`/`height`/`top`/`left` (jank)
- 🚫 Durée animation > 500ms (sauf transition de page rare)
- 🚫 Bounce / elastic easing (dépassé, pollue le ton "sérieux")
- 🚫 Emojis comme icônes structurelles (utiliser SVG Lucide/Heroicons)
- 🚫 Texte sur image décorative sans contraste vérifié
- 🚫 Plus de 2 animations simultanées par viewport
- 🚫 `cursor: pointer` sans `role="button"` ou `<button>` sémantique
- 🚫 Hover-only feedback (touch users perdus)
- 🚫 Stratégie "tout dark, tout sombre" sans la respiration des panels light
- 🚫 Iconographie incohérente (mélanger filled + outline sans logique)

---

## 10. Stack technique (rappel — pas de design ici)

- **Next.js 16** (App Router, Turbopack) — voir `AGENTS.md` pour les pièges
- **Tailwind CSS 4** + shadcn/ui
- **Supabase** (auth + DB + RLS)
- **Stripe** (à venir pour facturation 8€/user/mois)
- **Anthropic Claude** (Iris)

Le détail tech ne vit pas dans ce fichier — il vit dans `AGENTS.md` et dans
les README de chaque feature.

---

## 11. Process & qualité

### Avant chaque PR / commit visuel
1. Tokens utilisés (pas de hex brut dans les composants) ?
2. Contraste vérifié (tool : Stark / WAVE) ?
3. `focus-visible` présent ?
4. `prefers-reduced-motion` testé ?
5. Mobile testé en 375px ?
6. 60fps confirmé (Performance tab) ?
7. Cohérent avec un autre écran (style + spacing) ?

### Quand on ajoute un nouveau composant
1. Le dériver des composants canoniques (§4)
2. Documenter les variantes dans ce fichier (édit la section concernée)
3. Si exception au design system : argumenter dans le commit + ajouter une note

---

*Document vivant. Met à jour les sections quand le produit évolue. Si conflit
entre ce guideline et le code existant : ce document gagne (refactor le code).*
