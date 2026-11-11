import { test, expect } from '@playwright/test';

// Refund request flow against local dev stack (API :7000).
// Customer kh1 creates a pending refund for a completed order, admin sees it
// in the pending list, then the request is deleted. Cleanup: DELETE refund.
const API = 'http://localhost:7000';
const CUSTOMER = { Email: 'kh1@mail.com', Password: '123456' };
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

test.describe('refund request flow (dev DB)', () => {
  let customerToken = '';
  let adminToken = '';
  let refundId = 0;
  // Completed order of kh1 (customer_id=1) with no refund yet (dev seed).
  const orderId = 24;

  test.beforeAll(async () => {
    const c = await api('/api/customer/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(CUSTOMER),
    });
    expect(c.status).toBe(200);
    customerToken = c.body.token ?? c.body.Token;
    expect(customerToken).toBeTruthy();

    const a = await api('/api/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(ADMIN),
    });
    expect(a.status).toBe(200);
    adminToken = a.body.AccessToken ?? a.body.accessToken;
    expect(adminToken).toBeTruthy();
  });

  test.afterAll(async () => {
    if (refundId) {
      await api(`/api/refundrequest/${refundId}`, adminToken, { method: 'DELETE' });
    }
  });

  test('customer creates pending refund for completed order', async () => {
    const created = await api('/api/customerrefund', customerToken, {
      method: 'POST',
      body: JSON.stringify({ OrderId: orderId, RefundAmount: 100000, Reason: 'e2e-local-spec' }),
    });
    expect(created.status).toBe(201);
    refundId = created.body.RefundId ?? created.body.refundId;
    expect(refundId).toBeGreaterThan(0);
    const status = created.body.Status ?? created.body.status;
    expect(status).toBe('pending');
  });

  test('admin sees refund in pending list', async () => {
    test.skip(!refundId, 'needs refund from previous test');
    const list = await api(`/api/refundrequest/order/${orderId}`, adminToken);
    expect(list.status).toBe(200);
    const ids = (Array.isArray(list.body) ? list.body : []).map(
      (r: Record<string, unknown>) => r.RefundId ?? r.refundId,
    );
    expect(ids).toContain(refundId);
  });

  test('delete pending refund cleans up', async () => {
    test.skip(!refundId, 'needs refund from previous test');
    const del = await api(`/api/refundrequest/${refundId}`, adminToken, { method: 'DELETE' });
    expect(del.status).toBe(200);
    const gone = await api(`/api/refundrequest/${refundId}`, adminToken);
    expect(gone.status).toBe(404);
    refundId = 0;
  });
});
