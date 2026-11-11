import { test, expect } from '@playwright/test';

// Promotion lifecycle + apply flow against local dev stack (API :7000, admin token).
// Creates 3 promos with unique codes, verifies fixed/percent math + validation
// errors, then deletes all. Cleanup: DELETE /api/Promotion/{id} (204).
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

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

test.describe('promotion apply flow (dev DB)', () => {
  let adminToken = '';
  const ts = Date.now();
  const fixedCode = `E2E_FIX_${ts}`;
  const pctCode = `E2E_PCT_${ts}`;
  const minCode = `E2E_MIN_${ts}`;
  const promoIds: number[] = [];

  test.beforeAll(async () => {
    const a = await api('/api/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(ADMIN),
    });
    expect(a.status).toBe(200);
    adminToken = a.body.AccessToken ?? a.body.accessToken;
    expect(adminToken).toBeTruthy();

    for (const dto of [
      { PromoCode: fixedCode, DiscountType: 'fixed', DiscountValue: 5000, Status: 'active', StartDate: today(), EndDate: plusDays(30), UsageLimit: 10, UsedCount: 0 },
      { PromoCode: pctCode, DiscountType: 'percent', DiscountValue: 10, Status: 'active', StartDate: today(), EndDate: plusDays(30), UsageLimit: 10, UsedCount: 0 },
      { PromoCode: minCode, DiscountType: 'fixed', DiscountValue: 1000, Status: 'active', StartDate: today(), EndDate: plusDays(30), UsageLimit: 10, UsedCount: 0, MinOrderAmount: 10000000 },
    ]) {
      const created = await api('/api/Promotion', adminToken, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      expect(created.status).toBe(201);
      const id = created.body.PromoId ?? created.body.promoId;
      expect(id).toBeGreaterThan(0);
      promoIds.push(id);
    }
  });

  test.afterAll(async () => {
    for (const id of promoIds) {
      await api(`/api/Promotion/${id}`, adminToken, { method: 'DELETE' });
    }
  });

  test('fixed promo applies exact discount amount', async () => {
    const res = await api('/api/Promotion/apply', adminToken, {
      method: 'POST',
      body: JSON.stringify({ PromoCode: fixedCode, TotalAmount: 200000 }),
    });
    expect(res.status).toBe(200);
    const amt = res.body.DiscountAmount ?? res.body.discountAmount;
    expect(Number(amt)).toBe(5000);
  });

  test('percent promo applies proportional discount', async () => {
    const res = await api('/api/Promotion/apply', adminToken, {
      method: 'POST',
      body: JSON.stringify({ PromoCode: pctCode, TotalAmount: 200000 }),
    });
    expect(res.status).toBe(200);
    const amt = res.body.DiscountAmount ?? res.body.discountAmount;
    expect(Number(amt)).toBe(20000);
  });

  test('unknown code returns 404', async () => {
    const res = await api('/api/Promotion/apply', adminToken, {
      method: 'POST',
      body: JSON.stringify({ PromoCode: `NOPE_${ts}`, TotalAmount: 200000 }),
    });
    expect(res.status).toBe(404);
  });

  test('order below minimum returns 400', async () => {
    const res = await api('/api/Promotion/apply', adminToken, {
      method: 'POST',
      body: JSON.stringify({ PromoCode: minCode, TotalAmount: 100000 }),
    });
    expect(res.status).toBe(400);
  });

  test('invalid discount type rejected on create', async () => {
    const res = await api('/api/Promotion', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        PromoCode: `E2E_BAD_${ts}`, DiscountType: 'bogus', DiscountValue: 5,
        Status: 'active', StartDate: today(), EndDate: plusDays(30),
      }),
    });
    expect(res.status).toBe(400);
  });
});
