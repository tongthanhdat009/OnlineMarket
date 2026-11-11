import { test, expect } from '@playwright/test';

// Cart is behind ProtectedRoute → unauth users land on /login.
test('cart page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login/);
});

test('products page loads list', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByLabel('Giá tối thiểu')).toBeVisible();
});
