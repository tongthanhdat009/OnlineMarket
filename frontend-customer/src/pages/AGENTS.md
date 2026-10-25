<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# pages

## Purpose

Every storefront page, grouped into four files by area.

## Key Files

| File | Description |
|---|---|
| `CatalogPages.tsx` | 382 lines. `HomePage`, `ProductsPage` — home derives from catalog + categories, no fabricated ranking. |
| `CommercePages.tsx` | 616 lines. `ProductDetailPage`, `CartPage`, `CheckoutPage`, `OrdersPage`, `OrderDetailPage`, `PaymentResultPage`. |
| `AuthPages.tsx` | 414 lines. `LoginPage`, `RegisterPage`, `AccountProfilePage`, `SecurityPage`. |
| `AccountPages.tsx` | 188 lines. `BillsPage`, `RefundsPage`. |

## For AI Agents

### Working In This Directory

- Pages read through `../hooks/` and mutate through `apiClient` (`../api/client.ts`).
- Reuse the primitives in `../components/store-ui.tsx` — `ProductCard`, `ProductGrid`, `QuantityControl`, `CartLineRow`, `EmptyState`, `ErrorState`, `Money`. Do not hand-roll a card or a money formatter.
- User-facing strings come from `translator()` (`../lib/translator.ts`). Add a key there rather than inlining Vietnamese text.
- `HomePage` derives its content from the catalog and category list. Do not add ranking or recommendation data that the API does not return.
- `CheckoutPage` supports cash on delivery and VNPay; `PaymentResultPage` reads the return query params.
- `OrdersPage` / `OrderDetailPage` consume the merged shape from `useOrder` (the order and its items in one object) — do not issue a second fetch for the items.
- The account pages are mounted behind `ProtectedRoute`, so they may assume a signed-in customer.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run`.
- No page is unit-tested. The Playwright suite in `../../../e2e/tests/customer/` covers the storefront against staging.

### Common Patterns

- Loading / error / empty states use `ProductSkeleton`, `ErrorState` and `EmptyState`.
- Mobile-first: the storefront layout is a single column with a sticky cart bar.

## Dependencies

### Internal

- `../app/router.tsx` — where each page is mounted
- `../hooks/` — data hooks
- `../api/client.ts` — mutations
- `../components/store-ui.tsx` — UI primitives
- `../lib/` — formatting, translation, errors

### External

- React 19.3.0, @tanstack/react-query 5.104.0, react-router-dom 7.18.4

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
