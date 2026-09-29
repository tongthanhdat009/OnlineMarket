# Customer React Storefront Design

**Goal:** Tạo `frontend-customer/`, một storefront grocery React + TypeScript + Tailwind CSS mới, thay cho trải nghiệm customer Blazor đã bị loại bỏ, với catalog anonymous và commerce flow authenticated.

## Scope

- Phase triển khai trong app này: Home, catalog/search/category, product detail, auth, cart, checkout, payment result, orders/order detail, account profile/security, refund request, bills, AI assistant.
- `frontend/` là admin SPA và `frontend-customer/` là customer storefront; CORS/VNPay redirect backend đã được cập nhật.
- Browse catalog hoạt động anonymous. Cart, checkout, orders, account, refund, bills và AI mutations yêu cầu JWT customer.
- Backend JSON giữ PascalCase khi endpoint trả DTO; client normalize wrapper responses (`data`, `Items`, `TotalCount`) tại một nơi.
- Không tạo dữ liệu ranking/recommendation giả; Home chỉ derive từ catalog/categories.

## Recommended approach

Chọn Vite + React 19 + TypeScript + React Router + TanStack Query + Tailwind CSS 4 + Lucide React. Dùng một `apiClient` duy nhất cho base URL, bearer token, JSON, error mapping, retry 401 và binary download; domain adapters/hook nằm bên trên client. TanStack Query giữ server state; cart count và auth session có local context tối thiểu, không dùng localStorage làm source of truth cho customer profile.

Lý do: stack đã được dùng ổn định trong admin SPA nhưng app mới có route/layout/component boundary riêng; Query xử lý cache/invalidation khi quick-add/update cart, còn Tailwind 4 phù hợp setup Vite mới và responsive mobile-first.

## App architecture

```text
src/
  app/          router, providers, auth/cart/toast contexts
  api/          apiClient + domain adapters (auth, products, cart, orders, checkout, ai...)
  components/   shell, product, cart, checkout, order, account, feedback primitives
  layouts/      StoreLayout, AuthLayout, AccountLayout
  pages/        route-level screens
  hooks/        TanStack Query hooks and debounced search
  lib/          formatting, route guards, storage helpers
  types/        PascalCase transport models + view models
  styles.css    Tailwind theme and global accessibility styles
```

`StoreLayout` renders desktop header/category nav and mobile bottom nav. `AiAssistant` is global and opens a responsive drawer/modal. Product and cart components accept typed view models so API casing does not leak into presentational JSX.

## Routes

```text
/                         Home
/products                 Catalog + search/filter/sort
/products/:id             Product detail
/category/:id             Category catalog
/search?q=                Search catalog
/cart                     Cart
/checkout                 One-page checkout
/payment-result           VNPay result
/login                    Login
/register                 Register
/account                  Profile redirect
/account/profile          Profile
/account/security         Change password
/account/orders           Orders
/account/orders/:id       Order detail
/account/bills            Bills
/account/refunds          Refunds
```

Auth guard redirects protected routes to `/login?returnUrl=...`; guest can still browse. Login calls `/api/customer/auth/me` after token restore/login so server remains source of truth. Logout removes token and query cache.

## Data flow and API boundaries

- Products: `GET /api/customer/products`, `/search?keyword=${encodeURIComponent(...)}`, `/category/{id}`, `/categories`, `/{id}`. Search is debounced 350 ms; query key includes keyword/category.
- Cart: authenticated `/api/customer/cart/items`, `/total`, `/validate-checkout`; mutations invalidate items and total and show toast only after successful response. Error payloads map to field/item messages.
- Checkout: preview → optional promotion apply → validate checkout → checkout/order creation. Payment cash completes order; VNPay calls `/api/customer/vnpay/create-payment` and redirects to returned `PaymentUrl`.
- Orders: `/api/customer/orders/paged`, `/{id}`, `/{id}/orderitem-with-product`, `/{id}/invoice-pdf`, `/{id}/cancel`. Status labels/timeline are derived from known statuses and preserve unknown values as readable fallback.
- Account: `/api/customer/auth/me`, `/profile`, `/change-password`; bills `/api/customer/bills*`; refunds `/api/customerrefund*`; AI `/api/customer/ai/chat`, `/chat/stream`, `/add-to-cart`.
- Binary invoice responses use `Blob` and a safe filename. SSE parser accepts `data:` frames, handles `done`/`error`, and aborts on drawer close.

## UI and states

Visual system: fresh green primary, near-white canvas, white cards, dark neutral text, amber warnings, red sale/error. Inter/DM Sans fallback, 12px cards, 8–10px controls, 999px pills. Product grid is 2 columns mobile and 4+ desktop. Cart summary sticks to mobile bottom.

Every query/mutation has loading skeleton, empty state, actionable error/retry, and offline-safe copy. Product cards hide `Deleted`, disable add at `Quantity <= 0`, and use quantity control after add. Checkout validation renders separate out-of-stock, deleted, and price-changed notices; no generic success before API success.

## Verification

- `npm install` and `npm run build` from `frontend-customer/`.
- Focused Vitest tests for API error normalization, URL encoding, money/status helpers, auth guard and cart total invalidation.
- Manual `npm run dev` smoke: anonymous browse/search/category/detail; login; quick-add/update/remove; checkout cash/VNPay redirect; order detail/invoice; mobile viewport and keyboard focus.

## Out of scope

- Backend race-condition/stock transaction fixes, legacy cart deletion, order N+1 redesign, ranking service, and production deployment.
- Rebuilding the existing admin SPA.
