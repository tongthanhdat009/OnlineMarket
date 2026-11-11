import { test, expect } from '@playwright/test';
import { loginAsCustomer, clearCart, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — cart and checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);
  });

  test('can add products to cart', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    const addButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addButton.click();
    await expect(page.getByRole('link', { name: 'Giỏ hàng', exact: true }).first()).toContainText(/\d+/);
  });

  test('can view cart with items', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await expect(page.locator('h1:has-text("Giỏ hàng của bạn")')).toBeVisible();
    await expect(page.locator('text=Tạm tính')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thanh toán' })).toBeVisible();
  });

  test('can remove item from cart', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await expect(page.getByRole('button', { name: 'Xóa sản phẩm' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Xóa sản phẩm' }).first().click();
    await expect(page.getByText('Giỏ hàng của bạn đang trống')).toBeVisible();
  });

  test('can go through checkout flow (cash on delivery)', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('button', { name: 'Đặt hàng' })).toBeVisible();
    await expect(page.getByLabel('Tên')).toHaveValue(/Khách|1/);
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await expect(page.locator('h1:has-text("Thanh toán thành công")')).toBeVisible();
    await expect(page).toHaveURL(/orderId=\d+/);
  });

  test('can view order detail after purchase', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await expect(page.locator('h1:has-text("Thanh toán thành công")')).toBeVisible();
    const orderId = new URL(page.url()).searchParams.get('orderId');
    expect(orderId).toMatch(/\d+/);
    await page.getByRole('button', { name: 'Xem đơn hàng' }).click();
    await expect(page.locator('h1:has-text("Đơn hàng của tôi")')).toBeVisible();
    await page.goto(`${CUSTOMER_BASE_URL}/account/orders/${orderId}`);
    await expect(page.locator('h1:has-text("Chi tiết đơn hàng #")')).toBeVisible();
    await expect(page.getByText('Tiến trình đơn hàng')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sản phẩm' })).toBeVisible();
  });

  test('order appears in order history', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await expect(page.locator('h1:has-text("Thanh toán thành công")')).toBeVisible();
    const orderId = new URL(page.url()).searchParams.get('orderId');
    expect(orderId).toMatch(/\d+/);
    await page.getByRole('button', { name: 'Xem đơn hàng' }).click();
    await expect(page.locator('h1:has-text("Đơn hàng của tôi")')).toBeVisible();
    await expect(page.getByText(`Đơn hàng #${orderId}`)).toBeVisible({ timeout: 10000 });
  });
});
