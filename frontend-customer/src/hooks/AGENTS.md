<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# hooks

## Purpose

TanStack Query wrappers for the storefront. Two files, re-exported from `index.ts`.

## Key Files

| File | Description |
|---|---|
| `catalog.ts` | `useCatalog({ keyword, categoryId })`, `useDebouncedValue(value, delay = 350)`, `useProduct(productId)`, `useCategories()`. |
| `account.ts` | `useOrders(status?)`, `useOrder(orderId)`, `useBills()`, `useRefunds()`. |
| `index.ts` | Barrel — `export * from './catalog'; export * from './account';` |

## For AI Agents

### Working In This Directory

- Every hook calls one method on `apiClient` (`../api/client.ts`). A hook must not build a URL.
- `useCatalog` picks its endpoint by branch: keyword → `search`, else categoryId → `byCategory`, else `list`. The `queryKey` always contains both values, so the three branches do not share a cache entry.
- `useCatalog` filters out deleted products in `select` — the backend returns them, the hook hides them.
- `useDebouncedValue` is a plain `useState` + `setTimeout` pair, not a library hook. Use it for the search box.
- `useOrder` fetches the order and its items **in parallel** and merges them into one object with `OrderItems`. Keep that merge shape — the order detail page reads `OrderItems` off the result.
- `useProduct` and `useOrder` guard with `enabled:` on a valid numeric id.
- `staleTime` is set per hook where the data changes slowly: `useCatalog` 60 s, `useProduct` 120 s, `useCategories` 300 s, `useOrders` 20 s, `useBills` / `useRefunds` 30 s.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run`.
- No hook is unit-tested. Verify a new hook by rendering the page that uses it.

### Common Patterns

- `useQuery({ queryKey, queryFn, select?, enabled?, staleTime? })`.
- Mutations are not hooked here — pages call `apiClient` directly and invalidate queries via `useQueryClient()`.

## Dependencies

### Internal

- `../api/client.ts` — `apiClient`
- `../types/` — entity types

### External

- @tanstack/react-query 5.104.0, React 19.3.0

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
