import { type Page } from '@playwright/test';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';
const ADMIN_BASE_URL = 'https://staging-admin-online-market.jadt.io.vn';
const CUSTOMER_BASE_URL = 'https://staging-online-market.jadt.io.vn';

export async function loginAsAdmin(page: Page) {
  const resp = await page.evaluate(async (baseUrl, username, password) => {
    const r = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Username: username, Password: password }),
    });
    return r.json();
  }, ADMIN_BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD);

  if (!resp.AccessToken || !resp.RefreshToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(resp)}`);
  }

  // Store tokens in sessionStorage — same mechanism the admin SPA ApiClient uses.
  await page.evaluate(
    (access, refresh) => {
      sessionStorage.setItem('store_admin_access_token', access);
      sessionStorage.setItem('store_admin_refresh_token', refresh);
    },
    resp.AccessToken,
    resp.RefreshToken,
  );

  await page.goto(`${ADMIN_BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
}

export { ADMIN_BASE_URL, CUSTOMER_BASE_URL };
