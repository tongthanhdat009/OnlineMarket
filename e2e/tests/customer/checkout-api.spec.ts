import { test, expect } from '@playwright/test';
import { loginAsCustomer, CUSTOMER_BASE_URL } from './helpers';

/**
 * Customer checkout E2E — verifies the live API cart → checkout → order flow.
 *
 * These tests exercise the real staging API through the browser:
 *  - Add product to cart via UI (which calls the cart API).
 *  - View cart (calls cart API).
 *  - Checkout with cash on delivery (calls order creation API).
 *  - Verify order appears in order history (calls orders API).
 *  - Verify the created order is visible in admin panel too.
 */
test.describe('Customer storefront — live checkout API flow', () => {
  test('add to cart API works through UI', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Click Add on the first product — this calls POST /api/customer/cart/items
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    // Cart link should now show a count
    await expect(page.getByRole('link', { name: 'Cart', exact: true })).toContainText(/\d+/);
  });

  test('cart API returns items after add', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Add")').first().click();

    // Navigate to cart — the cart page calls GET /api/customer/cart/items
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Your cart")')).toBeVisible();
    await expect(page.locator('text=Subtotal')).toBeVisible();

    // Verify cart has at least one item row
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('full checkout flow creates an order via API', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Add a product
    await page.locator('button:has-text("Add")').first().click();

    // Go to cart and checkout
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.waitForLoadState('networkidle');

    // Checkout page should show — it calls the cart total API
    await expect(page.locator('h1:has-text("Checkout")')).toBeVisible();

    // Place order — this calls POST /api/customer/orders/checkout
    await page.getByRole('button', { name: 'Place order' }).click();
    await page.waitForLoadState('networkidle');

    // Payment success page should show the order number from the API response
    await expect(page.locator('h1:has-text("Payment successful")')).toBeVisible();
    await expect(page.getByText(/Order #/)).toBeVisible();
  });

  test('created order appears in order history API', async ({ page }) => {
    // First create an order
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Place order' }).click();
    await page.waitForLoadState('networkidle');

    const orderNumber = await page.locator('text=Order #').first().textContent();
    expect(orderNumber).toContain('#');

    // Go to order history — calls GET /api/customer/orders
    await page.getByRole('link', { name: 'Continue shopping' }).click();
    await page.getByRole('link', { name: 'My account' }).first().click();
    await page.getByRole('link', { name: 'My orders' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("My orders")')).toBeVisible();
    // The new order should appear in the list
    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 10000 });
  });

  test('order detail page shows API-fed data', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Place order' }).click();
    await page.waitForLoadState('networkidle');

    // View order — calls GET /api/customer/orders/{id}
    await page.getByRole('button', { name: 'View order' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Order #")')).toBeVisible();
    await expect(page.getByText('Order progress')).toBeVisible();
    await expect(page.getByText('Items')).toBeVisible();
  });

  test('can remove cart item via API through UI', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Add")').first().click();
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.waitForLoadState('networkidle');

    // Cart should have one item
    await expect(page.locator('article')).toHaveCount(1);

    // Remove — calls DELETE /api/customer/cart/items/{productId}
    await page.getByRole('button', { name: 'Remove item' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});

test.describe('Customer storefront — API auth flow', () => {
  test('customer login API returns token', async ({ page }) => {
    const resp = await page.evaluate(async (baseUrl, email, password) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      return { status: r.status, json: r.json() };
    }, CUSTOMER_BASE_URL, 'kh1@mail.com', '123456');

    expect(resp.status).toBe(200);
    expect(resp.json.Token).toBeTruthy();
    expect(resp.json.Customer).toBeTruthy();
    expect(resp.json.Customer.Email).toBe('kh1@mail.com');
  });

  test('customer access token is accepted by /api/customer/auth/me', async ({ page }) => {
    const tokens = await page.evaluate(async (baseUrl, email, password) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      return r.json();
    }, CUSTOMER_BASE_URL, 'kh1@mail.com', '123456');

    const me = await page.evaluate(async (baseUrl, token) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: r.status, json: r.json() };
    }, CUSTOMER_BASE_URL, tokens.Token);

    expect(me.status).toBe(200);
    expect(me.json.customerId).toBe(1);
    expect(me.json.email).toBe('kh1@mail.com');
  });

  test('invalid customer credentials return error', async ({ page }) => {
    const resp = await page.evaluate(async (baseUrl) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: 'kh1@mail.com', Password: 'wrongpassword' }),
      });
      return { status: r.status, json: r.json() };
    }, CUSTOMER_BASE_URL);

    expect(resp.status).toBe(400);
    expect(resp.json.message).toBeTruthy();
  });
});

test.describe('Customer storefront — cross-role visibility', () => {
  test('order created by customer is visible in admin orders list', async ({ page, browser }) => {
    // Create a customer order
    const customerPage = await browser.newPage();
    await customerPage.goto(CUSTOMER_BASE_URL);
    await customerPage.waitForLoadState('networkidle');

    // Login via API injection
    const tokens = await customerPage.evaluate(async (baseUrl, email, password) => {
      const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });
      return r.json();
    }, CUSTOMER_BASE_URL, 'kh1@mail.com', '123456');

    await customerPage.evaluate(
      (token) => localStorage.setItem('customer_access_token', token),
      tokens.Token,
    );

    await customerPage.goto(CUSTOMER_BASE_URL + '/products');
    await customerPage.waitForLoadState('networkidle');
    await customerPage.locator('button:has-text("Add")').first().click();
    await customerPage.getByRole('link', { name: 'Cart' }).click();
    await customerPage.waitForLoadState('networkidle');
    await customerPage.getByRole('button', { name: 'Checkout' }).click();
    await customerPage.waitForLoadState('networkidle');
    await customerPage.getByRole('button', { name: 'Place order' }).click();
    await customerPage.waitForLoadState('networkidle');

    const orderText = await customerPage.locator('text=Order #').first().textContent();
    const orderMatch = orderText?.match(/#(\d+)/);
    expect(orderMatch).toBeTruthy();
    const orderId = orderMatch?.[1];

    await customerPage.close();

    // Now verify it's visible in admin
    const adminPage = await browser.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto(`${ADMIN_BASE_URL}/orders`);
    await adminPage.waitForLoadState('networkidle');

    // The new order should appear in the list
    await expect(adminPage.getByText(new RegExp(`Order.*${orderId}`)), 'new order visible in admin').toBeVisible({ timeout: 15000 });
    await adminPage.close();
  });
});
