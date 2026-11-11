import { type Page } from '@playwright/test';

const CUSTOMER_EMAIL = 'kh1@mail.com';
const CUSTOMER_PASSWORD = '123456';
const CUSTOMER_BASE_URL = 'https://staging-online-market.jadt.io.vn';

export async function loginAsCustomer(page: Page) {
  // Navigate first so fetch() runs with the staging origin (about:blank
  // has an opaque origin and the API gateway rejects it with Failed to fetch).
  await page.goto(`${CUSTOMER_BASE_URL}/`);
  await page.waitForLoadState('domcontentloaded');
  // Call the customer API directly to get a token, then store it.
  // This bypasses the SPA login form and avoids interaction issues.
  const resp = await page.evaluate(
    async ({ baseUrl, email, password }: { baseUrl: string; email: string; password: string }) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      return r.json();
    },
    { baseUrl: CUSTOMER_BASE_URL, email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
  );

  // Staging login answers lowercase { message, token, customer }.
  const token = resp.Token ?? resp.token;
  if (!token) {
    throw new Error(`Customer login failed: ${JSON.stringify(resp)}`);
  }

  // Store token + customer info synchronously in one evaluate call so nothing races
  // with navigation. The SPA reads from localStorage on mount.
  await page.evaluate(
    ({ token, baseUrl }: { token: string; baseUrl: string }) => {
      localStorage.setItem('customer_access_token', token);
      // Pre-fetch customer profile so AuthProvider does not need /me on mount.
      fetch(`${baseUrl}/api/customer/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((customer) => {
          localStorage.setItem('currentUser', JSON.stringify(customer));
        });
    },
    { token, baseUrl: CUSTOMER_BASE_URL },
  );

  await page.goto(`${CUSTOMER_BASE_URL}/`);
  await page.waitForLoadState('networkidle');
}

export async function clearCart(page: Page) {
  // Cart is shared by every spec (workers: 1, one staging account).
  // Empty it through the API so each cart test starts deterministic.
  await page.evaluate(
    async ({ baseUrl }: { baseUrl: string }) => {
      const token = localStorage.getItem('customer_access_token');
      await fetch(`${baseUrl}/api/customer/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    { baseUrl: CUSTOMER_BASE_URL },
  );
}

export { CUSTOMER_BASE_URL };
