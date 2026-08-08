<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# dotnet-frontend

## Purpose
Vue 3/Vite admin SPA. Despite its name, this is not a .NET or Blazor project.

## Key Files
| File | Description |
|---|---|
| `package.json` | Node engine, dependencies, and Vite scripts. |
| `vite.config.js` | Vue plugins and `@` alias to `src`. |
| `index.html` | Vite HTML entry point. |
| `README.md` | Vietnamese architecture, route, permission, and API notes. |

## Subdirectories
| Directory | Purpose |
|---|---|
| `src/` | SPA source layers (see `src/AGENTS.md`). |

## For AI Agents

### Working In This Directory
- Use Node `^20.19.0 || >=22.12.0`.
- Do not document `node_modules`, nested `.git`, `public`, or `src/assets`.

### Testing Requirements
- Run `npm run build`; no automated test script exists.

## Dependencies

### External
- Vue 3, Vue Router, Axios, Chart.js, Flatpickr, jsPDF, Lucide, Vite.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
