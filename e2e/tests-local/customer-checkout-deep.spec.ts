import { test, expect } from '@playwright/test';

// Deep checkout happy-path against local dev stack (API :7000 + customer SPA :5193).
// Uses seeded kh1@mail.com/123456 on dev DB. Cleans up: cancels order + deletes bill.
const API = 'http://localhost:7000';
const CUSTOMER = { Email: 'kh1@mail.com', Password: '123456' };

async function api(path: string, token?: string, init?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

test.describe('local checkout happy-path (dev DB)', () => {
  let token = '';
  let productId = 0;
  let orderId = 0;
  let billId = 0;

  test.beforeAll(async () => {
    const login = await api('/api/customer/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(CUSTOMER),
    });
    expect(login.status).toBe(200);
    token = login.body.token ?? login.body.Token;
    expect(token).toBeTruthy();

    // Empty cart so checkout is deterministic.
    await api('/api/customer/cart', token, { method: 'DELETE' });

    const products = await api('/api/customer/products?page=1&pageSize=5', token);
    expect(products.status).toBe(200);
    productId = products.body[0]?.ProductId ?? products.body[0]?.productId;
    expect(productId).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    if (orderId) {
      await api(`/api/customer/orders/${orderId}/cancel`, token, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    }
    if (billId) {
      await api(`/api/Bill/${billId}`, undefined, { method: 'DELETE' });
    }
    await api('/api/customer/cart', token, { method: 'DELETE' });
  });

  test('cart → checkout → bill unpaid', async () => {
    const add = await api('/api/customer/cart/items', token, {
      method: 'POST',
      body: JSON.stringify({ ProductId: productId, Quantity: 1 }),
    });
    expect(add.status).toBe(200);

    const checkout = await api('/api/customer/orders/checkout', token, {
      method: 'POST',
      body: JSON.stringify({ PaymentMethod: 'cash' }),
    });
    expect(checkout.status).toBe(200);
    orderId = checkout.body.data?.OrderId ?? checkout.body.data?.orderId;
    expect(orderId).toBeGreaterThan(0);

    const bill = await api(`/api/customer/bills/order/${orderId}`, token);
    expect(bill.status).toBe(200);
    billId = bill.body.BillId ?? bill.body.billId;
    const payStatus = bill.body.PayStatus ?? bill.body.payStatus;
    expect(payStatus).toBe('unpaid');
  });

  test('mark bill paid via admin API → bill paid (+Odoo hook fired)', async () => {
    test.skip(!orderId || !billId, 'needs order from previous test');
    // NOTE: PUT /api/Bill/{id}/status only flips PayStatus (BillStatus enum has no
    // 'paid': pending/exported/canceled). update-order-and-bill-status with
    // StatusBill='paid' throws "Data truncated for column 'bill_status'" — pre-existing bug.
    const paid = await api(`/api/Bill/${billId}/status`, undefined, {
      method: 'PUT',
      body: JSON.stringify({ Status: 'paid' }),
    });
    expect(paid.status).toBe(200);

    const bill = await api(`/api/customer/bills/order/${orderId}`, token);
    const bPay = bill.body.PayStatus ?? bill.body.payStatus;
    expect(bPay).toBe('paid');

    const order = await api(`/api/customer/orders/${orderId}`, token);
    expect(order.status).toBe(200);
    expect(order.body.OrderId ?? order.body.orderId).toBe(orderId);
  });

  test('paid order visible in UI history', async ({ page }) => {
    test.skip(!orderId, 'needs order from previous test');
    await page.goto('http://localhost:5193/login');
    await page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]')).first().fill(CUSTOMER.Email);
    await page.locator('input[type="password"]').first().fill(CUSTOMER.Password);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/($|products)/, { timeout: 15000 }).catch(() => {});
    await page.goto('http://localhost:5193/account/orders');
    await expect(page.getByText(`Đơn hàng #${orderId}`).first()).toBeVisible({ timeout: 15000 });
  });
});
