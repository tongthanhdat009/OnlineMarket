<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# src

## Purpose

Customer storefront source. `main.tsx` mounts `QueryClientProvider` → `ToastProvider` → `LocaleProvider` → `AuthProvider` → `CartProvider` → `RouterProvider`.

## Key Files

| File | Description |
|---|---|
| `main.tsx` | Entry point. Query defaults match the admin app: `staleTime 30s`, `retry 1`, no refetch on focus; mutations never retry. |
| `styles.css` | Tailwind 4 entry + the storefront design tokens (`--color-store-*`). |
| `vite-env.d.ts` | Vite ambient types. |

## Subdirectories

| Directory | Purpose |
|---|---|
| `api/` | `CustomerApiClient` — the only transport (see `api/AGENTS.md`) |
| `app/` | Router, providers, shared app types (see `app/AGENTS.md`) |
| `components/` | Storefront UI primitives and the AI assistant (see `components/AGENTS.md`) |
| `hooks/` | Catalog and account query hooks (see `hooks/AGENTS.md`) |
| `layouts/` | `StoreLayout`, `AccountLayout`, `AuthLayout` (see `layouts/AGENTS.md`) |
| `lib/` | Errors, formatting, SSE, storage, translation, unwrap helpers (see `lib/AGENTS.md`) |
| `pages/` | Every page (see `pages/AGENTS.md`) |
| `types/` | Catalog, commerce, auth and AI types (see `types/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- This app has **no refresh token**. The customer token is a single string in `localStorage` under `customer_access_token`.
- There are no `data-testid` attributes anywhere in this app. Any E2E selector must be added first.
- Responses pass through `unwrapData` and errors through `normalizeError` (both in `lib/`). Do not touch `response.json()` directly.
- The customer API happens to return lower-case auth payloads and the client normalises them — do not generalise that to the rest of the contract, which is PascalCase.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run` — one-shot. Plain `npm test` is vitest in watch mode and never exits.

### Common Patterns

- Query keys are `[domain, ...args]`, e.g. `['products', { keyword, categoryId }]`.
- Pages read through `hooks/` and mutate through `api/client.ts`.

## Dependencies

### Internal

- `../AGENTS.md` — app-level architecture and gotchas
- `../../dotnet-backend/dotnet_backend/` — the API contract

### External

- React 19.3.0, react-router-dom 7.18.4, @tanstack/react-query 5.104.0, Tailwind 4.3.3, lucide-react 1.48.0, vitest 5.0.2

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
