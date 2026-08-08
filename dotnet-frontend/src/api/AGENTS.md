<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# api

## Purpose
Axios clients and resource-specific backend API modules.

## Key Files
| File | Description |
|---|---|
| `apiClient.js` | Generic Axios instance; clears local state and redirects after 401. |
| `Auth.js` | Login/logout/current-user APIs and refresh-token queue. |
| `Product.js` | Product operations and image upload API. |
| `Order.js` | Order operations and statistics API. |
| `Permission.js` | Permission API operations. |

## For AI Agents

### Working In This Directory
- Export named async operations per resource module.
- Preserve the separate roles of `apiClient.js` and `Auth.js`; coordinate changes to token keys, refresh, or 401 handling.
- Match backend endpoint casing and payload shape exactly.

### Testing Requirements
- Run `npm run build` from `../..`; manually verify changed API calls against local backend.

## Dependencies

### External
- Axios.

### Internal
- `../router/` and `../utils/permissionUtils.js` consume auth/RBAC state.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
