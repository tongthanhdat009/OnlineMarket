<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# customer

## Purpose

Storefront specs. Playwright project name `customer` (`testMatch: tests/customer/**/*.spec.ts`).

## Key Files

| File | Description |
|---|---|
| `helpers.ts` | `loginAsCustomer(page)` — POSTs to `https://staging-online-market.jadt.io.vn/api/customer/auth/login`, expects a single `Token` in the response, writes it to `localStorage` under `customer_access_token`, pre-fetches `/api/customer/auth/me` into `currentUser`, then navigates to `/`. Exports `CUSTOMER_BASE_URL`. |
| `login.spec.ts` | Login page renders its expected elements; valid credentials land on home; wrong password fails. |
| `catalog.spec.ts` | Home shows products and categories; browse the products page; product detail page; search. |
| `cart-checkout.spec.ts` | Add products to cart; view cart with items; remove an item; complete checkout with cash on delivery; view order detail after purchase; order appears in order history. |
| `account.spec.ts` | Account profile; bills history; refund requests; sign out and back in. |
| `checkout-api.spec.ts` | Live checkout API flow — add-to-cart API through the UI, cart API returns items, full checkout creates an order, the order appears in history, order detail page shows API-fed data, cart item removed via API. Then API auth flow: login returns a token, the token is accepted by `/api/customer/auth/me`, and the remaining auth assertions. |

## For AI Agents

### Working In This Directory

- The customer auth contract differs from admin: a single `Token`, stored in `localStorage` (not `sessionStorage`), under `customer_access_token`, with the profile in `currentUser`. There is no refresh token on this app.
- `loginAsCustomer` deliberately bypasses the login form — the helper calls the API and seeds storage. The `login.spec.ts` spec is the one that exercises the form itself.
- The `currentUser` prefetch in the helper is fire-and-forget (`fetch(...).then(...)` without `await`); a spec that immediately reads the header should assert on something else or wait for the API response.
- Checkout uses cash on delivery on purpose — it is the only path that does not need a real VNPay transaction.
- There are no `data-testid` attributes in the customer SPA. Assert on visible text and card counts.

### Testing Requirements

```bash
cd e2e
npx playwright test --project=customer
npx playwright test --project=customer --grep "checkout"
```

- These specs create real staging orders. The staging order list grows with every run; do not assert on absolute order counts.
- `workers: 1` — the specs share one customer account and one cart.

### Common Patterns

- `await expect(locator).toBeVisible()` on product cards, table rows and buttons.
- `page.waitForLoadState('networkidle')` after navigation when the assertion depends on a fetch landing.
- `page.evaluate` + `fetch` for API-level assertions against the absolute staging origin.

## Dependencies

### Internal

- `../../../frontend-customer/` — storefront SPA under test
- `../../../dotnet-backend/dotnet_backend/` — API under test
- `../../playwright.config.ts` — project definition and `baseURL`

### External

- `@playwright/test` `^1.63.0`
- `https://staging-online-market.jadt.io.vn`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
