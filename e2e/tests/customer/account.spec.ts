import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — account', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('can access account profile', async ({ page }) => {
    await page.getByRole('link', { name: 'Tài khoản của tôi' }).first().click();
    await expect(page).toHaveURL(/\/account\/profile/);
    await expect(page.getByLabel('Họ tên')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
  });

  test('bills page shows bill history', async ({ page }) => {
    await page.getByRole('link', { name: 'Tài khoản của tôi' }).first().click();
    await page.getByRole('complementary').getByRole('link', { name: 'Hóa đơn' }).click();
    await expect(page).toHaveURL(/\/account\/bills/);
    await expect(page.getByText(/Bill #|Chưa có hóa đơn/).first()).toBeVisible();
  });

  test('refunds page shows refund requests', async ({ page }) => {
    await page.getByRole('link', { name: 'Tài khoản của tôi' }).first().click();
    await page.getByRole('complementary').getByRole('link', { name: 'Hoàn tiền' }).click();
    await expect(page).toHaveURL(/\/account\/refunds/);
    await expect(page.getByText(/Refund #|Chưa có yêu cầu hoàn tiền/).first()).toBeVisible();
  });

  test('can sign out and back in', async ({ page }) => {
    await page.getByRole('button', { name: /Khách hàng 1/ }).hover();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    // Logout clears the session in place — header flips to anonymous.
    await expect(page.getByRole('link', { name: 'Đăng nhập' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Khách hàng 1/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Đăng nhập' }).first().click();
    await expect(page.locator('h1:has-text("Chào mừng trở lại")')).toBeVisible();
    await page.getByLabel('Email').fill('kh1@mail.com');
    await page.getByPlaceholder('Ít nhất 6 ký tự').fill('123456');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/');
    await expect(page.getByRole('button', { name: 'Mua sắm tất cả' }).first()).toBeVisible();
  });
});
