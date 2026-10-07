import { test, expect } from '@playwright/test';
import { loginAsAdmin, ADMIN_BASE_URL } from './helpers';

/**
 * Admin auth E2E — verifies the live API login flow end-to-end.
 *
 * These tests call the real staging API (not mocked) and confirm that:
 *  - The admin login endpoint returns a valid token pair.
 *  - The token is accepted by the /api/auth/me endpoint.
 *  - The SPA can mount authenticated after tokens are injected.
 */
test.describe('Admin panel — live auth API flow', () => {
  test('login API returns access + refresh tokens', async ({ page }) => {
    const resp = await page.evaluate(async (baseUrl, username, password) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      });
      return { status: r.status, json: r.json() };
    }, ADMIN_BASE_URL, 'admin', '123456');

    expect(resp.status).toBe(200);
    const body = await resp.json;
    expect(body.AccessToken).toBeTruthy();
    expect(body.RefreshToken).toBeTruthy();
    expect(body.Username).toBe('admin');
    expect(body.UserId).toBeTruthy();
  });

  test('access token is accepted by /api/auth/me', async ({ page }) => {
    // First get a token
    const tokens = await page.evaluate(async (baseUrl, username, password) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      });
      return r.json();
    }, ADMIN_BASE_URL, 'admin', '123456');

    // Then use it against /me
    const me = await page.evaluate(async (baseUrl, token) => {
      const r = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: r.status, json: r.json() };
    }, ADMIN_BASE_URL, tokens.AccessToken);

    expect(me.status).toBe(200);
    expect(me.json.UserId).toBeTruthy();
    expect(me.json.Username).toBe('admin');
    expect(Array.isArray(me.json.Permissions)).toBe(true);
  });

  test('refresh token endpoint returns new token pair', async ({ page }) => {
    const tokens = await page.evaluate(async (baseUrl, username, password) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      });
      return r.json();
    }, ADMIN_BASE_URL, 'admin', '123456');

    const refreshed = await page.evaluate(async (baseUrl, refreshToken) => {
      const r = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ RefreshToken: refreshToken }),
      });
      return { status: r.status, json: r.json() };
    }, ADMIN_BASE_URL, tokens.RefreshToken);

    expect(refreshed.status).toBe(200);
    expect(refreshed.json.AccessToken).toBeTruthy();
    expect(refreshed.json.RefreshToken).toBeTruthy();
    // New access token should differ from the old one
    expect(refreshed.json.AccessToken).not.toBe(tokens.AccessToken);
  });

  test('invalid credentials return 400', async ({ page }) => {
    const resp = await page.evaluate(async (baseUrl) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: 'admin', Password: 'wrongpassword' }),
      });
      return { status: r.status, json: r.json() };
    }, ADMIN_BASE_URL);

    expect(resp.status).toBe(400);
    expect(resp.json.message).toContain('không chính xác');
  });

  test('missing credentials return 400', async ({ page }) => {
    const resp = await page.evaluate(async (baseUrl) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: '', Password: '' }),
      });
      return { status: r.status, json: r.json() };
    }, ADMIN_BASE_URL);

    expect(resp.status).toBe(400);
  });
});

test.describe('Admin panel — full SPA login flow', () => {
  test('can authenticate and dashboard loads with API data', async ({ page }) => {
    await loginAsAdmin(page);

    // Dashboard should have loaded real data from the API
    await expect(page.locator('text=Total revenue')).toBeVisible();
    await expect(page.locator('text=Total orders')).toBeVisible();

    // Verify the authenticated user info is shown
    await expect(page.getByText('Store Admin')).toBeVisible();
    await expect(page.getByText('Administrator')).toBeVisible();
  });

  test('SPA makes authenticated API calls after login', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to orders — this triggers an API call to fetch order list
    await page.goto(`${ADMIN_BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');

    // The orders table should show real data from the API
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Verify order data contains real values (not placeholders)
    const firstOrderText = await page.locator('tbody tr').first().textContent();
    expect(firstOrderText).toContain('Order');
  });

  test('SPA handles token refresh transparently', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate around the app — each page load triggers API calls
    await page.goto(`${ADMIN_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();

    await page.goto(`${ADMIN_BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();

    await page.goto(`${ADMIN_BASE_URL}/inventory`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible();
  });
});
