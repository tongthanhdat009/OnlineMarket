<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# lib

## Purpose

The HTTP layer. `api-client.ts` is the only place in the admin app that calls `fetch`.

## Key Files

| File | Description |
|---|---|
| `api-client.ts` | 445 lines. Exports `TokenStore`, `BrowserTokenStore`, `ApiError`, `ApiClientOptions`, `normalizeListResponse`, the `ApiClient` class (`get` / `post` / `put` / `patch` / `delete` / `list` / `request` / `requestRaw`), and the singleton `apiClient`. |
| `api-client.test.ts` | The app's only test file (113 lines). |

## For AI Agents

### Working In This Directory

- **Base URL**: `options.baseUrl ?? viteEnv?.VITE_API_URL ?? ""`. The default is `""`, **not** `/api`. With no `.env`, requests go to `/api/<path>` on the current origin, which the Vite proxy forwards. In a production build there is no proxy — `VITE_API_URL` must be an absolute origin or every call 404s.
- `url(path)` strips a duplicated `/api` segment: if the base already ends with `/api` and the path starts with `api/`, the path prefix is dropped. Paths are written **without** a leading slash (`api/order/dashboard-stats`).
- **Tokens**: `BrowserTokenStore` uses `sessionStorage` (`store_admin_access_token` / `store_admin_refresh_token`) with an in-memory `Map` fallback when storage is unavailable.
- **401 handling**: exactly one refresh-and-retry, de-duplicated through `refreshInFlight`. Requests to `/api/auth/login` and `/api/auth/refresh` are excluded (via `skipRefresh`). If the retry is not enough, `onSessionExpired` fires and the request gives up.
- `request` and `requestRaw` are near-duplicates **by design** — `requestRaw` must not consume the body, because the SSE reader in `../api/agents.api.ts` needs the stream. Don't merge them.
- `normalizeListResponse` accepts both a bare array and a `PagedResultDto` and returns one shape (`items`, `totalCount`, `page`, `pageSize`, `raw`). Use it for every list endpoint.
- `ApiError` carries the status code and the parsed error payload.

### Testing Requirements

```bash
npm test --prefix frontend -- --run
```

- **Known red test**: `api-client.test.ts` asserts the request URL is `/api/order/dashboard-stats`, but a local `.env` sets `VITE_API_URL=http://localhost:7000` and vitest loads it, so the client builds an absolute URL and the assertion sees `http://localhost:7000/api/order/dashboard-stats`. `.env` is gitignored, which is why CI-shaped runs behave differently from a local working copy. Expect 3 passed / 1 failed until the test is made env-independent or `.env` drops the override.
- `vite.config.ts` sets no `test` block, so this suite runs in the **node** environment, not jsdom.

### Common Patterns

- `apiClient.list<T>(path, query)` — merges the default `{ page: 1, pageSize: 20 }` and normalises the response.
- `apiClient.upload` style calls use `FormData` as the body; the client passes it through untouched so the browser sets the multipart boundary.

## Dependencies

### Internal

- `../types/api.ts` — `ApiTokenPair`, `ApiRequestOptions`, `ApiErrorPayload`
- `../auth/session.ts` — the only consumer of the token store besides the client itself

### External

- None. Hand-rolled `fetch` — no axios, no retry/backoff library.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
