/**
 * E2E : decision flow
 *
 * login → /decisions → create → vote 'for' → verify computed status
 *
 * Skip if the user is in solo mode (no team yet) — the test creates a team
 * via /onboard if needed.
 */

import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.skip(!EMAIL || !PASSWORD, 'E2E creds missing')

test('decision: create, vote for, computed status updates', async ({ page }) => {
  // 1. Login
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 })

  // 2. Go to decisions
  await page.goto('/decisions')

  // 3. If solo mode banner shown, create a team via onboard first
  if (await page.getByText('Les décisions sont une feature').count() > 0) {
    await page.goto('/onboard')
    await page.getByRole('button', { name: 'Avec des associés' }).click()
    await page.fill('input#teamName', 'E2E Team')
    await page.getByRole('button', { name: /Créer l'équipe/ }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    await page.goto('/decisions')
  }

  // 4. Create a new decision
  const decisionTitle = `E2E Decision ${Date.now()}`
  await page.fill('input[placeholder="titre de la décision"]', decisionTitle)
  await page.getByRole('button', { name: /Créer décision/ }).click()

  // 5. Open the decision detail
  await page.getByRole('link', { name: decisionTitle }).click()
  await expect(page.getByRole('heading', { name: decisionTitle })).toBeVisible()

  // 6. Vote 'for' — expect computed status to update
  await page.getByRole('button', { name: 'Pour' }).click()

  // Wait for the recompute (called automatically after vote)
  await page.waitForTimeout(800)

  // Reading the computed tally → tally text should reflect the vote
  const tallyText = await page.locator('text=/Tally :/').textContent()
  expect(tallyText).toMatch(/pour 1/)
})
