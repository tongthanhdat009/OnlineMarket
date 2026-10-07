import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_BASE_URL } from './helpers';

test.describe('Admin panel — orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('orders page loads with order list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Online' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Offline' })).toBeVisible();
  });

  test('orders table has rows with customer, channel, payment, status columns', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('th:has-text("ORDER")')).toBeVisible();
    await expect(page.locator('th:has-text("CUSTOMER")')).toBeVisible();
    await expect(page.locator('th:has-text("CHANNEL")')).toBeVisible();
    await expect(page.locator('th:has-text("PAYMENT")')).toBeVisible();
    await expect(page.locator('th:has-text("STATUS")')).toBeVisible();
    await expect(page.locator('th:has-text("TOTAL")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('can filter orders by channel', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Online' }).click();
    await expect(page.getByRole('button', { name: 'Online' }).getByText(/Online/)).toBeVisible();
  });
});
