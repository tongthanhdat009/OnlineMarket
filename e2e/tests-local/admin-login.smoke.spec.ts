import { test, expect } from '@playwright/test';

test('admin login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
  await expect(page.getByPlaceholder('you@store.vn')).toBeVisible();
});
