import { test, expect } from '@playwright/test';

// Checkout is behind ProtectedRoute → unauth users land on /login.
test('checkout page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/login/);
});

test('payment-result page loads', async ({ page }) => {
  await page.goto('/payment-result');
  await expect(page.locator('body')).toBeVisible();
});
