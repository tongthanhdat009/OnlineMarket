<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# app

## Purpose

Router, providers and the app-level type aliases.

## Key Files

| File | Description |
|---|---|
| `router.tsx` | 36 lines. Exports `appRoutes` and `ProtectedRoute`. Routes nest `StoreLayout` over the public pages and an `/account` subtree behind `ProtectedRoute` + `AccountLayout`. Unknown paths redirect to `/`. |
| `providers.tsx` | 321 lines. Four contexts: `ToastProvider` / `useToast`, `AuthProvider` / `useAuth`, `CartProvider` / `useCart`, `LocaleProvider` / `useLocale`. |
| `types.ts` | 18 lines. Domain aliases (`Product`, `Category`, `Customer`, `CartLine`, `Order`, `OrderLine`, `Refund`, `Bill`, `Supplier`) and the display helpers `productName`, `categoryName`, `supplierName`, `productInStock`. |
| `providers.test.tsx` | 73 lines — tests the provider tree. |

## For AI Agents

### Working In This Directory

- `ProtectedRoute` renders a skeleton while `isLoading`, otherwise redirects to `/login?returnUrl=<encoded>`, preserving path **and** query string. It has no "logged in users are blocked from `/login`" logic.
- `useAuth()`, `useCart()`, `useToast()` and `useLocale()` are exported from `providers.tsx` and consumed across the app. `useAuth` comes from here, not from a separate `auth/` folder — the admin app has one, this app does not.
- Provider order in `providers.tsx` matters: `ToastProvider` is outermost so any provider can raise a toast; `CartProvider` is innermost because it depends on the auth session.
- `types.ts` holds **aliases**, not new shapes. A new entity type belongs in `../types/`.

### Testing Requirements

```bash
npm test --prefix frontend-customer -- --run
```

- The suite opts into jsdom with a file-level `@vitest-environment jsdom` pragma — `vite.config.ts` sets no `test` block, so this is required.
- `npm run build --prefix frontend-customer`.

### Common Patterns

- `appRoutes` is a plain array of route objects consumed by `createBrowserRouter(appRoutes)` in `../main.tsx`.
- Route elements are components imported at the top of `router.tsx`, not lazy.

## Dependencies

### Internal

- `../main.tsx` — mounts the providers and the router
- `../layouts/StoreLayout.tsx`, `../layouts/AccountLayout.tsx` — the route shells
- `../pages/` — the page components referenced by the routes
- `../types/` — the source shapes behind the aliases in `types.ts`

### External

- react-router-dom 7.18.4, @tanstack/react-query 5.104.0, React 19.3.0

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
