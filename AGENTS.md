<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# OnlineMarket

## Purpose
Store-management system: ASP.NET Core API, Vue admin SPA, Blazor WebAssembly customer SPA.

## Key Files
| File | Description |
|---|---|
| `.gitignore` | Root Git exclusions. |

## Subdirectories
| Directory | Purpose |
|---|---|
| `dotnet-backend/` | ASP.NET Core API solution (see `dotnet-backend/AGENTS.md`). |
| `dotnet-frontend/` | Vue 3/Vite admin SPA (see `dotnet-frontend/AGENTS.md`). |
| `BlazorApp/` | Blazor WebAssembly customer SPA (see `BlazorApp/AGENTS.md`). |

## For AI Agents

### Working In This Directory
- Treat the three applications as separately buildable repositories; do not cross-edit without a contract change.
- Do not document `.git`, `bin`, `obj`, `node_modules`, `wwwroot/lib`, or generated/cache directories.

### Testing Requirements
- Backend: `dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln`.
- Admin SPA: `npm run build --prefix dotnet-frontend`.
- Customer SPA: `dotnet build BlazorApp/BlazorApp.csproj`.

## Dependencies

### Internal
- Both frontends consume the backend REST API.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
