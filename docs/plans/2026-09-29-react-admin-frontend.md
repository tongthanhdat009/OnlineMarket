# React Store Admin Frontend Implementation Plan

**Goal:** Ship a complete `frontend/` React admin console matching the approved Store Admin UI/UX concept and connected to the .NET API contract.

**Architecture:** Vite React TypeScript app. Route/page modules consume TanStack Query hooks; hooks consume domain API modules; one API client owns auth, errors, and pagination. Shared shell/components keep all operational pages consistent.

**Tech Stack:** React 19.3.0, TypeScript, Vite 8.3.1, Tailwind CSS 4.3.3, React Router 7, TanStack Query 5, Recharts, Lucide React, Vitest, Testing Library.

## Global Constraints

- Root app path: `frontend/`; dev port: `5173`; API proxy: `http://localhost:7000`.
- Preserve .NET PascalCase response/request fields unless a documented adapter derives a view value.
- Paginated requests always include both `page` and `pageSize`.
- Frontend permissions are UX guards only; never claim they replace API authorization.
- Never render, store in logs, or expose staff `Password` response values.
- Dangerous order/refund/archive actions require consequence-aware confirmation.

### Task 1: Scaffold and tooling
**Files:** Create `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.ts`, `frontend/tsconfig*.json`, `frontend/src/main.tsx`, `frontend/src/styles.css`, `frontend/.env.example`, `frontend/README.md`.

- [ ] Initialize Vite React TypeScript app and pin current npm package versions.
- [ ] Add Tailwind v4 Vite plugin, React Router, TanStack Query, Recharts, Lucide, Vitest, Testing Library.
- [ ] Configure `/api` proxy and scripts `dev`, `build`, `test`, `preview`.
- [ ] Add theme tokens, Inter fallback stack, focus styles, scrollbar and responsive base CSS.
- [ ] Verify `npm install` and empty `npm run build`.

### Task 2: API, auth, and shared types
**Files:** Create `frontend/src/api/client.ts`, `frontend/src/api/*.api.ts`, `frontend/src/auth/*`, `frontend/src/types/*`, `frontend/src/lib/*`; tests under `frontend/src/**/*.test.ts`.

- [ ] Implement request client with bearer token, one refresh retry, normalized `ApiError`, and JSON/SSE helpers.
- [ ] Implement `normalizeListResponse` for array and `{ Items, TotalCount, Page, PageSize }`.
- [ ] Add auth login/me/refresh/logout and permission `can()` context.
- [ ] Add endpoint modules for dashboard, orders, products, inventory, customers, promotions, bills, refunds, agents, reports, roles, permissions, and users.
- [ ] Add focused tests for pagination, password stripping, dashboard AOV, inventory body serialization, and auth error handling.

### Task 3: Shared shell and primitives
**Files:** Create `frontend/src/layouts/AppShell.tsx`, `frontend/src/components/*`, `frontend/src/router.tsx`.

- [ ] Implement responsive sidebar groups and permission-gated items from the approved IA.
- [ ] Implement topbar global search, Ask AI trigger, alerts, user menu, mobile sidebar drawer.
- [ ] Implement PageHeader, StatCard, DataTable, StatusBadge, Money, ProductAvatar, Drawer, Modal, ConfirmDialog, FormSection, EmptyState, Skeleton, ErrorState, timelines, and agent status.
- [ ] Verify keyboard focus, Escape close, overlay click behavior, and desktop/tablet breakpoints.

### Task 4: Operations pages
**Files:** Create `frontend/src/features/dashboard/*`, `orders/*`, `pos/*`, `products/*`, `inventory/*`, `customers/*`, plus route page files.

- [ ] Build dashboard KPI cards, chart panels, exception strip, daily table, and zero-safe AOV.
- [ ] Build orders table with online/offline tabs, filters, status transition actions, and 520–640px detail drawer.
- [ ] Build POS 65/35 product grid and fixed cart, barcode Enter behavior, stock-aware quantity controls, customer/promotion controls, and checkout confirmation.
- [ ] Build product CRUD drawer with archive label, image upload validation, stock badges, and category/supplier filters.
- [ ] Build inventory stock filters and raw integer quantity update drawer.
- [ ] Build customer list/detail tabs and friendly “order history exists” delete error.
- [ ] Add loading/empty/error states to each page and tests for key derived behavior.

### Task 5: Commercial pages
**Files:** Create `frontend/src/features/promotions/*`, `bills/*`, `refunds/*`.

- [ ] Build promotion lifecycle table/editor, validation, UsedCount control disabling, gifting multi-select, and action confirmations.
- [ ] Build bills table/detail with unpaid→paid/cancelled action rules and protected admin route messaging.
- [ ] Build refund workflow tabs/detail, pending-only delete, context-aware approve/reject/process actions, and consequence confirmations.

### Task 6: AI and administration pages
**Files:** Create `frontend/src/features/ai/*`, `frontend/src/features/admin/*`.

- [ ] Build global SSE AI Assistant panel with tool progress labels and no raw arguments.
- [ ] Build agents CRUD/editor with bounds, tool assignment, and permission guards.
- [ ] Build runs/detail/activity pages with status timeline and live SSE activity, analytics cards/charts, reports generate/view/PDF, and tools route.
- [ ] Build staff, roles, permissions matrix pages; remove `Password` at adapter boundary.
- [ ] Add route-level empty/error states and route tests.

### Task 7: Integration and verification
**Files:** Modify `frontend/README.md`; optionally `Makefile` only if targets are added without changing existing commands.

- [ ] Run `npm run test -- --run` and `npm run build`.
- [ ] Run preview smoke test for login, dashboard, order drawer, product drawer, POS, and route navigation.
- [ ] Confirm no secrets, generated directories, or backend files are added.
- [ ] Report API blockers from the spec (bill/cart authorization, UserDto password leak) as frontend caveats.
