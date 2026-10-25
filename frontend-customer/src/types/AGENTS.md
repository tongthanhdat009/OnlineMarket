<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# types

## Purpose

TypeScript types for the storefront. Four files plus a barrel.

## Key Files

| File | Description |
|---|---|
| `index.ts` | Barrel — re-exports the four type modules. |
| `catalog.ts` | 37 lines — `ProductDto`, `CategoryDto`, `SupplierDto`. |
| `commerce.ts` | 255 lines — `CartItemDto`, `OrderDto`, `OrderItemDto`, `BillDto`, `RefundRequestDto`, checkout/payment request and response shapes. |
| `auth.ts` | 48 lines — `CustomerInfo`, `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse`. |
| `ai.ts` | 72 lines — the AI assistant request/response and streaming payload types. |

## For AI Agents

### Working In This Directory

- The shared DTO contract is **PascalCase** — the backend sets `PropertyNamingPolicy = null`. The customer auth endpoint is the one exception (it returns lower-case payloads and the client normalises them); do not generalise that.
- `Dto` suffix marks a shape that mirrors a backend DTO. Types without it are app-local shapes.
- The aliases in `../app/types.ts` (`Product`, `Category`, `Order`, …) point at these DTOs — pages should import from `../app/types.ts` when they need the short name.
- A new backend DTO: add it to the matching file here, then reference it from `../api/client.ts`. Do not inline the shape in the client.

### Testing Requirements

- `npm run build --prefix frontend-customer` — `tsc -b` is the only check; these types are erased at runtime.
- `npm test --prefix frontend-customer -- --run`.

### Common Patterns

- `interface` for entity shapes, `type` for unions and aliases.
- Optional fields use `?`, nullable use `| null` — match the backend DTO exactly.
- Response envelopes (`{ data }`, `{ Items, TotalCount }`) are handled in `../lib/unwrap.ts` and `apiClient`, not in these types.

## Dependencies

### Internal

- `../api/client.ts` — request and response types
- `../app/types.ts` — short aliases over these types
- `../hooks/` — consumes them

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
