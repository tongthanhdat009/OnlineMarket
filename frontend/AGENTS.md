<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-29 | Updated: 2026-10-22 | Mode: create | Skill: init-deep -->

# frontend

## Purpose

Admin SPA. package `store-admin-frontend`. React 19 + Vite 8 + TypeScript 7 + Tailwind 4 + react-router-dom 7 + TanStack Query 5 + Recharts.

## Key Files

| File                       | Description                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`             | `dev`/`build`/`preview`/`test` only — **no `lint` and no `typecheck` script**. Type checking happens inside `build` via `tsc -b`. Node `>=20.19.0` |
| `vite.config.ts`           | Port **5173**, proxies `/api` → `http://localhost:7000`. No `test` block, so vitest runs on its defaults                                           |
| `.env.example`             | `VITE_API_URL=/api`                                                                                                                                |
| `src/router.tsx`           | The whole route table, built eagerly — no `lazy()` anywhere                                                                                        |
| `src/pages/AdminPages.tsx` | **1172 lines holding every page in the app**                                                                                                        |
| `src/lib/api-client.ts`    | `ApiClient`, `BrowserTokenStore`, `ApiError`, `normalizeListResponse`                                                                              |
| `src/auth/`                | `AuthContext.tsx` (React context), `session.ts` (network + types), `permissions.ts` (`can`/`canAny`/`canAll` + a permission-name map)              |
| `tsconfig.app.json`        | `strict: true`, `noEmit`, `moduleResolution: "Bundler"`, `jsx: "react-jsx"`                                                                        |

## Subdirectories

| Directory | Purpose |
|---|---|
| `src/` | Application source (see `src/AGENTS.md`) |
| `dist/` | Build output — generated, gitignored |

## Where to Look

| Task                 | Start here                                                                      |
| -------------------- | ------------------------------------------------------------------------------- |
| Add or change a page | `src/pages/AdminPages.tsx` + a route in `src/router.tsx`                        |
| Add an endpoint call | `src/api/<domain>.api.ts`, then re-export from `src/api/index.ts`               |
| Add a query hook     | `src/hooks/index.ts` (one `useQuery` wrapper per endpoint, key = domain + args) |
| Types                | `src/types/api.ts` (transport) and `src/types/domain.ts` (entities)             |
| Charts               | Recharts, used from the dashboard page                                          |
| Shell / nav          | `src/layouts/AppShell.tsx`                                                      |

## Architecture

`main.tsx` mounts `QueryClientProvider` → `AuthProvider` → `RouterProvider`. Query defaults: `staleTime 30s`, `retry 1`, `refetchOnWindowFocus false`; mutations never retry.

Routes are a flat list under `/login` and a single authenticated `/` branch wrapped in `AuthenticatedShell` (`router.tsx:8-24`), which reads `useAuth()` and hands `permissions` and `user` to `AppShell`. It **does** redirect to `/login` when there is no user and the session is not loading (`router.tsx:12-14`) — but `/login` is not blocked for a logged-in user.

The router dispatches pages by **string key** (`router.tsx:27-44`): `page('dashboard')`, `page('ai-chat')`, `page('admin-users')`. Several branches multiplex on the key: one `ListPage type=` for five catalog/ops routes, `AiPage page=` for every `ai-` route, `AdminPage page=` for `admin-`, customers and customer-detail sharing `CustomersPage`, and a `PlaceholderPage` for anything unmatched. Adding a page means editing this one function, not creating a route module.

## Conventions

- Call the API as `api/<domain>/<path>` — relative, no leading slash. `ApiClient.url()` (`api-client.ts:226-235`) joins it to `VITE_API_URL` and strips a duplicated `/api` segment.
- Read response keys as **PascalCase**. The API sets `PropertyNamingPolicy = null`.
- List responses go through `normalizeListResponse` (`api-client.ts:136`); it accepts both a bare array and a `PagedResultDto` and returns one shape.
- Auth: `login()`/`getCurrentUser()` in `auth/session.ts`, state in `auth/AuthContext.tsx`. Tokens are stored in `sessionStorage` under `store_admin_access_token` / `store_admin_refresh_token` with an in-memory fallback when storage is unavailable.

## Anti-Patterns

- **Do not add a `data-testid` convention from memory — there is none.** `grep -r data-testid src` returns zero hits across the whole app. Any E2E selector you write has to go in first.
- Do not convert a DTO field to camelCase. `normalizeAuthUser` (`auth/session.ts:37`) defensively accepts both, but the backend only ever sends PascalCase.
- Do not return an entity graph from an endpoint and rely on `ReferenceHandler.IgnoreCycles`. The client will happily parse a shape nothing else in the app expects.
- Do not add a second HTTP wrapper. `src/lib/api-client.ts` is the only `fetch` caller.

## For AI Agents

### Working In This Directory

- `src/api/` → `src/hooks/` → `src/pages/` is the dependency direction. A page never calls `apiClient` directly.
- Adding a page means adding an export to `src/pages/AdminPages.tsx` and a route to `src/router.tsx` — the router dispatches by string key, not by route module.
- Reuse the primitives in `src/components/primitives.tsx` before writing a new table, drawer or dialog.
- Response keys are PascalCase and request paths are relative (`api/<domain>/<path>`).

### Testing Requirements

- `npm run build --prefix frontend` — `tsc -b` runs inside the build.
- `npm test --prefix frontend -- --run` — one-shot; plain `npm test` is vitest watch mode.
- One known-failing test on `main` for an env reason — see Gotchas.

### Common Patterns

- Query keys are `[domain, ...args]` and must contain every input the query depends on.
- Mutations invalidate via `useQueryClient().invalidateQueries({ queryKey })` with the same key shape.
- Loading / error / empty states come from `Skeleton`, `ErrorState` and `EmptyState`.

## Dependencies

### Internal

- `src/` — application source (see `src/AGENTS.md`)
- `../dotnet-backend/dotnet_backend/` — the API contract (PascalCase JSON)
- `../e2e/tests/admin/` — Playwright specs for this app

### External

- react 19.3.0, vite 8.3.1, typescript 7.0.2, react-router-dom 7.18.4, @tanstack/react-query 5.104.0, tailwindcss 4.3.3, recharts 3.10.1, lucide-react 0.548.0, vitest 5.0.2

## Gotchas

- **The suite is currently red on `main`, for an environment reason, not a code one.** `src/lib/api-client.test.ts` asserts the request URL is `/api/order/dashboard-stats`, but a local `.env` sets `VITE_API_URL=http://localhost:7000` and vitest loads it, so the client builds an absolute URL and the assertion sees `http://localhost:7000/api/order/dashboard-stats`. `.env` is gitignored, which is why CI-shaped runs and a fresh clone behave differently from a local working copy. Expect 3 passed / 1 failed until either the test is made env-independent or `.env` drops the override.
- **`npm test` is `vitest` in watch mode.** It never exits. Use `npm test --prefix frontend -- --run` for a one-shot run. Coverage is one file, `src/lib/api-client.test.ts` (113 lines) — and since `vite.config.ts` sets no `test` block, that suite runs in the **node** environment, not jsdom. The customer app's suite instead opts into jsdom with a file-level `@vitest-environment jsdom` pragma.
- A `401` triggers exactly one refresh-and-retry (`api-client.ts:313`), and refresh itself is de-duplicated through `refreshInFlight`. Requests to `/api/auth/login` and `/api/auth/refresh` are excluded. If retry-once is not enough, the client calls `onSessionExpired` and gives up.
- **Base URL default is `""`, not `/api` (`api-client.ts:214`).** With no `.env`, requests go to `/api/<path>` on the current origin, which the Vite proxy forwards. In a production build there is no proxy — set `VITE_API_URL` to an absolute origin or every call 404s.
- `api-client.ts` is 445 lines of hand-rolled fetch. There is no axios, no react-query query-default fetcher and no retry/backoff library; `request` and `requestRaw` (`:278`, `:333`) are near-duplicates by design, because `requestRaw` must not consume the body — the agent SSE reader needs the stream.
- The backend CORS allowlist covers `localhost` and `127.0.0.1` on :5173 only. Opening the dev server via a LAN IP makes login fail with no on-screen error.
- `permissions.ts` is a UX filter only. The backend enforces permissions on the agent and AI endpoints alone.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
