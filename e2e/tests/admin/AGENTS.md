<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# admin

## Purpose

Admin console specs. Playwright project name `admin` (`testMatch: tests/admin/**/*.spec.ts`).

## Key Files

| File | Description |
|---|---|
| `helpers.ts` | `loginAsAdmin(page)` — POSTs to `https://staging-admin-online-market.jadt.io.vn/api/auth/login` inside `page.evaluate`, writes `AccessToken`/`RefreshToken` into `sessionStorage` under `store_admin_access_token` / `store_admin_refresh_token` (the exact keys the admin SPA reads), then navigates to `/dashboard`. Also exports `ADMIN_BASE_URL` and `CUSTOMER_BASE_URL`. |
| `auth.spec.ts` | Login page loads; API login reaches the dashboard; admin user info shows in the header. |
| `auth-api.spec.ts` | Live auth API flow — login returns access + refresh tokens, access token accepted by `/api/auth/me`, refresh endpoint returns a new pair, invalid/missing credentials return 400. Then the SPA-level flow: authenticate and load the dashboard, authenticated API calls after login, transparent token refresh. |
| `dashboard.spec.ts` | Stats cards, revenue and orders charts, needs-attention section, top products, daily performance table. |
| `catalog.spec.ts` | Products list and stock indicators; inventory stock table; customers CRM list; categories, suppliers, promotions pages. |
| `orders.spec.ts` | Orders page loads with an order list; table has customer/channel/payment/status columns; filter orders by channel. |
| `finance-admin.spec.ts` | Bills page; refunds page with pending count; staff list; roles page; permissions matrix; AI chat page; agents page. |

## For AI Agents

### Working In This Directory

- The admin SPA is served from a **different host** than the customer SPA. `playwright.config.ts` only sets the customer `baseURL`, so any admin spec that navigates by relative path must use `ADMIN_BASE_URL` explicitly.
- `loginAsAdmin` stores tokens in `sessionStorage`. The admin `ApiClient` reads exactly these two keys — changing one side without the other silently breaks auth.
- The credentials in `helpers.ts` (`admin` / `123456`) are a staging throwaway account. Never point this at a real account.
- The admin API answers `400` for bad credentials, not `401` — the specs assert `400` on purpose.
- There are no `data-testid` attributes in the admin SPA. Assert on visible text, roles, and row counts.

### Testing Requirements

```bash
cd e2e
npx playwright test --project=admin
npx playwright test --project=admin --grep "auth"
```

- These specs create and mutate staging data (orders, refunds, stock). Expect the staging DB to drift between runs.
- `workers: 1` — do not raise it; the specs share one admin account and one cart.

### Common Patterns

- `await expect(locator).toBeVisible()` / `toHaveCount()` over sleeps.
- `page.waitForLoadState('networkidle')` after `page.goto` when the assertion depends on the API response landing.
- Page-level assertions in `auth.spec.ts` / `catalog.spec.ts` / `dashboard.spec.ts`; contract-level assertions in `auth-api.spec.ts`.

## Dependencies

### Internal

- `../../../frontend/` — admin SPA under test
- `../../../dotnet-backend/dotnet_backend/` — API under test
- `../../playwright.config.ts` — project definition

### External

- `@playwright/test` `^1.63.0`
- `https://staging-admin-online-market.jadt.io.vn`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
