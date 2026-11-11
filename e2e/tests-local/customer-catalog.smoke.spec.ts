import { test, expect } from '@playwright/test';

test('customer catalog page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
});
