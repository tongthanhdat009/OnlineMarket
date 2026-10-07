import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_BASE_URL } from './helpers';

test.describe('Admin panel — auth', () => {
  test('login page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await expect(page.locator('h1:has-text("Sign in to admin")')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('can authenticate via API and access dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('text=STORE OPERATIONS')).toBeVisible();
    await expect(page.locator('h1:has-text("Good morning")')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Customers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Refunds' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Staff' })).toBeVisible();
  });

  test('admin user info shows in header', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('Store Admin')).toBeVisible();
    await expect(page.getByText('Administrator')).toBeVisible();
  });
});
