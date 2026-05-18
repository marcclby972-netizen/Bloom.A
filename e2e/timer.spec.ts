/**
 * E2E : timer flow
 *
 * login → /chrono → start → wait 2s → stop → verify entry visible
 *
 * Prerequisites :
 *   - Dev server running (npm run dev)
 *   - .env.test with E2E_TEST_EMAIL + E2E_TEST_PASSWORD
 *   - The test user must exist in Supabase (sign up manually first time)
 */

import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.skip(!EMAIL || !PASSWORD, 'E2E creds missing — set E2E_TEST_EMAIL + E2E_TEST_PASSWORD')

test('timer: start, tick, stop, entry visible', async ({ page }) => {
  // 1. Login
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 })

  // 2. Go to chrono
  await page.goto('/chrono')
  await expect(page.getByRole('heading', { name: 'Chrono' })).toBeVisible()

  // 3. Ensure no timer is running (defensive: stop if one is)
  const stopButton = page.getByRole('button', { name: 'Stop' })
  if (await stopButton.count() > 0) {
    await stopButton.click()
    await page.waitForTimeout(500)
  }

  // 4. Start a new timer
  await page.getByRole('button', { name: 'Démarrer' }).click()

  // 5. Wait 2s and verify counter is ticking
  await page.waitForTimeout(2_000)
  const timerText = await page.locator('p').filter({ hasText: /\d{2}:\d{2}/ }).first().textContent()
  expect(timerText).toMatch(/00:0[1-3]/) // 1..3 seconds elapsed

  // 6. Stop the timer
  await page.getByRole('button', { name: 'Stop' }).click()

  // 7. Verify entry appears in the "7 derniers jours" list
  await expect(page.getByText('7 derniers jours')).toBeVisible()
  // The entry list should have at least one li now
  await expect(page.locator('section').filter({ hasText: '7 derniers jours' }).locator('li').first()).toBeVisible({ timeout: 5_000 })
})
