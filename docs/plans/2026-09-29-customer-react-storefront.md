# Customer React Storefront Implementation Plan

**Goal:** Build a standalone `frontend-customer/` React storefront that covers the approved grocery customer flow from anonymous discovery through authenticated cart, checkout, orders, account, refunds, bills, and AI assistance.

**Architecture:** Vite serves a React 19 TypeScript SPA. A single typed API client owns base URL, bearer token, JSON/error normalization, SSE, and invoice downloads; TanStack Query owns server state and invalidation. Store/auth UI contexts own only session and transient UI state. Route-level pages compose mobile-first reusable storefront components.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4 via `@tailwindcss/vite`, React Router 7, TanStack Query 5, Lucide React, Vitest.

## Global Constraints

- Create `frontend-customer/`; preserve unrelated uncommitted files, remove obsolete `BlazorApp/`, and update backend CORS/VNPay redirect configuration.
- Use customer routes `/api/customer/*` and actual refund route `/api/customerrefund`; never use legacy customer-id cart URLs.
- Preserve backend PascalCase DTO fields and encode search query with `encodeURIComponent`.
- Catalog is anonymous; protected cart/order/account/refund/bill/AI mutations require customer JWT and `GET /api/customer/auth/me` is source of truth after restore.
- Every async surface exposes loading, empty, error/retry, and success states; mutation success appears only after a successful response.

### Task 1: App scaffold and shared API foundation
**Files:** Create `frontend-customer/package.json`, lockfile via npm, Vite/TypeScript configs, `index.html`, `src/main.tsx`, `src/styles.css`, `src/types/*`, `src/lib/*`, `src/api/*`.
**Interfaces:**
- Produces `apiClient`, typed customer DTOs, `formatMoney`, `formatDate`, `normalizeError`, `getStoredToken`, `setStoredToken` for pages/hooks.
- API methods cover auth, products/categories, cart, orders/checkout, payment, bills, refunds, AI chat/stream/add-to-cart.
- [ ] Create Vite + React + TypeScript files and install latest compatible dependencies.
- [ ] Implement strict API client with `VITE_API_URL` support, `/api` relative default, bearer injection, non-2xx `ApiError`, JSON wrapper unwrapping, SSE parser, and Blob invoice download.
- [ ] Define PascalCase transport types and normalized view helpers.
- [ ] Add unit tests for URL encoding, error normalization, money formatting, and token storage.
- [ ] Run `npm install` then `npm run test -- --run`.

### Task 2: App state, routing, shell, and feedback primitives
**Files:** Create `src/app/*`, `src/layouts/*`, `src/components/shell/*`, `src/components/feedback/*`, `src/components/ui/*`, modify `src/main.tsx` and `src/styles.css`.
**Interfaces:**
- Consumes Task 1 API/types.
- Produces `StoreLayout`, `AuthLayout`, `AccountLayout`, `AuthProvider`, `CartProvider`, `ToastProvider`, `ProtectedRoute`, `QueryClient` setup.
- [ ] Implement session restore through `/api/customer/auth/me`, logout cache clearing, and protected route return URL.
- [ ] Implement desktop header/search/category nav, mobile bottom nav, cart badge, account menu, and global AI trigger.
- [ ] Implement toast, skeleton, empty, error, modal/drawer, quantity control primitives with keyboard focus and aria labels.

### Task 3: Catalog and product discovery
**Files:** Create `src/hooks/catalog.ts`, `src/components/catalog/*`, `src/pages/HomePage.tsx`, `src/pages/ProductsPage.tsx`, `src/pages/ProductDetailPage.tsx`.
**Interfaces:**
- Consumes product/category API and shell/cart context.
- Produces catalog query hooks and product card/grid used by home, search, category, detail.
- [ ] Implement anonymous home hero, category cards, available-now sections derived only from API products.
- [ ] Implement debounced 350ms search, category filtering, empty/error/retry, URL query state, deleted/out-of-stock rules, and quick add.
- [ ] Implement detail endpoint `/products/{id}`, quantity control, add/buy-now, metadata, and not-found state.

### Task 4: Auth, cart, checkout, payment
**Files:** Create `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `PaymentResultPage.tsx`, `src/components/cart/*`, `src/components/checkout/*`, `src/hooks/commerce.ts`.
**Interfaces:**
- Consumes session/cart/query primitives and Task 1 API.
- Produces invalidation-safe cart mutations and checkout flow.
- [ ] Implement login/register validation, server-session restore, redirect, and actionable errors.
- [ ] Implement protected cart with `/api/customer/cart/*`, optimistic-looking disabled controls only while pending, exact mutation errors, totals, and empty state.
- [ ] Implement one-page address/payment/promo form: preview → promotion → validate-checkout → checkout; render stock/deleted/price changes distinctly.
- [ ] Implement cash completion and VNPay URL redirect; payment-result success/failure without raw provider params.

### Task 5: Orders, account, bills, refunds, AI assistant
**Files:** Create `src/pages/OrdersPage.tsx`, `OrderDetailPage.tsx`, `AccountPage.tsx`, `BillsPage.tsx`, `RefundsPage.tsx`, `src/components/orders/*`, `src/components/account/*`, `src/components/ai/*`, `src/hooks/account.ts`, `src/hooks/ai.ts`.
**Interfaces:**
- Consumes authenticated APIs and global shell/feedback.
- Produces all protected route screens and global `AiAssistant`.
- [ ] Implement order cards/status filters/timeline, item detail, cancel gating, invoice Blob download.
- [ ] Implement profile/me, password change, bills/total spent, refund create/cancel with allowed-status rules.
- [ ] Implement anonymous AI chat and SSE stream, suggested products, authenticated add-to-cart/add-all, abort/error handling.

### Task 6: Verification and polish
**Files:** Modify only files above as needed; add focused tests under `src/**/*.test.ts(x)`.
- [ ] Run `npm run test -- --run` and `npm run build`.
- [ ] Fix TypeScript, route, responsive, and accessibility failures.
- [ ] Verify no customer API call uses legacy cart URLs or unencoded search keyword.
- [ ] Report exact changed files and checks.
