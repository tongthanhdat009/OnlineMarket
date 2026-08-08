<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# BlazorApp

## Purpose
.NET 9 Blazor WebAssembly customer storefront. Consumes backend REST APIs for catalog, carts, checkout, customer auth, payments, and AI chat.

## Key Files
| File | Description |
|---|---|
| `Program.cs` | Blazor bootstrap, API `HttpClient`, and service DI registrations. |
| `App.razor` | Assembly routing and default layout. |
| `BlazorApp.csproj` | .NET target and NuGet dependencies. |
| `_Imports.razor` | Shared Razor imports. |
| `README.md` | Vietnamese architecture, route, and local-run notes. |

## Subdirectories
| Directory | Purpose |
|---|---|
| `Components/` | Reusable chat, image, and toast UI. |
| `Layout/` | Shared layouts and navigation. |
| `Pages/` | Routed customer pages. |
| `dto/` | API transport types. |
| `services/` | API/domain/state services. |
| `Properties/` | Local launch profiles. |
| `wwwroot/` | Static host, styles, JavaScript interop, and public client config. |

## For AI Agents

### Working In This Directory
- Preserve `BlazorApp.Services` and `BlazorApp.Dto` namespaces despite lowercase directory names.
- Register changed services in `Program.cs`; `CartStateService` is singleton state.
- Razor pages inject services locally; preserve their selected layout and routes.
- Everything in `wwwroot/` is public. Never add secrets there.
- Ignore nested `.git` and `wwwroot/lib`.

### Testing Requirements
- Run `dotnet build BlazorApp.csproj`; no automated tests exist.

## Dependencies

### External
- Blazor WebAssembly, Blazored.LocalStorage, AutoMapper, Bootstrap.

### Internal
- Calls backend API at `http://localhost:7000/`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
