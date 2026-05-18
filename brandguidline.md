# Bloom — Brand & Design Guideline

> Source of truth pour le design. Aligné sur les fichiers HTML de référence
> dans `reference bloom/` (faits avec Claude Design).
>
> Quand tu codes un écran : ouvre d'abord le HTML correspondant pour le
> visuel exact, puis utilise les tokens ci-dessous pour Tailwind/CSS.

---

## 0. Vision & ton

**Bloom** = OS pour cofondateurs / associés / freelances.
Cœur : gouvernance, contributions, décisions, temps, finances.

**Ton visuel** : sérieux moderne avec une chaleur humaine (Bricolage
Grotesque + accents orange chauds). Cockpit-clean en mode app (dark),
landing-page hospitalière en mode marketing (light cream).

**Ton voix** (FR) : direct, tutoiement, phrases courtes, honnête sur
l'inconfort. Interdits : "leverage", "synergie", "boost", emojis comme
icônes structurelles.

---

## 1. Fichiers de référence (à consulter avant tout dev UI)

| Page | HTML reference | Mode |
|---|---|---|
| Landing | `reference bloom/bloom-landing.html` | Light |
| Onboarding | `reference bloom/onboarding.html` | Light |
| Dashboard | `reference bloom/dashboard.html` | Dark |
| Settings | `reference bloom/settings.html` | Dark |

Les HTMLs contiennent le CSS exact, les composants finis, les animations,
les transitions. **Toujours s'y référer pour le pixel-perfect** —
ce document résume les tokens et patterns mais le HTML reste l'autorité
pour le rendering exact.

---

## 2. Design Tokens (exacts depuis le HTML)

### 2.1 Couleurs

**Light mode** (landing + onboarding) :
```css
--bg:           #FFFFFF;
--surface:      #F4F2EE;     /* surfaces primaires */
--surface-2:    #FAF9F6;     /* surface alt légère */
--surface-3:    #EEEAE3;     /* surface tertiaire */

--ink:          #0E0E10;     /* texte principal */
--ink-2:        #2A2A2A;     /* texte fort */
--muted:        #6B6B6B;     /* texte secondaire */
--faint:        #9A9A9A;     /* texte tertiaire, captions */

--border:        rgba(17,17,17,0.08);
--border-strong: rgba(17,17,17,0.14);
```

**Dark mode** (dashboard + settings) :
```css
--dark:           #0E0E10;     /* fond global */
--dark-2:         #16161A;     /* cards / widgets */
--dark-3:         #1F1F25;     /* hover, surfaces internes */

--on-dark:        #ECECEC;     /* texte sur dark */
--on-dark-muted:  rgba(236,236,236,0.62);
--on-dark-faint:  rgba(236,236,236,0.38);

--border-dark:    rgba(255,255,255,0.08);
```

**Accent (orange — signature Bloom)** :
```css
--orange:        #E37520;
--orange-2:      #FBBE4D;
--gradient:      linear-gradient(135deg, #E37520 0%, #FBBE4D 100%);
--gradient-soft: linear-gradient(135deg, rgba(227,117,32,0.10) 0%, rgba(251,190,77,0.05) 100%);
```

**Sémantique** :
```css
--success: #22C55E;
--warning: #F59E0B;   /* #FBBF24 en dark */
--danger:  #EF4444;   /* #F87171 en dark */
--info:    #3B82F6;   /* #60A5FA en dark */
```

**Couleurs projets/events** (palette de chips) :
- bleu, vert, violet, rose — chacun en variante claire/foncée pour les
  swatches d'évènements dashboard

### 2.2 Typographie

3 familles Google Fonts :
| Famille | Usage | Poids utilisés |
|---|---|---|
| **Bricolage Grotesque** | Display : headlines, titres de section, hero | 500, 600, 700, 800 |
| **Montserrat** | Body : UI, paragraphes, boutons, navigation, formulaires | 400, 500, 600, 700, 800 |
| **Madimi One** | Logo wordmark "Bloom" exclusivement | 400 |

```css
--font-display: 'Bricolage Grotesque', 'Montserrat', system-ui, sans-serif;
--font:         'Montserrat', system-ui, sans-serif;
```

**Échelle** (responsive via clamp) :
| Rôle | Taille / line-height | Weight | Letter-spacing |
|---|---|---|---|
| Display section | `clamp(36px, 4.5vw, 56px)` / 1.04 | 700 | -0.03em |
| Step title (onboarding) | `clamp(28px, 3vw, 38px)` / 1.1 | 700 | -0.025em |
| H1 page (app) | 32px / 1.2 | 700 | -0.02em |
| H2 sub-section | 22-24px / 1.3 | 600 | -0.01em |
| Body | 14.5-17px / 1.5 | 400 | 0 |
| Body-sm | 13px / 1.5 | 500 | 0 |
| Caption | 12px / 1.4 | 500 | 0 |
| **Eyebrow** | 12-12.5px / 1.2 | 700 | **+0.14em uppercase** |
| Button | 14.5-15px | 700 | 0 |

### 2.3 Spacing

Échelle implicite multiple de 4. Valeurs canoniques observées :
- Card padding : `44px` (large), `32px` (medium), `24px` (small)
- Section padding (vertical) : `100px` desktop, ~60px tablet, 40px mobile
- Container max-width : `1240px` (`--max`)
- Container padding latéral : `80px` desktop (`--pad`), 24px tablet, 16px mobile
- Sidebar : `18px` 14px paddings internes
- Top bar : `26px / 40px` horizontal (responsive 18px / 20px mobile)
- Gouttière grille : `24px`

### 2.4 Border-radius

```css
--r-panel: 32px;     /* grands panels, hero containers */
--r-card:  22px;     /* widgets, cards principales */
--r-btn:   14px;     /* boutons rectangulaires (rare — préférer pill) */
--r-pill:  999px;    /* boutons + tous CTA + badges */
```

Specifics par page :
- Onboarding card : 24px
- Settings sections : 18px
- Dashboard widgets : 14-22px
- Inputs : 12-14px

### 2.5 Ombres

```css
--shadow-pill:    0 10px 32px -10px rgba(17,17,17,0.14),
                  0 0 0 1px rgba(17,17,17,0.05);

--shadow-card:    0 14px 40px -20px rgba(17,17,17,0.16),
                  0 0 0 1px rgba(17,17,17,0.05);

/* Sur fond clair, CTA gradient orange */
--shadow-cta:     0 14px 32px -10px rgba(227,117,32,0.45),
                  inset 0 1px 0 rgba(255,255,255,0.25);

/* Sur fond dark, CTA dark */
--shadow-dark-cta: 0 14px 32px -10px rgba(0,0,0,0.35),
                   inset 0 1px 0 rgba(255,255,255,0.10);
```

### 2.6 Motion

**Durées + easings canoniques** :
```css
--ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);   /* défaut entrée */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* pop success */

/* Transitions interactives */
.btn { transition: transform .15s ease, box-shadow .2s ease,
                   background .2s ease, color .2s ease; }
```

| Pattern | Durée | Easing |
|---|---|---|
| Hover button (lift -1px) | 150ms | ease |
| State change (bg, color) | 200ms | ease |
| Step entrance (fade + slide 12px) | 400ms | ease-out-quart |
| Reveal staggered (children +80ms) | 700-800ms | ease-out-quart |
| Success pop (scale 0 → 1) | 600ms | spring (0.34, 1.56) |
| Success ring | 1.8s infinite | ease-out |
| Confetti fall | 1.6s | ease-out |
| Blink indicator | 1s infinite | ease-in-out |

Toujours respecter `prefers-reduced-motion`.

---

## 3. Composants canoniques

### Buttons (5 variantes)
| Variante | Style |
|---|---|
| `.btn-primary` | bg `--gradient`, text white, `--shadow-cta`, hover `translateY(-1px)` |
| `.btn-secondary` | bg `--surface`, border `--border`, text `--ink`, hover darker |
| `.btn-ghost` | bg transparent, text `--ink`, hover bg subtle |
| `.btn-dark` | bg `--dark`, text white (sur fond clair) |
| `.btn-light` | bg white, text `--ink` (sur fond dark) |

Taille standard : 44-48px hauteur, padding 14px-24px, radius pill (999px).
Taille large : 56px hauteur, padding 28px, radius 16px.

### Cards
- `.card` : `var(--surface)`, border, `--shadow-card`, radius 22-24px
- `.choice-card` : 18px radius, selected = gradient soft bg + checkmark badge
- `.coach-toast` : gradient bg subtle, badge "IA", icon + texte + CTA
- `.success-card` : centered, container pour confettis

### Forms
- `.input / .select` : 48px hauteur, padding 16px, border `--border`,
  radius 12px, focus = orange highlight 1.5px + ring `--gradient-soft`
- `.input-prefix` : input avec préfixe/suffixe baked-in (`%`, `€`, domain)
- `.field` : label (12.5px / 700) + input + helper-text (`--faint`, 11px)

### Navigation
- `.eyebrow` : label uppercase + dot indicator gradient
- `.sb-item` : sidebar nav item, active = `--gradient-soft` bg + left border accent 3px
- `.sb-section` : header de section uppercase, faint

### Pills / badges / chips
- `.pill` : 999px, padding `0.5rem 1rem`, font 12-13px / 600
- `.tag-micro` : 11px, uppercase, `+0.08em` tracking, 28px hauteur
- Badges colorées sémantiques (success/warning/danger/info) : `bg-color/12` + text-color

### Divider
- Horizontal line `--border` + texte centré optionnel (pour "OU" entre OAuth + email)

### Progress
- Step indicator : dots horizontaux, état on / done / current (current = filled gradient)
- Progress bar : 4px hauteur, fill `--gradient`

---

## 4. Patterns visuels signature

| Pattern | Description |
|---|---|
| **Frosted header pill** | `backdrop-filter: blur(12px) saturate(160%)` sur header flottant |
| **Halos radial** | `radial-gradient` orange/jaune subtil aux coins (20%, 90%) du hero |
| **Dot grid texture** | overlay 28×28px `radial-gradient` à opacity 0.06, fixe |
| **Gradient text** | `background-clip: text` + `-webkit-text-fill-color: transparent` sur le wordmark "Bloom" et mots accent |
| **Confetti success** | rectangles aléatoires + rotation + fall, staggered delays, palette brand |
| **Color swatches projets** | 5 paires de gradients (orange/blue/green/purple/pink) pour distinction event/projet |
| **Choice card lift** | hover `translateY(-2px)`, selected `gradient-soft` bg + border glow |
| **Coach toast** | bandeau IA léger en haut/bas des steps onboarding, gradient subtil |

---

## 5. Structure des pages (cf. HTML reference pour le détail)

### Landing (`bloom-landing.html`, light)
1. Header pill fixe (logo + nav + CTA) avec frosted glass
2. Hero : headline (Bricolage 56px) + sub + 2 CTAs + dashboard mockup débordant
3. Pain points (section dark inversée)
4. Features (cards 3-4 col)
5. Pricing (single tier — pas de comparison)
6. FAQ (accordion)
7. Footer (panel arrondi détaché des bords)

### Onboarding (`onboarding.html`, light)
5 steps avec 2 paths (solo/team) :
1. **Signup** : OAuth (Google/Apple) + email/password + divider
2. **Choice** : Solo vs Team (2-col, choice cards)
3. **Solo path** (3 steps) : Project → First task (priority picker) → Start timer
4. **Team path** (3 steps) : Team config → Member profile + equity → Governance rules → Invite associates
5. **Final** : Success screen + confettis + dashboard preview + toast next action

### Dashboard (`dashboard.html`, dark)
- **Sidebar 244px** (collapsible 72px) : Logo + sections collapsible (Main/Team/Tools) + nav items avec badges + footer user menu
- **Topbar 64px** : back button + page title + spacer + user avatar menu
- **Grille widgets** : Calendar, stats tiles, progress bars, event list color-coded
- Dark mode par défaut

### Settings (`settings.html`, dark)
- Sidebar identique au dashboard (244px)
- Topbar avec back nav
- Sections settings (Account, Preferences, Integrations, etc.)
- Form-heavy : inputs/toggles/selects stylés consistant
- Active nav state : soft gradient bg + left border accent

---

## 6. Stack technique cible (mapping HTML → React)

Le HTML reference est en **CSS pur + vanilla JS**. À porter en :
- **Next.js 16 App Router** (existant)
- **Tailwind CSS** : configurer les tokens dans `globals.css` (CSS vars) puis
  exposer via `@theme` Tailwind 4. Les `var(--orange)` deviennent
  `text-orange`, `bg-gradient`, etc.
- **Lucide React** : remplacer les SVG inline du HTML par `lucide-react` icons
- **Polices** : `next/font/google` pour Bricolage Grotesque + Madimi One + Montserrat (déjà loaded)
- **Animations** : `tailwindcss-animate` (déjà installé) + CSS keyframes custom pour le confetti / pop

---

## 7. Workflow recommandé pour porter le HTML

1. **Ouvrir le HTML** dans le navigateur (`file://...`) pour voir le rendu
2. **Lire la section CSS** correspondante pour les variables exactes
3. **Lire le HTML** pour la structure (classes utilisées, ordre des éléments)
4. **Réécrire en JSX** avec Tailwind v4 utilisant les tokens (`bg-[var(--orange)]` ou directement `bg-orange` si exposé)
5. **Référencer ce guideline** pour les conventions de naming + patterns

---

## 8. Anti-patterns à éviter

- 🚫 Mélanger plusieurs polices custom hors palette (Bricolage / Montserrat / Madimi One)
- 🚫 Bordures dures (>2px) sauf cas justifié — on préfère ombres + opacity
- 🚫 Gradient en background de paragraphes longs (lisibilité)
- 🚫 Animations bouncy (cubic-bezier elastic) sauf success pop
- 🚫 Emojis comme icônes (utiliser Lucide ou SVG inline)
- 🚫 Box-shadow > opacity 0.5 sur fond clair (trop dur)
- 🚫 Tailwind classes arbitraires (`text-[#E37520]`) — passer par les tokens

---

## 9. Accessibilité (rappel)

- Contraste texte ≥ 4.5:1 body / 3:1 large text
- `focus-visible` ring 2px orange + offset 2px, jamais `outline: none`
- Touch targets ≥ 44×44px
- Heading hierarchy stricte (h1 → h2 → h3)
- `prefers-reduced-motion` honoré (override durées à 0.01ms)
- ARIA labels sur boutons icônes
- Couleur jamais seul moyen (alerte = icône + couleur + label)

---

*Quand le code et ce document divergent, la référence est l'ordre :*
*1. Le HTML dans `reference bloom/`*
*2. Ce document (`brandguidline.md`)*
*3. Le code TypeScript/React existant*
