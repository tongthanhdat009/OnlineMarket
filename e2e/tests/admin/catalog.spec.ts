import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_BASE_URL } from './helpers';

test.describe('Admin panel — products', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('products page loads with product list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add product' })).toBeVisible();
    await expect(page.locator('th:has-text("PRODUCT")')).toBeVisible();
    await expect(page.locator('th:has-text("SKU")')).toBeVisible();
    await expect(page.locator('th:has-text("CATEGORY")')).toBeVisible();
    await expect(page.locator('th:has-text("PRICE")')).toBeVisible();
    await expect(page.locator('th:has-text("STOCK")')).toBeVisible();
    await expect(page.locator('th:has-text("STATUS")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('products show stock status indicators', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Normal|Low|Out of stock/)).toBeVisible();
  });
});

test.describe('Admin panel — inventory', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('inventory page loads with stock table', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/inventory`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.locator('th:has-text("PRODUCT")')).toBeVisible();
    await expect(page.locator('th:has-text("SUPPLIER")')).toBeVisible();
    await expect(page.locator('th:has-text("STOCK")')).toBeVisible();
    await expect(page.locator('th:has-text("UPDATED")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});

test.describe('Admin panel — customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('customers page loads with CRM list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add customer' })).toBeVisible();
    await expect(page.locator('th:has-text("CUSTOMER")')).toBeVisible();
    await expect(page.locator('th:has-text("PHONE")')).toBeVisible();
    await expect(page.locator('th:has-text("ORDERS")')).toBeVisible();
    await expect(page.locator('th:has-text("TOTAL SPEND")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});

test.describe('Admin panel — categories, suppliers, promotions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('categories page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Categories")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add category' })).toBeVisible();
  });

  test('suppliers page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/suppliers`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Suppliers")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add supplier' })).toBeVisible();
  });

  test('promotions page loads', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/promotions`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Promotions")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create promotion' })).toBeVisible();
  });
});
