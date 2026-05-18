# Tests

## Unit tests (Vitest)

Pure-fn tests sur la logique métier — **pas de mock Supabase**.

```bash
npm test            # one-shot
npm run test:watch  # watch mode
```

Couvert :
- `tests/rules/decision-status.test.ts` — 16 tests sur `computeDecisionStatusPure`
  - 3 validation modes (single_owner / majority_vote / unanimous)
  - Deadline (expired / approved override)
  - Edge cases (0 membres, pas de règle)
  - `selectApplicableRule` pour spending_threshold
- `tests/rules/timer-constraint.test.ts` — 7 tests sur `canStartTimer`
  - start / noop / switch
  - undefined ↔ null handling

Pour ajouter un test : créer `tests/<scope>/<name>.test.ts` puis `import` la
pure fn depuis `@/lib/rules/...`.

## E2E (Playwright)

E2E tests réels contre un dev server.

### Setup

```bash
# 1. Install Playwright browser binaries (1ère fois seulement)
npx playwright install chromium

# 2. Créer .env.test avec un compte test seedé
cp .env.example .env.test
# Editer .env.test :
#   E2E_TEST_EMAIL=test@bloom.fr
#   E2E_TEST_PASSWORD=...
#   (le compte doit exister dans Supabase Auth — signup manuellement
#    la première fois OU le seeder via Supabase dashboard)

# 3. Démarrer le dev server dans un terminal séparé
npm run dev

# 4. Lancer les E2E dans un autre terminal
npm run e2e            # headless
npm run e2e:ui         # mode UI Playwright (debug visuel)
```

### Tests E2E inclus

- `e2e/timer.spec.ts` — flow chrono : login → /chrono → start → wait → stop → entry visible
- `e2e/decision.spec.ts` — flow décisions : login → /decisions → create →
  vote 'for' → vérifie le tally calculé

Les tests E2E **skippent automatiquement** si `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`
ne sont pas définis (build CI sans creds = pas d'échec).
