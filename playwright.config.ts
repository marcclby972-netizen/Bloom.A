import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — E2E flows for Bloom v3.
 *
 * Requires a running dev server (`npm run dev`) before `npm run e2e`,
 * OR set `webServer.command` to auto-start.
 *
 * Set `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` in .env.test before running.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,                 // Bloom state shared via Supabase — keep serial
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
