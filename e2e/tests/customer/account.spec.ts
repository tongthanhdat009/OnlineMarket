import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — account', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test('can access account profile', async ({ page }) => {
    await page.getByRole('link', { name: 'My account' }).first().click();
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('bills page shows bill history', async ({ page }) => {
    await page.getByRole('link', { name: 'My account' }).first().click();
    await page.getByRole('link', { name: 'Bills' }).click();
    await expect(page.locator('h1:has-text("Bills")')).toBeVisible();
  });

  test('refunds page shows refund requests', async ({ page }) => {
    await page.getByRole('link', { name: 'My account' }).first().click();
    await page.getByRole('link', { name: 'Refunds' }).click();
    await expect(page.locator('h1:has-text("Refunds")')).toBeVisible();
  });

  test('can sign out and back in', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign out' }).first().click();
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
    await page.getByLabel('Email').fill('kh1@mail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/');
    await expect(page.locator('h1:has-text("Good food")')).toBeVisible();
  });
});
