<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# api

Axios resource modules over `apiClient.js`; parallel to backend `Controllers/` + Blazor `services/`.

## Key Files

| File | Description |
|---|---|
| `apiClient.js` | Axios instance `BASE_URL=http://localhost:7000`, `timeout 10000`, request `Bearer accessToken`, 401 clears + `/login` |
| `Auth.js` | `login`/`logout`/`current-user` + refresh-token queue |
| `Product.js` | Product CRUD + image upload |
| `Order.js` | Orders + stats |
| `Category.js`, `Customer.js`, `Inventory.js`, `Promotion.js`, `Suppliers.js`, `Users.js`, `Role.js`, `Permission.js`, `RolePermission.js` | Remaining resources |
| `api.js` | Shared re-exports (if used) |

## For AI Agents

- One named `async` export per backend endpoint; keep backend path casing & payload shape exact (`PropertyNamingPolicy=null` on API).
- `apiClient.js` vs `Auth.js` have distinct roles (generic transport + 401 handling vs token lifecycle/queue) — coordinate changes to token keys, refresh, or redirect.
- New resource: add `*.js` here + wire callers in `views/`/`router/`; don't centralize everything into `api.js`.

## Testing Requirements

- `npm run build --prefix dotnet-frontend` from root; manually hit changed endpoints against `http://localhost:7000` (`make dev-api`).

## Dependencies

- Axios; `../router/index.js` + `../utils/permissionUtils.js` consume auth state.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
