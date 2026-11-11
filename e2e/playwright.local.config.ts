import { defineConfig, devices } from '@playwright/test';

// Local smoke only. Staging config untouched (playwright.config.ts).
// Run: npx playwright test -c playwright.local.config.ts
export default defineConfig({
  testDir: './tests-local',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  projects: [
    {
      name: 'local-customer',
      testMatch: 'tests-local/customer-*',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5193' },
    },
    {
      name: 'local-admin',
      testMatch: 'tests-local/admin-*',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5188' },
    },
  ],
});
