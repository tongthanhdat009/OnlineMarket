# React Store Admin Frontend Design

**Date:** 2026-09-29
**Status:** Approved by user

## Goal

Create a complete React + TypeScript admin frontend in `frontend/` for the Store Admin UI described in the supplied UI/UX concept. The app must cover every route in the information architecture, preserve the .NET API's PascalCase wire contract, and remain usable when the API is unavailable during UI development.

## Product shape

The app is a desktop-first operational console with a 240–260px sidebar, topbar, page header, dense tables, right drawers, and semantic status badges. Dashboard, orders/POS, catalog, finance, AI operations, and administration use the same shell and shared component primitives. Details open in drawers while routes remain deep-linkable.

## Technology

- React 19.3.0 + TypeScript 5.x + Vite 8.3.1.
- Tailwind CSS 4.3.3 using the `@tailwindcss/vite` plugin and CSS-first theme tokens.
- React Router 7, TanStack Query 5, Lucide React icons, Recharts for charts.
- Vitest + Testing Library for focused component and adapter checks.
- Dev server port `5173`; Vite proxy `/api` → `http://localhost:7000`.

## Architecture and boundaries

```text
routes/pages → feature hooks → domain API modules → api/client.ts → .NET API
                       ↓
                 shared components
```

`api/client.ts` owns JSON requests, bearer token injection, refresh-once handling for 401, normalized errors, and pagination. Domain modules know endpoint paths and request shapes. Components never call `fetch`/Axios directly. PascalCase response fields remain unchanged at the transport boundary; view models adapt only where UI needs a derived value. `normalizeListResponse` accepts either an array or `{ Items, TotalCount, Page, PageSize }`.

Auth stores access/refresh tokens in session storage, loads `/api/auth/me`, and exposes `can(permission)` for UX guards. Hidden navigation/actions are never treated as backend authorization.

## Route coverage

- `/login`
- `/dashboard`
- `/orders`, `/orders/:id`
- `/pos`
- `/products`, `/categories`, `/suppliers`, `/inventory`
- `/customers`, `/customers/:id`
- `/promotions`
- `/bills`, `/refunds`
- `/ai/chat`, `/ai/agents`, `/ai/agents/:id`, `/ai/runs`, `/ai/runs/:id`, `/ai/activity`, `/ai/reports`, `/ai/analytics`, `/ai/tools`
- `/admin/users`, `/admin/roles`, `/admin/permissions`

Every route has loading, success, empty, and error presentation. Routes not yet connected to a backend endpoint use the same shell and a clearly labeled empty state; they are still navigable and ready for their domain module.

## Shared UI contract

Core primitives: `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `StatCard`, `DataTable`, `SearchInput`, `FilterSelect`, `DateRangePicker`, `StatusBadge`, `Money`, `ProductAvatar`, `Drawer`, `Modal`, `ConfirmDialog`, `FormSection`, `EmptyState`, `Skeleton`, `ErrorState`, `OrderTimeline`, `ActivityTimeline`, `AgentRunStatus`.

Tables accept search, filters, pagination, sorting, row actions, loading, empty, and error slots. Requests always send both `page` and `pageSize`. Destructive actions state the object and consequence before confirmation.

## Data behavior

Dashboard derives average order value as revenue divided by completed orders, guarding division by zero. Inventory derives out-of-stock (`0`), low (`1–5`), and normal (`>5`). Product archive is labeled “Archive product”. Staff adapters remove `Password` immediately and never log it. Inventory quantity updates send a raw JSON integer. AI chat streams SSE events and renders tool progress without raw arguments. Permission checks gate UX only.

## Responsive behavior

At 1440px the sidebar and multi-column dashboards are full width. At 1024px the sidebar compacts. At 768px it becomes a drawer. Below 768px only basic operational content remains practical; POS and run monitoring keep horizontal desktop/tablet layouts.

## Initial UI delivery boundary

The first implementation pass prioritizes a reviewable interface: all routes are navigable, core drawers and POS interactions work with deterministic preview data, and the API/client/domain adapters plus TanStack Query hooks are ready for live wiring. This keeps the console useful while the API is not running; pages can switch to live queries without changing the shared shell or route contract.

## Verification

- `npm run build` must pass in `frontend/`.
- `npm run test -- --run` covers pagination normalization, auth-safe user mapping, dashboard AOV, status transitions, and core shell rendering.
- Manual smoke check via Vite preview covers login, dashboard, order drawer, product drawer, POS quantity controls, and all route links.
