import { test, expect } from '@playwright/test';

// Real admin login against local dev stack (API :7000 + admin SPA :5188).
// Uses dev seed account admin/123456. Creates no data — nothing to clean up.
test.describe('admin real login (dev seed)', () => {
  test('login form signs in and lands on dashboard with stats', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@store.vn').fill('admin');
    await page.getByPlaceholder('Nhập mật khẩu').fill('123456');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Tổng doanh thu').first()).toBeVisible({ timeout: 15000 });
  });

  test('wrong password shows error and stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@store.vn').fill('admin');
    await page.getByPlaceholder('Nhập mật khẩu').fill('wrong-password');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('form p').filter({ hasText: /không thành công|không đúng|sai|không chính xác/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
