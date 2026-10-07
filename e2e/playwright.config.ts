import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://staging-online-market.jadt.io.vn',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'tests/customer/**/*.spec.ts',
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'tests/admin/**/*.spec.ts',
    },
  ],
});
