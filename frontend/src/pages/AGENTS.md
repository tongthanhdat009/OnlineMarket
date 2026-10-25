<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# pages

## Purpose

Every page in the admin console. Two files.

## Key Files

| File | Description |
|---|---|
| `AdminPages.tsx` | 1172 lines. Exports the `pages` object (`DashboardPage`, `OrdersPage`, `ProductsPage`, `InventoryPage`, `PosPage`, `CustomersPage`, `ListPage`, `AiPage`, `AdminPage`, `AuditLogPage`), plus `PlaceholderPage`, `OrderDetailPage`, `AdminPages` and `LoginPage`. |
| `ProfilePage.tsx` | 93 lines — the signed-in user's own profile. |

## For AI Agents

### Working In This Directory

- `AdminPages.tsx` is one large file by design: the route table in `../router.tsx` dispatches by **string key**, and several keys share a component. `ListPage type="Categories" | "Suppliers" | "Promotions" | "Bills" | "Refunds"` covers five catalog/finance routes; `AiPage page="chat" \| "agents" \| "runs" \| …` covers every `ai-` route; `AdminPage page="users" \| "roles" \| "permissions"` covers the admin routes.
- Adding a page means adding an export here **and** a route in `../router.tsx`. There is no route module convention.
- A page reads data through a hook from `../hooks/index.ts` and mutates through an adapter from `../api/index.ts`. A page must not call `apiClient` directly.
- Mutations invalidate queries through `useQueryClient().invalidateQueries({ queryKey: [...] })`. Match the key shape used in `../hooks/index.ts`.
- Reuse the primitives in `../components/primitives.tsx` (`DataTable`, `Drawer`, `Modal`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `StatCard`, `PageHeader`). Do not hand-roll a table or a dialog.
- `ListPage` covers five different resources behind a `type` prop. If a sixth resource needs different columns, add a dedicated component instead of growing the `if`-chain.
- Recharts renders the dashboard charts; the chart data comes from the dashboard hooks.

### Testing Requirements

- `npm run build --prefix frontend` — type check via `tsc -b`.
- `npm test --prefix frontend -- --run`.
- No page is unit-tested. The Playwright suite in `../../../e2e/tests/admin/` covers the pages against staging.

### Common Patterns

- Vietnamese UI copy, matching the rest of the admin console.
- Loading / error / empty states are rendered with `Skeleton`, `ErrorState` and `EmptyState` — a page with only a success branch is incomplete.
- Drawers hold detail views so the list route stays deep-linkable.

## Dependencies

### Internal

- `../router.tsx` — the route table and the page-key dispatch
- `../hooks/index.ts` — data hooks
- `../api/index.ts` — mutations
- `../components/primitives.tsx` — UI primitives
- `../auth/AuthContext.tsx` — `useAuth()` for the signed-in user and permissions
- `../types/domain.ts` — entity types

### External

- recharts 3.10.1 — dashboard charts
- @tanstack/react-query 5.104.0 — `useQueryClient`
- lucide-react 0.548.0 — icons

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
