<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-29 | Updated: 2026-10-22 | Mode: create | Skill: init-deep -->

# frontend-customer

## Purpose

Customer storefront. package `online-market-customer`. React 19 + Vite 8 + TypeScript 7 + Tailwind 4 + react-router-dom 7 + TanStack Query 5.

Replaced the previous Blazor customer app (`a312b4f`); design of record is `docs/plans/2026-09-29-customer-react-storefront.md` and `docs/specs/2026-09-29-customer-react-storefront-design.md`.

## Key Files

| File                    | Description                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `package.json`          | `dev`/`build`/`preview`/`test` only — no `lint`, no `typecheck`. Node `>=20.19.0`             |
| `vite.config.ts`        | Port **5193**, proxies `/api` → `http://localhost:7000`. No `test` block                      |
| `.env.example`          | `VITE_API_URL=http://localhost:7000` (absolute — the deployed default)                        |
| `src/app/router.tsx`    | Route table + `ProtectedRoute`                                                                |
| `src/app/providers.tsx` | `ToastProvider`, `LocaleProvider`, `AuthProvider`, `CartProvider`                              |
| `src/api/client.ts`     | `CustomerApiClient` (480 lines) and `resolveApiBaseUrl`                                       |
| `src/lib/`              | `errors.ts`, `format.ts`, `sse.ts`, `storage.ts`, `translator.ts`, `unwrap.ts` — re-exported by `index.ts` |
| `src/hooks/`            | `catalog.ts`, `account.ts`, re-exported by `index.ts`                                         |

## Subdirectories

| Directory | Purpose |
|---|---|
| `src/` | Application source (see `src/AGENTS.md`) |
| `dist/` | Build output — generated, gitignored |

## Where to Look

| Task                  | Start here                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Add a page            | `src/pages/` (`CatalogPages`, `CommercePages`, `AccountPages`, `AuthPages`) + a route in `src/app/router.tsx` |
| Add an endpoint       | `src/api/client.ts` — one namespaced group per domain (`client.products`, `client.auth`, `client.cart`, …)    |
| Types                 | `src/types/` — `catalog.ts`, `commerce.ts`, `auth.ts`, `ai.ts`                                                |
| Storefront chrome     | `src/components/store-ui.tsx`, `src/layouts/StoreLayout.tsx`, `src/layouts/AccountLayout.tsx`                 |
| AI shopping assistant | `src/components/ai/AiAssistant.tsx` + `src/types/ai.ts` + `src/lib/sse.ts`                                    |
| UI copy (Vietnamese)  | `src/lib/translator.ts` — `TranslatorKey` + `translator()`                                                  |

## Architecture

`main.tsx` mounts `QueryClientProvider` → `ToastProvider` → `LocaleProvider` → `AuthProvider` → `CartProvider` → `RouterProvider`. Same query defaults as the admin app (`staleTime 30s`, `retry 1`, no refetch on focus).

Routes nest `StoreLayout` with `HomePage`, `products`, `products/:id`, `category/:id`, `search`, `cart`, `checkout`, `payment-result` and an `/account` subtree (`profile`, `security`, `orders`, `orders/:id`, `bills`, `refunds`). `/login` and `/register` sit outside, on `AuthLayout`. Unknown paths redirect to `/` — there is no 404 page.

`ProtectedRoute` renders a skeleton while `isLoading`, otherwise redirects to `/login?returnUrl=<encoded>` preserving path **and** query string.

## Conventions

- `resolveApiBaseUrl` (`api/client.ts:68-76`) is the single normalisation point: empty → `/api`, a value already ending in `/api` is left alone, anything else gets `/api` appended. Domain code never builds a URL by hand.
- `API_BASE_URL` is computed at **module load** (`:78`). Changing `VITE_API_URL` requires a dev-server restart, not just a reload.
- Anonymous endpoints are `{ auth: false }`. Everything else pulls the bearer from `tokenProvider`, which reads `getStoredToken()`.
- Responses pass through `unwrapData` and errors through `normalizeError`, both in `src/lib/`. Use them instead of touching `response.json()` directly.
- Storage keys are `customer_access_token` and `currentUser`, both `localStorage` (`lib/storage.ts:3-4`). This app has **no refresh token** — `setStoredToken(token)` takes a single string.

## Anti-Patterns

- There is **no `data-testid` anywhere in this app either.** Do not write an E2E selector against one that does not exist.
- Assuming camelCase. The customer API happens to return lower-case auth payloads and the client normalises them (`client.ts`), but the shared DTO contract is still PascalCase — do not generalise from the one auth shape.
- Adding a second fetch wrapper. `src/lib/` is the shared layer and `src/api/client.ts` is the only caller-facing client.
- Inlining Vietnamese strings in a component instead of adding a key to `src/lib/translator.ts`.

## For AI Agents

### Working In This Directory

- `src/hooks/` and `src/api/client.ts` are the only data entry points. A page must not build a URL or call `fetch`.
- Reuse the primitives in `src/components/store-ui.tsx` before writing a new card, quantity control or empty state.
- UI copy goes through `translator()` in `src/lib/translator.ts` — add a `TranslatorKey` instead of inlining Vietnamese text.
- There is no refresh token in this app. The token is one string in `localStorage` under `customer_access_token`.

### Testing Requirements

- `npm run build --prefix frontend-customer` — `tsc -b` runs inside the build.
- `npm test --prefix frontend-customer -- --run` — one-shot; plain `npm test` is vitest watch mode. The suites need jsdom via a file-level pragma.

### Common Patterns

- Responses go through `unwrapData`, errors through `normalizeError` — never touch `response.json()` directly.
- Query keys are `[domain, ...args]`; `useCatalog` always includes both `keyword` and `categoryId`.
- `ProtectedRoute` redirects with `?returnUrl=` preserving path and query string.

## Dependencies

### Internal

- `src/` — application source (see `src/AGENTS.md`)
- `../dotnet-backend/dotnet_backend/` — the API contract
- `../e2e/tests/customer/` — Playwright specs for this app

### External

- react 19.3.0, vite 8.3.1, typescript 7.0.2, react-router-dom 7.18.4, @tanstack/react-query 5.104.0, tailwindcss 4.3.3, lucide-react 1.48.0, vitest 5.0.2

## Gotchas

- **`npm test` is watch mode.** Use `npm test --prefix frontend-customer -- --run`. The suite is `src/lib/foundation.test.ts` plus `src/app/providers.test.tsx` and `src/components/StoreFront.test.tsx`, and it opts into jsdom with a file-level `@vitest-environment jsdom` pragma — required because `vite.config.ts` sets no `test` block.
- `.env.example` ships an **absolute** `VITE_API_URL=http://localhost:7000`, but the dev proxy already handles `/api`. A copied `.env` therefore bypasses the proxy and makes the app cross-origin, which the backend CORS allowlist only permits for `localhost`/`127.0.0.1` on :5193.
- `lib/sse.ts` backs the AI assistant's streaming. It is a long-lived connection like the admin agent stream; consumers need an explicit abort.
- The `/api` proxy makes dev same-origin, which is why a LAN-IP session usually appears to work. A production build has no proxy — `VITE_API_URL` must be absolute there.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
