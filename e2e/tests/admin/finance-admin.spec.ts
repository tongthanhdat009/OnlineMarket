import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_BASE_URL } from './helpers';

test.describe('Admin panel — finance (bills, refunds)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('bills page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/bills`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Bills")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export bills' })).toBeVisible();
  });

  test('refunds page loads with pending count', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/refunds`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Refund requests")')).toBeVisible();
    await expect(page.getByText(/Pending/)).toBeVisible();
    await expect(page.locator('th:has-text("REQUEST")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});

test.describe('Admin panel — staff, roles, permissions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('staff page loads with user list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Staff")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add staff' })).toBeVisible();
    await expect(page.getByText(/Nguyễn Minh|Admin/)).toBeVisible();
    await expect(page.getByText(/Lê Hương|Manager/)).toBeVisible();
    await expect(page.getByText(/Trần Nam|Staff/)).toBeVisible();
  });

  test('roles page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/roles`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Roles")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New role' })).toBeVisible();
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(page.getByText('Manager')).toBeVisible();
    await expect(page.getByText('Staff')).toBeVisible();
  });

  test('permissions page loads with matrix', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/permissions`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Permissions")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add permission' })).toBeVisible();
    await expect(page.locator('th:has-text("PERMISSION")')).toBeVisible();
    await expect(page.locator('th:has-text("ADMIN")')).toBeVisible();
    await expect(page.locator('th:has-text("MANAGER")')).toBeVisible();
    await expect(page.locator('th:has-text("STAFF")')).toBeVisible();
    await expect(page.getByText('Dashboard view')).toBeVisible();
    await expect(page.getByText('Product manage')).toBeVisible();
    await expect(page.getByText('Order manage')).toBeVisible();
  });
});

test.describe('Admin panel — AI operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('AI chat page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/ai/chat`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Store Assistant")')).toBeVisible();
    await expect(page.getByText(/Read-only operations copilot/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tồn kho/ })).toBeVisible();
    await expect(page.getByText(/Ask about your store/)).toBeVisible();
  });

  test('agents page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/ai/agents`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible();
  });
});
