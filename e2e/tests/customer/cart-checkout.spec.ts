import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — cart and checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('can add products to cart', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();
    await expect(page.getByRole('link', { name: 'Cart', exact: true })).toContainText(/\d+/);
  });

  test('can view cart with items', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.locator('h1:has-text("Your cart")')).toBeVisible();
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('can remove item from cart', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.locator('article')).toHaveCount(1);
    await page.getByRole('button', { name: 'Remove item' }).first().click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('can go through checkout flow (cash on delivery)', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue(/Khách|hà|ng|1/);
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.locator('h1:has-text("Payment successful")')).toBeVisible();
    await expect(page.getByText(/Order #/)).toBeVisible();
  });

  test('can view order detail after purchase', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.locator('h1:has-text("Payment successful")')).toBeVisible();
    await page.getByRole('button', { name: 'View order' }).click();
    await expect(page.locator('h1:has-text("Order #")')).toBeVisible();
    await expect(page.getByText('Order progress')).toBeVisible();
    await expect(page.getByText('Items')).toBeVisible();
  });

  test('order appears in order history', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page.locator('h1:has-text("Payment successful")')).toBeVisible();
    await page.getByRole('link', { name: 'Continue shopping' }).click();
    await page.getByRole('link', { name: 'My account' }).first().click();
    await page.getByRole('link', { name: 'My orders' }).click();
    await expect(page.locator('h1:has-text("My orders")')).toBeVisible();
    await expect(page.getByText(/Order #\d+/)).toBeVisible({ timeout: 10000 });
  });
});
