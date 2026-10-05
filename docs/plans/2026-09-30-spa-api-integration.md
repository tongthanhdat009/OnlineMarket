# SPA API Integration Implementation Plan

**Goal:** Replace admin SPA mock data with existing API queries/mutations and verify customer SPA contract wiring.
**Architecture:** Reuse existing typed API adapters and TanStack Query hooks. Pages consume server state, mutations invalidate relevant queries, and UI renders loading/error/empty states. Customer API remains the single transport boundary.
**Tech Stack:** React 19, TypeScript strict, TanStack Query 5, Vite, ASP.NET Core JSON PascalCase.

## Global Constraints
- Backend JSON uses PascalCase (`Program.cs` JSON options).
- Frontends call existing API adapters; no second fetch wrapper.
- Preserve unrelated working-tree changes.
- No generated files or migrations edited.

### Task 1: Admin query/mutation foundation
**Files:** Modify `frontend/src/api/*.ts`, `frontend/src/hooks/index.ts`, `frontend/src/types/domain.ts`.
- [ ] Add missing category/supplier query adapters and mutation hooks.
- [ ] Add query invalidation helpers for list/detail mutations.
- [ ] Preserve paged and bare-array response normalization.

### Task 2: Admin operational pages
**Files:** Modify `frontend/src/pages/AdminPages.tsx`.
- [ ] Replace orders, products, inventory, customers, and POS mock collections with live queries.
- [ ] Wire status/cancel, product CRUD/archive, inventory quantity, customer CRUD, and POS order mutations.
- [ ] Render loading/error/empty states and keep numeric formatting robust.

### Task 3: Admin catalog/finance/admin pages
**Files:** Modify `frontend/src/pages/AdminPages.tsx`.
- [ ] Replace generic list page mock rows with category, supplier, promotion, bill, and refund API data.
- [ ] Wire available create/update/delete/process/pay actions.
- [ ] Replace hard-coded dashboard chart rows with dashboard/report endpoints where available.

### Task 4: Customer contract verification
**Files:** Modify `frontend-customer/src/api/client.ts`, `frontend-customer/src/hooks/*.ts`, `frontend-customer/src/pages/*.tsx` only where evidence shows a mismatch.
- [ ] Verify endpoint paths, response unwrapping, auth, checkout, payment, refund, and AI flows against controllers/DTOs.
- [ ] Fix only confirmed mismatches and add focused tests for normalization/URLs.

### Task 5: Verification
**Files:** Existing test/build files only if required.
- [ ] Run both SPA builds.
- [ ] Run both one-shot Vitest suites.
- [ ] Run backend build if API adapter contracts expose compile issues.
