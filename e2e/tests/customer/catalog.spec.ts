import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('home page shows products and categories', async ({ page }) => {
    await expect(page.locator('h1:has-text("Good food")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shop all products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All products' })).toBeVisible();
    const productCards = page.locator('article').filter({ has: page.locator('button:has-text("Add")') });
    await expect(productCards.first()).toBeVisible();
  });

  test('can browse all products page', async ({ page }) => {
    await page.getByRole('button', { name: 'Shop all products' }).click();
    await expect(page.locator('h1:has-text("All products")')).toBeVisible();
  });

  test('can view product detail page', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    const firstProduct = page.locator('article').filter({ has: page.locator('button:has-text("Add")') }).first();
    await firstProduct.click();
    await expect(page.locator('text=Add to cart')).toBeVisible();
    await page.getByText('Back to shopping').click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('can search products', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Coca');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search.*q=Coca/);
    await expect(page.locator('text=Coca Cola')).toBeVisible();
  });
});
