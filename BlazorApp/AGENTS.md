<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# BlazorApp

.NET 10 Blazor WebAssembly customer storefront — catalog, cart, checkout, VNPay, customer auth, AI chat.

## Key Files

| File | Description |
|---|---|
| `Program.cs` | WASM bootstrap: `HttpClient(BaseAddress=http://localhost:7000/)`, DI for `*Service` + `I*Service` contracts, `Blazored.LocalStorage`, `CartStateService` singleton, `S3ImageService` |
| `App.razor` / `_Imports.razor` | Routing + global Razor imports |
| `BlazorApp.csproj` | `net10.0`, Blazor WASM SDK; refs: Blazored.LocalStorage, AutoMapper, EF Tools |
| `Properties/launchSettings.json` | `http` `:5192` / `https` `:7190` (must stay in sync with API CORS + Vue `:5177`) |
| `wwwroot/appsettings.json` | Public client config (`AWS:BucketName/Region` only — never secrets) |
| `wwwroot/index.html` | WASM host page + `js/` interop |

## Subdirectories

| Directory | Purpose |
|---|---|
| `Pages/` | 12 routed pages: `Home.razor`, `Products.razor`, `ProductDetail.razor`, `Cart.razor`, `Checkout.razor`, `Orders.razor`, `PaymentResult.razor`/`PaymentSuccess.razor`, `Profile.razor`, `Login.razor`/`Register.razor`, `NotFound.razor` |
| `services/` | API/domain/state (`CartService`, `ProductService`, `OrderService`, `AuthService`, `PaymentService`, `InventoryService`, `PromotionService`, `AiChatService`, `S3ImageService`, `ToastService`, `CartStateService`) with `services/interface/` contracts |
| `dto/` | Client transport types mirroring backend `Dtos/` (PascalCase wire) |
| `Components/` | `ChatAssistant.razor`, `ProductImage.razor`, `Toast.razor` |
| `Layout/` | `CustomerLayout.razor`, `AuthLayout.razor`, `MainLayout.razor`, `NavMenu.razor` |
| `wwwroot/` | Static assets, `css/`, `js/`, `lib/` (Bootstrap) — all public |

## For AI Agents

- Preserve `BlazorApp.Services` / `BlazorApp.Dto` namespaces despite lowercase `services/`/`dto/` dirs.
- `CartStateService` is `Singleton` (cart state); new service → register in `Program.cs` with correct lifetime.
- Razor pages inject services locally; preserve chosen layout (`@layout`) and `@page` routes.
- `wwwroot/` is public — never put JWT, AWS keys, or VNPay secrets there.
- Keep `HttpClient.BaseAddress` in sync with `dotnet-frontend/src/api/apiClient.js` + backend port `:7000`.

## Testing Requirements

- `dotnet build BlazorApp.csproj` from `BlazorApp/` or `make build-blazor` / `make static-check` from root. No automated tests.

## Dependencies

| Area | Detail |
|---|---|
| External | Blazor WASM 10.0, Blazored.LocalStorage 4.5, AutoMapper, Bootstrap |
| Internal | Calls `http://localhost:7000/` API (same as admin SPA) |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
