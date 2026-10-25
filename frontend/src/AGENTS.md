<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# src

## Purpose

Admin SPA source. `main.tsx` mounts `QueryClientProvider` → `AuthProvider` → `RouterProvider`; `router.tsx` owns the whole route table.

## Key Files

| File | Description |
|---|---|
| `main.tsx` | Entry point. Query defaults: `staleTime 30s`, `retry 1`, `refetchOnWindowFocus false`; mutations never retry. |
| `router.tsx` | 83 lines, the entire route table, built eagerly (no `lazy()`). `AuthenticatedShell` redirects to `/login` when there is no user and no loading state. `page(name)` dispatches by string key and multiplexes several keys onto one component. |
| `styles.css` | Tailwind 4 entry + design tokens (`--color-leaf`, `--color-canvas`, …). |
| `vite-env.d.ts` | Vite ambient types. |

## Subdirectories

| Directory | Purpose |
|---|---|
| `api/` | One adapter module per backend domain, re-exported from `index.ts` (see `api/AGENTS.md`) |
| `auth/` | Session, auth context, permission checks (see `auth/AGENTS.md`) |
| `components/` | Shared UI primitives and the AI assistant widget (see `components/AGENTS.md`) |
| `hooks/` | TanStack Query wrappers, one per endpoint (see `hooks/AGENTS.md`) |
| `layouts/` | `AppShell` — sidebar, topbar, nav (see `layouts/AGENTS.md`) |
| `lib/` | `api-client.ts` — the only HTTP layer (see `lib/AGENTS.md`) |
| `pages/` | Every page in the app (see `pages/AGENTS.md`) |
| `types/` | Transport types and domain entities (see `types/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- The request path is `api/<domain>/<path>` — relative, **no leading slash**. `ApiClient.url()` joins it to `VITE_API_URL`.
- Response keys are **PascalCase**. The backend sets `PropertyNamingPolicy = null`.
- There are no `data-testid` attributes anywhere in this app. Any E2E selector must be added first.
- `api/` → `hooks/` → `pages/` is the fixed direction of dependency. A page never calls `apiClient` directly.

### Testing Requirements

- `npm run build --prefix frontend` (type check runs inside `build` via `tsc -b`).
- `npm test --prefix frontend -- --run` — one-shot. Plain `npm test` is vitest in watch mode and never exits.

### Common Patterns

- Query keys are `[domain, ...args]`, e.g. `['orders', query]`.
- List responses go through `normalizeListResponse`, which accepts a bare array or a `PagedResultDto` and returns one shape.

## Dependencies

### Internal

- `../AGENTS.md` — app-level architecture and gotchas
- `../../dotnet-backend/dotnet_backend/` — the API contract

### External

- React 19.3.0, react-router-dom 7.18.4, @tanstack/react-query 5.104.0, Tailwind 4.3.3, recharts 3.10.1, lucide-react 0.548.0, vitest 5.0.2

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
