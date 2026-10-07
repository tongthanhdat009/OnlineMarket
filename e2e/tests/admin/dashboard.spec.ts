import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Admin panel — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard shows stats cards', async ({ page }) => {
    await expect(page.locator('text=Total revenue')).toBeVisible();
    await expect(page.locator('text=Total orders')).toBeVisible();
    await expect(page.locator('text=Online orders')).toBeVisible();
    await expect(page.locator('text=Offline orders')).toBeVisible();
  });

  test('dashboard shows revenue and orders charts', async ({ page }) => {
    await expect(page.locator('h2:has-text("Revenue trend")')).toBeVisible();
    await expect(page.locator('h2:has-text("Orders trend")')).toBeVisible();
  });

  test('dashboard shows needs attention section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Needs attention")')).toBeVisible();
    await expect(page.getByText(/low on stock/i)).toBeVisible();
    await expect(page.getByText(/refunds waiting/i)).toBeVisible();
    await expect(page.getByText(/orders waiting/i)).toBeVisible();
  });

  test('dashboard shows top products', async ({ page }) => {
    await expect(page.locator('h2:has-text("Top products")')).toBeVisible();
  });

  test('dashboard shows daily performance table', async ({ page }) => {
    await expect(page.locator('h2:has-text("Daily performance")')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Orders")')).toBeVisible();
    await expect(page.locator('th:has-text("Revenue")')).toBeVisible();
  });
});
