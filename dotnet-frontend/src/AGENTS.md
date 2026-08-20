<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# src

Vue SPA bootstrap, shell, routing, API clients, RBAC, utils, and page components.

## Key Files

| File | Description |
|---|---|
| `main.js` | Creates Vue app, registers router + global icons/styles |
| `App.vue` | Shell + permission-filtered sidebar (driven by `router/index.js` `meta`) |
| `router/index.js` | Routes + `beforeEach` guard: `localStorage.accessToken` + `hasPermission(actionKey)` + `actionKey`/`requiresAuth` meta |
| `api/apiClient.js` | Axios `BASE_URL=http://localhost:7000`, request adds `Bearer accessToken`, 401 clears storage → `/login` |
| `utils/permissionUtils.js` | `getPermissions`/`hasPermission`/`hasAnyPermission`/`hasAllPermissions` over `localStorage` |
| `composables/usePermissions.js` | Reactive wrapper: `permissions` ref + `can`/`canAny`/`canAll`/`reload` |
| `utils/generateInvoicePDF.js` | jsPDF invoice builder (font via `registerVietnameseFont.js`) |

## Subdirectories

| Directory | Purpose |
|---|---|
| `api/` | Resource modules `Auth.js`, `Product.js`, `Order.js`, `Permission.js`, … (see `api/AGENTS.md`) |
| `components/` | Reusable SFCs (`components/icons/*`) |
| `composables/` | `usePermissions.js` |
| `router/` | `index.js` (single file) |
| `utils/` | `permissionUtils.js`, `generateInvoicePDF.js`, font helpers |
| `views/` | 14 pages: `Dashboard.vue`, `POS.vue`, `Products.vue`, `Orders.vue`/`OrdersOnline.vue`, `Inventory.vue`, `Promotions.vue`, `Refunds.vue`, `RolePermission.vue`, `Users.vue`, `Categories.vue`, `Suppliers.vue`, `Customers.vue`, `Login.vue`, `Profile.vue` |

## For AI Agents

- PascalCase SFCs; camelCase composables/utils.
- `meta: { requiresAuth, actionKey, icon, label }` drives both guard and sidebar — update together; Vietnamese UI labels preserved.
- Composition API style; keep `util/` empty (real code is `utils/`).
- Don't add `node_modules`/`dist` to docs; preserve Vietnamese UI strings.

## Testing Requirements

- `npm run build --prefix dotnet-frontend` from repo root or `npm run build` from `dotnet-frontend/`.

## Dependencies

- `api/` hits `http://localhost:7000`; `utils/permissionUtils.js` is consumed by `router/` + `composables/` + `App.vue`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
