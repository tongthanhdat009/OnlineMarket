import { test, expect } from '@playwright/test';
import { loginAsCustomer, clearCart, CUSTOMER_BASE_URL } from './helpers';
import { loginAsAdmin, ADMIN_BASE_URL } from '../admin/helpers';

/**
 * Customer checkout E2E — verifies the live staging API cart → checkout → order flow.
 *
 * These tests exercise the real staging API through the browser:
 *  - Add product to cart via UI (which calls the cart API).
 *  - View cart (calls cart API).
 *  - Checkout with cash on delivery (calls order creation API).
 *  - Verify order appears in order history (calls orders API).
 *  - Verify the created order is visible in admin panel too.
 */
test.describe('Customer storefront — live checkout API flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);
  });
  test('add to cart API works through UI', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Click Add on the first product — this calls POST /api/customer/cart/items
    const addButton = page.locator('button:has-text("Thêm vào giỏ")').first();
    await addButton.click();

    // Cart link should now show a count
    await expect(page.getByRole('link', { name: 'Giỏ hàng', exact: true }).first()).toContainText(/\d+/);
  });

  test('cart API returns items after add', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Thêm vào giỏ")').first().click();

    // Navigate to cart — the cart page calls GET /api/customer/cart/items
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Giỏ hàng của bạn")')).toBeVisible();
    await expect(page.locator('text=Tạm tính')).toBeVisible();

    // Verify cart has at least one item row
    await expect(page.getByRole('button', { name: 'Xóa sản phẩm' }).first()).toBeVisible();
  });

  test('full checkout flow creates an order via API', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Add a product
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();

    // Go to cart and checkout
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await page.waitForLoadState('networkidle');

    // Checkout page should show — it calls the cart total API
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('button', { name: 'Đặt hàng' })).toBeVisible();

    // Place order — this calls POST /api/customer/orders/checkout
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Payment success page should show with the order id from the API in the URL
    await expect(page.locator('h1:has-text("Thanh toán thành công")')).toBeVisible();
    await expect(page).toHaveURL(/orderId=\d+/);
  });

  test('created order appears in order history API', async ({ page }) => {
    // First create an order
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const orderId = new URL(page.url()).searchParams.get('orderId');
    expect(orderId).toMatch(/\d+/);

    // Go to order history — calls GET /api/customer/orders
    await page.getByRole('button', { name: 'Xem đơn hàng' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Đơn hàng của tôi")')).toBeVisible();
    // The new order should appear in the list
    await expect(page.getByText(`Đơn hàng #${orderId}`)).toBeVisible({ timeout: 10000 });
  });

  test('order detail page shows API-fed data', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(page).toHaveURL(/payment-result/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const orderId = new URL(page.url()).searchParams.get('orderId');
    expect(orderId).toMatch(/\d+/);

    // View order — calls GET /api/customer/orders/{id}
    await page.goto(`${CUSTOMER_BASE_URL}/account/orders/${orderId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Chi tiết đơn hàng #")')).toBeVisible();
    await expect(page.getByText('Tiến trình đơn hàng')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sản phẩm' })).toBeVisible();
  });

  test('can remove cart item via API through UI', async ({ page }) => {
    await page.goto(`${CUSTOMER_BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Thêm vào giỏ")').first().click();
    await page.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await page.waitForLoadState('networkidle');

    // Cart should have one item
    await expect(page.getByRole('button', { name: 'Xóa sản phẩm' })).toHaveCount(1);

    // Remove — calls DELETE /api/customer/cart/items/{productId}
    await page.getByRole('button', { name: 'Xóa sản phẩm' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Giỏ hàng của bạn đang trống')).toBeVisible();
  });
});

test.describe('Customer storefront — API auth flow', () => {
  test('customer login API returns token', async ({ page }) => {
    await page.goto(CUSTOMER_BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const resp = await page.evaluate(
      async ({ baseUrl, email, password }: { baseUrl: string; email: string; password: string }) => {
        const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Email: email, Password: password }),
        });
        const json = await r.json();
        return { status: r.status, json };
      },
      { baseUrl: CUSTOMER_BASE_URL, email: 'kh1@mail.com', password: '123456' },
    );

    expect(resp.status).toBe(200);
    expect(resp.json.Token ?? resp.json.token).toBeTruthy();
    expect(resp.json.Customer ?? resp.json.customer).toBeTruthy();
    expect((resp.json.Customer ?? resp.json.customer).Email ?? (resp.json.Customer ?? resp.json.customer).email).toBe('kh1@mail.com');
  });

  test('customer access token is accepted by /api/customer/auth/me', async ({ page }) => {
    await page.goto(CUSTOMER_BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const tokens = await page.evaluate(
      async ({ baseUrl, email, password }: { baseUrl: string; email: string; password: string }) => {
        const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Email: email, Password: password }),
        });
        return r.json();
      },
      { baseUrl: CUSTOMER_BASE_URL, email: 'kh1@mail.com', password: '123456' },
    );

    const me = await page.evaluate(
      async ({ baseUrl, token }: { baseUrl: string; token: string }) => {
        const r = await fetch(`${baseUrl}/api/customer/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await r.json();
        return { status: r.status, json };
      },
      { baseUrl: CUSTOMER_BASE_URL, token: tokens.Token ?? tokens.token },
    );

    expect(me.status).toBe(200);
    expect(me.json.customerId).toBe(1);
    expect(me.json.email).toBe('kh1@mail.com');
  });

  test('invalid customer credentials return error', async ({ page }) => {
    await page.goto(CUSTOMER_BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const resp = await page.evaluate(
      async ({ baseUrl }: { baseUrl: string }) => {
        const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Email: 'kh1@mail.com', Password: 'wrongpassword' }),
        });
        const json = await r.json();
        return { status: r.status, json };
      },
      { baseUrl: CUSTOMER_BASE_URL },
    );

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
    const tokens = await customerPage.evaluate(
      async ({ baseUrl, email, password }: { baseUrl: string; email: string; password: string }) => {
        const r = await fetch(`${baseUrl}/api/customer/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Email: email, Password: password }),
        });
        return r.json();
      },
      { baseUrl: CUSTOMER_BASE_URL, email: 'kh1@mail.com', password: '123456' },
    );

    await customerPage.evaluate(
      ({ token }: { token: string }) => localStorage.setItem('customer_access_token', token),
      { token: tokens.Token ?? tokens.token },
    );

    await customerPage.goto(CUSTOMER_BASE_URL + '/products');
    await customerPage.waitForLoadState('networkidle');
    await customerPage.locator('button:has-text("Thêm vào giỏ")').first().click();
    await customerPage.getByRole('link', { name: 'Giỏ hàng' }).first().click();
    await customerPage.waitForLoadState('networkidle');
    await customerPage.getByRole('button', { name: 'Thanh toán' }).click();
    await customerPage.waitForLoadState('networkidle');
    await customerPage.getByRole('button', { name: 'Đặt hàng' }).click();
    await expect(customerPage).toHaveURL(/payment-result/, { timeout: 30000 });

    const orderId = new URL(customerPage.url()).searchParams.get('orderId');
    expect(orderId).toMatch(/\d+/);

    await customerPage.close();

    // Now verify it's visible in admin
    const adminPage = await browser.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto(`${ADMIN_BASE_URL}/orders`);
    await adminPage.waitForLoadState('networkidle');

    // The new order should appear in the list (admin UI shows the id as #<id>)
    await expect(adminPage.getByText(`#${orderId}`).first(), 'new order visible in admin').toBeVisible({ timeout: 15000 });
    await adminPage.close();
  });
});
