# core

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-30 · **Updated:** 2026-10-30

## Purpose
Transport core of the customer SPA: `CustomerApiClient` (namespaced `fetch` wrapper) + pure URL/error/payload helpers. Domain files (`*.api.ts`) only build namespaces via `create*Namespace(client)`.

## Key Files
| File | Description |
|------|-------------|
| `client-core.ts` | `CustomerApiClient` (10 namespaces: auth/products/cart/inventory/promotions/orders/bills/payment/refunds/ai), `rawRequest`/`request`, bearer via `tokenProvider`, `API_BASE_URL` at module load |
| `http-utils.ts` | Pure helpers: `resolveApiBaseUrl` (empty→`/api`, `*/api` kept, else append), `requestUrl`, `parseErrorPayload`, `responseMessage`, `customerFromPayload`, `asId` (throws on non-positive int), `queryString` (skips empty) |

## For AI Agents

### Working In This Directory
- New endpoint = namespace method in `../<domain>.api.ts`, never a raw `fetch` in pages/hooks. `client.ts` re-exports this core; singleton `apiClient`/`customerApi` is the same object.
- `resolveApiBaseUrl` is the single normalisation point; changing `VITE_API_URL` needs dev-server restart (module-load const).
- Anonymous calls pass `{auth:false}`; `payment.create` delegates to the wired `orders` instance — keep that wiring.
- Errors via `ApiError` + `responseMessage` (Vietnamese fallback); responses via `unwrapData` in `../../lib/`.

### Testing Requirements
- `npm run build --prefix frontend-customer`; no suite covers this core directly (`../lib/foundation.test.ts` only).

## Dependencies

### Internal
- `../../lib/` — `getStoredToken`, `unwrapData`, `ApiError`, SSE parser
- `../../types/` — request/response shapes

## Manual Notes
