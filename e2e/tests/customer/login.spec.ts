import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — auth', () => {
  test('login page loads and shows expected elements', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/login`);
    await expect(page.locator('h1:has-text("Chào mừng trở lại")')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Ít nhất 6 ký tự')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tạo mới' })).toBeVisible();
  });

  test('can log in with valid credentials and land on home', async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByRole('button', { name: 'Mua sắm tất cả' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Giỏ hàng' }).first()).toBeVisible();
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/login`);
    await page.getByLabel('Email').fill('kh1@mail.com');
    await page.getByPlaceholder('Ít nhất 6 ký tự').fill('wrongpassword');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    // Should stay on login page with error
    await expect(page.locator('h1:has-text("Chào mừng trở lại")')).toBeVisible({ timeout: 5000 });
  });
});
