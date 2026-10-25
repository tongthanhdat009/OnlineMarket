<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# api

## Purpose

The transport boundary. One client, one file.

## Key Files

| File | Description |
|---|---|
| `client.ts` | 480 lines. Exports `RequestOptions`, `OrderPageQuery`, `ApiClientOptions`, `resolveApiBaseUrl`, `API_BASE_URL`, the `CustomerApiClient` class and the singleton `apiClient` (also aliased as `customerApi`), plus `queryString`. |
| `index.ts` | Barrel — `export * from './client'`. |

## For AI Agents

### Working In This Directory

- `resolveApiBaseUrl(configured)` is the single normalisation point: empty → `/api`; a value already ending in `/api` is left alone; anything else gets `/api` appended.
- `API_BASE_URL` is computed at **module load**. Changing `VITE_API_URL` requires a dev-server restart, not just a reload.
- The client is organised as namespaces on the instance: `client.auth`, `client.products`, `client.cart`, `client.inventory`, `client.promotions`, `client.orders`, `client.bills`, `client.payment`, `client.refunds`, `client.ai`.
- Anonymous endpoints opt out with `{ auth: false }`. Everything else pulls the bearer from `tokenProvider`, which reads `getStoredToken()` (`../lib/storage.ts`).
- `client.ai.stream` is an async generator over the SSE response — consume it with `for await`, and abort it explicitly.
- `queryString` builds the query string; keyword searches are URL-encoded.
- Responses go through `unwrapData`, errors through `normalizeError` — both in `../lib/`.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run` — the suite is `../lib/foundation.test.ts`.
- No test covers `client.ts` directly.

### Common Patterns

- Domain code never builds a URL by hand — call the namespace method.
- `apiClient` is the exported singleton; `customerApi` is an alias of the same object. Use one name consistently.

## Dependencies

### Internal

- `../lib/storage.ts` — `getStoredToken`
- `../lib/unwrap.ts`, `../lib/errors.ts` — response and error normalisation
- `../lib/sse.ts` — the SSE frame parser used by `client.ai.stream`
- `../types/` — request and response types

### External

- None. Hand-rolled `fetch` — no axios.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
