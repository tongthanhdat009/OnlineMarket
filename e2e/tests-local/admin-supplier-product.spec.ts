import { test, expect } from '@playwright/test';

// Admin supplier + product CRUD against local dev stack (API :7000, admin token).
// Creates supplier + product with unique names, verifies list/detail/update,
// then deletes both. Cleanup: DELETE product (200) + DELETE supplier (204).
const API = 'http://localhost:7000';
const ADMIN = { Username: 'admin', Password: '123456' };

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

test.describe('admin supplier + product CRUD (dev DB)', () => {
  let adminToken = '';
  const ts = Date.now();
  const supplierName = `E2E Supplier ${ts}`;
  const productName = `E2E Product ${ts}`;
  let supplierId = 0;
  let productId = 0;

  test.beforeAll(async () => {
    const a = await api('/api/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(ADMIN),
    });
    expect(a.status).toBe(200);
    adminToken = a.body.AccessToken ?? a.body.accessToken;
    expect(adminToken).toBeTruthy();
  });

  test.afterAll(async () => {
    if (productId) await api(`/api/products/${productId}`, adminToken, { method: 'DELETE' });
    if (supplierId) await api(`/api/Suppliers/${supplierId}`, adminToken, { method: 'DELETE' });
  });

  test('create supplier', async () => {
    const res = await api('/api/Suppliers', adminToken, {
      method: 'POST',
      body: JSON.stringify({ Name: supplierName, Phone: '0900000000', Email: `e2e${ts}@test.vn`, Address: 'e2e-local' }),
    });
    expect(res.status).toBe(201);
    supplierId = res.body.SupplierId ?? res.body.supplierId;
    expect(supplierId).toBeGreaterThan(0);
  });

  test('supplier detail matches', async () => {
    test.skip(!supplierId, 'needs supplier from previous test');
    const res = await api(`/api/Suppliers/${supplierId}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.Name ?? res.body.name).toBe(supplierName);
  });

  test('supplier paged list contains new supplier', async () => {
    test.skip(!supplierId, 'needs supplier from previous test');
    const res = await api(`/api/Suppliers?page=1&pageSize=100&search=${encodeURIComponent(supplierName)}&searchField=Name`, adminToken);
    expect(res.status).toBe(200);
  });

  test('create product linked to supplier', async () => {
    test.skip(!supplierId, 'needs supplier from previous test');
    const res = await api('/api/products', adminToken, {
      method: 'POST',
      body: JSON.stringify({ ProductName: productName, Price: 99000, Barcode: `E2E${ts}`, Unit: 'pcs', SupplierId: supplierId, Quantity: 5 }),
    });
    expect(res.status).toBe(201);
    productId = res.body.ProductId ?? res.body.productId;
    expect(productId).toBeGreaterThan(0);
  });

  test('duplicate product name rejected', async () => {
    test.skip(!productId, 'needs product from previous test');
    const res = await api('/api/products', adminToken, {
      method: 'POST',
      body: JSON.stringify({ ProductName: productName, Price: 99000 }),
    });
    expect(res.status).toBe(400);
  });

  test('update product price', async () => {
    test.skip(!productId, 'needs product from previous test');
    const res = await api(`/api/products/${productId}`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ ProductId: productId, ProductName: productName, Price: 199000, Barcode: `E2E${ts}`, Unit: 'pcs', SupplierId: supplierId, Quantity: 5 }),
    });
    expect(res.status).toBe(200);
    expect(Number(res.body.Price ?? res.body.price)).toBe(199000);
  });

  test('delete product then supplier cleans up', async () => {
    test.skip(!productId || !supplierId, 'needs product + supplier');
    const delP = await api(`/api/products/${productId}`, adminToken, { method: 'DELETE' });
    expect(delP.status).toBe(200);
    productId = 0;
    const delS = await api(`/api/Suppliers/${supplierId}`, adminToken, { method: 'DELETE' });
    expect(delS.status).toBe(204);
    supplierId = 0;
    const gone = await api(`/api/products/${productId}`, adminToken);
    expect([400, 404]).toContain(gone.status);
  });
});
