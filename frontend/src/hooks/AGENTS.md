<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# hooks

## Purpose

TanStack Query wrappers — one `useQuery` per endpoint, all in a single file.

## Key Files

| File | Description |
|---|---|
| `index.ts` | 94 lines, 19 hooks: `useDashboardStats`, `useDashboardPeakTime`, `useOrders`, `useOrder`, `useProducts`, `useInventory`, `useCustomers`, `usePromotions`, `useBills`, `useRefunds`, `useAgents`, `useAgentRuns`, `useAgentActivity`, `useAgentAnalytics`, `useReports`, `useAutoAnalysisStatus`, `useUsers`, `useRoles`, `usePermissions`. |

## For AI Agents

### Working In This Directory

- Every hook calls one function from `../api` and nothing else. A hook must not build a URL or touch `apiClient`.
- Query keys are `[domain, ...args]` — `['orders', query]`, `['agent-runs', query]`, `['agent-analytics', from, to]`. The key must contain **every** input the query depends on, or two different filters will share a cache entry.
- `useAutoAnalysisStatus` is the only hook with a `refetchInterval` (60 s) and an `enabled` flag.
- `useOrder(id)` guards with `enabled: id !== undefined`. Follow that pattern for any id-keyed hook.
- There are **no mutation hooks** in this file. Mutations are called inline from the pages via the api adapters and invalidate queries with `queryClient.invalidateQueries`.
- `useAgentRuns`, `useAgentActivity` and `useReports` take the query types declared in `../api/agents.api.ts` / `../api/reports.api.ts`, not `ListQuery`.

### Testing Requirements

- `npm run build --prefix frontend`.
- `npm test --prefix frontend -- --run`.
- No hook is unit-tested. Verify a new hook by rendering the page that uses it.

### Common Patterns

- `useQuery({ queryKey, queryFn })` — no `useMemo`, no selector, no custom `enabled` unless the input may be undefined.
- Query defaults come from the `QueryClient` in `../main.tsx`; do not restate `staleTime` here unless the endpoint genuinely needs a different one.

## Dependencies

### Internal

- `../api/index.ts` — the adapters these hooks call
- `../types/api.ts` — `ListQuery`
- `../api/agents.api.ts`, `../api/reports.api.ts` — the specialised query types
- `../main.tsx` — `QueryClient` defaults

### External

- @tanstack/react-query 5.104.0

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
