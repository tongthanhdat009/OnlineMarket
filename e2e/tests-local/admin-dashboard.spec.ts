import { test, expect } from '@playwright/test';

// Unauthenticated /dashboard is bounced to /login by AuthenticatedShell.
test('admin dashboard redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
});

test('admin orders page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login/);
});
