<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# OnlineMarket

Monorepo store-management: .NET 10 API + MySQL, React admin/customer SPAs.

## Structure

| Path | Purpose |
|---|---|
| `dotnet-backend/` | ASP.NET Core Web API solution + `docker-compose.yml` MySQL 8.0 (see `dotnet-backend/AGENTS.md`) |
| `frontend-customer/` | React + TypeScript + Vite customer storefront |
| `Makefile` | Canonical dev/build/db orchestration (`make dev`, `make build`, `make static-check`) |
| `dotnet-backend/.env.example` | Env template; real `dotnet-backend/.env` is gitignored |

## Where to Look

| Task | Start here |
|---|---|
| API endpoint / auth / business rule | `dotnet-backend/dotnet_backend/Controllers/` → `Services/` → `Models/`/`Dtos/` |
| DB schema / seed / migration | `dotnet-backend/dotnet_backend/Database/` + `Models/` + `Migrations/` |
| Customer page / cart / checkout | `frontend-customer/src/pages/` → `src/api/` → `src/types/` |
| Build failure / port mismatch | `Makefile`, `*/Properties/launchSettings.json`, `*/appsettings.json` |

## Code Map

- Request flow: `Controllers/*Controller.cs` → `Services/Interface/I*Service.cs` → `Services/*Service.cs` → `Database/ApplicationDbContext.cs` (Pomelo MySQL) → MySQL/MariaDB
- Storefront → API: React Vite proxy or `VITE_API_URL=http://localhost:7000`
- Auth: admin `AuthService`/`AuthController` vs customer `CustomerAuthService`/`CustomerAuthController`; JWT `sub` claim via `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` + `NameClaimType="sub"`
- Payments: `VNPayService` + `S3Service`/`UnavailableS3Service` (graceful when AWS env missing), `InvoicePdfService` (QuestPDF)

## Conventions

- API and storefront are separately buildable; don't cross-edit contracts without updating controllers ↔ services ↔ DTOs ↔ entities together.
- `Makefile` is source of truth for local commands; `dotnet build`/`npm run build` paths in child AGENTS.md mirror it.

## Anti-Patterns

- Committing secrets to `appsettings.json`, `wwwroot/appsettings.json`, or `schema.sql`.
- Adding generated dirs (`bin/`, `obj/`, `node_modules/`, `wwwroot/lib`, `.make-dev-*`) to docs or version control.
- Changing a `Services/Interface/I*Service` signature without its impl, DI registration in `Program.cs`, and caller.

## Commands

```bash
make install          # dotnet restore API + npm install (admin/customer)
make db-up && make db-wait   # MySQL 127.0.0.1:3308 / store_management
make dev              # DB + API :7000 + React admin :5173 + customer :5193
make build            # build API + React admin/customer
make static-check     # pre-push gate (== make build)
# granular:
dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln
npm run build --prefix frontend-customer
```

## Gotchas

- `dotnet-backend/.env` is required before `make dev-api` (`Env.Load` in `Program.cs` + `GetSetting` fallback `AWS_*`/`AWS:*`); copy from `.env.example` and fill `Jwt__Secret` (or `make env` generates it via `openssl rand -hex 32`).
- Inner `dotnet-backend/dotnet_backend/dotnet_backend.sln` and outer `dotnet-backend/dotnet-backend.sln` both exist — canonical build is `dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln`.
- All `.csproj` target `net10.0` (`Nullable=enable`, `ImplicitUsings=enable`); backend `RootNamespace=dotnet_backend`.
- API JSON keeps CLR casing (`PropertyNamingPolicy=null`, `ReferenceHandler.IgnoreCycles`); don't camelCase DTO payloads.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
