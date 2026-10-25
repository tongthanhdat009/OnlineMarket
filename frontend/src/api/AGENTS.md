<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# api

## Purpose

Transport adapters. One module per backend domain; every module exports a plain object of functions that call `apiClient`. `index.ts` re-exports all of them.

## Key Files

| File | Description |
|---|---|
| `index.ts` | Barrel — `export * from` for all 18 adapter modules |
| `products.api.ts` | Catalog: `list`, `pos`, `total`, `topProducts`, `byId`, `create`, `update`, `archive`, `uploadImage` (FormData) |
| `categories.api.ts`, `suppliers.api.ts` | Catalog reference data |
| `inventory.api.ts` | Stock levels |
| `orders.api.ts` | Order list, detail, status, cancel, pay, POS order creation |
| `customers.api.ts` | Customer list and detail |
| `bills.api.ts`, `promotions.api.ts`, `refunds.api.ts` | Finance and promotion endpoints |
| `dashboard.api.ts` | Dashboard stats and peak-time |
| `users.api.ts`, `roles.api.ts`, `permissions.api.ts` | RBAC administration |
| `auth.api.ts` | Admin login / refresh / me |
| `agents.api.ts` | Agent CRUD, runs, activity, tools, analytics, plus `streamActivity()` — an SSE reader over `api/admin/agent-activity/stream` that returns a cleanup function |
| `reports.api.ts` | Agent reports and auto-analysis status |
| `admin-ai.api.ts` | Admin AI chat |
| `admin-audit.api.ts` | Audit-log read API |

## For AI Agents

### Working In This Directory

- Every path is written as `api/<domain>/<path>` — **relative, no leading slash**. `ApiClient.url()` joins it to `VITE_API_URL`.
- Paths must match the backend route literally: the backend uses `api/[controller]` for most controllers (`api/Order`, `api/Bill`, `api/Cart`, `api/Role`, `api/Permissions`) and explicit literals elsewhere (`api/products`, `api/admin/ai`, `api/admin/agents`). Case matters.
- Response and request bodies are **PascalCase**. Do not camelCase a DTO field.
- List endpoints return `ApiListResult<T>` — `apiClient.list()` already normalises the backend's `PagedResultDto` or a bare array. Don't unwrap it again.
- `agents.api.ts` declares its own query types (`AgentRunQuery`, `AgentActivityQuery`) and a local `AgentTool` interface. Those are exported and consumed by `../hooks/index.ts`.
- `streamActivity` parses SSE frames manually and must return a cleanup function that aborts the reader. Callers rely on it to close the connection.

### Testing Requirements

- `npm run build --prefix frontend`.
- `npm test --prefix frontend -- --run`.
- No unit test exists for the adapters themselves — coverage is one file, `../lib/api-client.test.ts`.

### Common Patterns

- Each module exports a single const object: `export const productsApi = { … }`.
- Input types are declared next to the adapter (`ProductInput`, `SaveAgentInput`).
- `apiClient.list<T>(path, { page: 1, pageSize: 20, ...query })` — the default page size is set in the adapter, not at the call site.

## Dependencies

### Internal

- `../lib/api-client.ts` — `apiClient`, the only transport
- `../types/api.ts` — `ApiListResult`, `ListQuery`
- `../types/domain.ts` — entity types
- `../index.ts` — barrel consumed by `../hooks/index.ts`

### External

- None beyond the app's own types. This layer has no third-party dependency.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
