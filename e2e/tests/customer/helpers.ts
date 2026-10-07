import { type Page } from '@playwright/test';

const CUSTOMER_EMAIL = 'kh1@mail.com';
const CUSTOMER_PASSWORD = '123456';
const CUSTOMER_BASE_URL = 'https://staging-online-market.jadt.io.vn';

export async function loginAsCustomer(page: Page) {
  // Call the customer API directly to get a token, then store it.
  // This bypasses the SPA login form and avoids interaction issues.
  const resp = await page.evaluate(async (baseUrl, email, password) => {
    const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: email, Password: password }),
    });
    return r.json();
  }, CUSTOMER_BASE_URL, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

  if (!resp.Token) {
    throw new Error(`Customer login failed: ${JSON.stringify(resp)}`);
  }

  // Store token + customer info synchronously in one evaluate call so nothing races
  // with navigation. The SPA reads from localStorage on mount.
  await page.evaluate((token, baseUrl) => {
    localStorage.setItem('customer_access_token', token);
    // Pre-fetch customer profile so AuthProvider does not need /me on mount.
    fetch(`${baseUrl}/api/customer/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((customer) => {
        localStorage.setItem('currentUser', JSON.stringify(customer));
      });
  }, resp.Token, CUSTOMER_BASE_URL);

  await page.goto(`${CUSTOMER_BASE_URL}/`);
  await page.waitForLoadState('networkidle');
}

export { CUSTOMER_BASE_URL };
