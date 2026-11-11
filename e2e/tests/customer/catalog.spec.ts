import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('home page shows products and categories', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Mua sắm tất cả' }).first()).toBeVisible();
    await expect(page.getByText('Mua theo danh mục')).toBeVisible();
    const productCards = page.locator('article').filter({ has: page.locator('button:has-text("Thêm vào giỏ")') });
    await expect(productCards.first()).toBeVisible();
  });

  test('can browse all products page', async ({ page }) => {
    await page.getByRole('button', { name: 'Mua sắm tất cả' }).first().click();
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByText('Bộ lọc')).toBeVisible();
  });

  test('can view product detail page', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.getByRole('link', { name: /^Xem / }).first().click();
    await expect(page.locator('text=Thêm vào giỏ hàng').first()).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/products/);
  });

  test('can search products', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    const searchInput = page.getByLabel('Tìm sản phẩm').first();
    await searchInput.fill('Coca');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search.*q=Coca/);
    await expect(page.locator('text=Coca Cola lon')).toBeVisible();
  });
});
