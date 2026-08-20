<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# dotnet-frontend

Vue 3 + Vite admin SPA — despite the `dotnet-` name it is **not** a .NET/Blazor project.

## Key Files

| File | Description |
|---|---|
| `package.json` | `engines: ^20.19.0 \|\| >=22.12.0`, scripts `dev`/`build`/`preview`; deps: Vue 3, Router, Axios, Chart.js, Flatpickr, jsPDF, Lucide |
| `vite.config.js` | Vue + devtools plugins; alias `@` → `src`; dev server `:5177` |
| `index.html` | Vite entry |
| `README.md` | Vietnamese architecture, routes, permission, API notes |

## Subdirectories

| Directory | Purpose |
|---|---|
| `src/` | SPA layers: bootstrap, shell, API clients, routing, RBAC, utils, pages (see `src/AGENTS.md`) |

## For AI Agents

- Use Node `^20.19.0 || >=22.12.0`; `npm install --prefix dotnet-frontend` or `make install-frontend`.
- Don't document `node_modules/`, `dist/`, `public/`, `src/assets/`, or empty `src/util/` (kept for compat; real utils are in `src/utils/`).
- Admin API base is `http://localhost:7000` (in `src/api/apiClient.js`); must match Blazor `Program.cs` and backend `launchSettings.json:http`.

## Testing Requirements

- `npm run build --prefix dotnet-frontend` (or `make build-admin` / `make static-check`).

## Dependencies

- Vue 3, Vue Router 4, Axios, Chart.js + datalabels, Flatpickr, jsPDF+autotable, Lucide, Vite 7

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
