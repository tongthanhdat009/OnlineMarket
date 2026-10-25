<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# types

## Purpose

TypeScript types for the admin app. Two files, split by concern.

## Key Files

| File | Description |
|---|---|
| `api.ts` | 50 lines. Transport types: `JsonValue`, `ApiListResponse<T>`, `ApiListResult<T>`, `ListQuery`, `ApiErrorPayload`, `ApiTokenPair`, `ApiRequestOptions`. |
| `domain.ts` | 153 lines. Entity types: `Order`, `OrderItem`, `Payment`, `Product`, `Category`, `Supplier`, `Inventory`, `Customer`, `Promotion`, `Bill`, `RefundRequest`, `User`, `Role`, `Permission`, `RolePermission`, `DashboardStats`, `PeakTime`, `Agent`, `AgentRun`, `AgentActivity`, `AgentReport`, `AgentAnalytics`, plus the `withoutPassword()` helper. |

## For AI Agents

### Working In This Directory

- **Everything is PascalCase.** The backend sets `PropertyNamingPolicy = null`, so `ProductName`, `TotalCount` and `OrderId` are the wire names. The camelCase names in `api.ts` (`items`, `totalCount`, `page`, `pageSize`, `accessToken`) are the *client-normalised* shape returned by `normalizeListResponse` / `ApiTokenPair` — they are not the wire format.
- `api.ts` is for shapes that come from the transport layer; `domain.ts` is for business entities. A type belongs in `domain.ts` if the backend has a DTO for it.
- Many domain interfaces carry an index signature (`[key: string]: unknown`) because the backend returns extra fields. Keep it — removing it breaks every property access on the response.
- `withoutPassword<T>()` strips `Password` / `password` from a user-shaped object. `../auth/session.ts` has its own copy of that logic for the auth payload; keep both in mind when touching user data.
- `ListQuery` is an open record (`[key: string]: string | number | boolean | Date | undefined | null`) so paging, search and endpoint-specific filters can be passed through to the adapters without a new type each time.

### Testing Requirements

- `npm run build --prefix frontend` — `tsc -b` is the only check; these types are erased at runtime, so nothing else can fail.
- `npm test --prefix frontend -- --run`.

### Common Patterns

- `interface` over `type` for entity shapes; `type` for unions and aliases.
- Optional fields use `?` and nullable fields use `| null` — match the backend DTO exactly.
- A new DTO arrives: add it to `domain.ts`, then reference it from `../api/*.api.ts`. Do not inline the shape in an adapter.

## Dependencies

### Internal

- `../api/*.api.ts` — consumes these types
- `../lib/api-client.ts` — `ApiRequestOptions`, `ApiTokenPair`
- `../auth/session.ts` — `AuthUser`

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
