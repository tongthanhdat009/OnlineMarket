import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

test.describe('Customer storefront — auth', () => {
  test('login page loads and shows expected elements', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/login`);
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create one' })).toBeVisible();
  });

  test('can log in with valid credentials and land on home', async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.locator('h1:has-text("Good food")')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/login`);
    await page.getByLabel('Email').fill('kh1@mail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Should stay on login page with error
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 5000 });
  });
});
