<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# src

## Purpose
Vue SPA bootstrap, application shell, API clients, routing, RBAC helpers, utilities, and page components.

## Key Files
| File | Description |
|---|---|
| `main.js` | Creates the Vue app, registers router and global icons/styles. |
| `App.vue` | Application shell and permission-filtered sidebar. |

## Subdirectories
| Directory | Purpose |
|---|---|
| `api/` | Axios resource clients and token lifecycle (see `api/AGENTS.md`). |
| `components/` | Reusable Vue components. |
| `composables/` | Reusable reactive behavior. |
| `router/` | Routes and navigation guard. |
| `utils/` | Permissions and PDF helper modules. |
| `views/` | Page-level Vue SFCs. |

## For AI Agents

### Working In This Directory
- Use PascalCase Vue SFC filenames; use camelCase utility/composable modules.
- Route metadata controls authentication, RBAC, and sidebar visibility; update together.
- Preserve Vietnamese UI language and existing Composition API style.

### Testing Requirements
- Run `npm run build` from `..`; no automated tests exist.

## Dependencies

### Internal
- `api/` calls the backend at `http://localhost:7000`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
