import { type Page } from '@playwright/test';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';
const ADMIN_BASE_URL = 'https://staging-admin-online-market.jadt.io.vn';
const CUSTOMER_BASE_URL = 'https://staging-online-market.jadt.io.vn';

export async function loginAsAdmin(page: Page) {
  // Navigate first so fetch() runs with the staging origin (about:blank
  // has an opaque origin and the API gateway rejects it with Failed to fetch).
  await page.goto(`${ADMIN_BASE_URL}/`);
  await page.waitForLoadState('domcontentloaded');
  const resp = await page.evaluate(
    async ({ baseUrl, username, password }: { baseUrl: string; username: string; password: string }) => {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password }),
      });
      return r.json();
    },
    { baseUrl: ADMIN_BASE_URL, username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  );

  if (!resp.AccessToken || !resp.RefreshToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(resp)}`);
  }

  // Store tokens in sessionStorage — same mechanism the admin SPA ApiClient uses.
  await page.evaluate(
    ({ access, refresh }: { access: string; refresh: string }) => {
      sessionStorage.setItem('store_admin_access_token', access);
      sessionStorage.setItem('store_admin_refresh_token', refresh);
    },
    { access: resp.AccessToken, refresh: resp.RefreshToken },
  );

  await page.goto(`${ADMIN_BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
}

export { ADMIN_BASE_URL, CUSTOMER_BASE_URL };
