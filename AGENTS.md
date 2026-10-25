<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# OnlineMarket

## Purpose

Monorepo store-management: .NET 10 API + MySQL, React admin/customer SPAs.

## Key Files

| File | Description |
|---|---|
| `Makefile` | Canonical dev/build/db orchestration — `make dev`, `make build`, `make static-check` |
| `README.md` | Vietnamese project overview: components, ports, config groups, commands |
| `AGENTS.md` | This file — the entry point of the agent documentation hierarchy |
| `.gitignore` | Excludes `bin/`, `obj/`, `node_modules/`, `dist/`, `.env`, `.make-dev-*` |

## Subdirectories

| Directory | Purpose |
|---|---|
| `dotnet-backend/` | ASP.NET Core Web API + MySQL compose (see `dotnet-backend/AGENTS.md`) |
| `frontend/` | React admin SPA (see `frontend/AGENTS.md`) |
| `frontend-customer/` | React customer storefront (see `frontend-customer/AGENTS.md`) |
| `e2e/` | Playwright admin + customer suites (see `e2e/AGENTS.md`) |
| `deploy/` | Staging release plumbing (see `deploy/AGENTS.md`) |
| `docs/` | Operations handbook, audits, plans, specs (see `docs/AGENTS.md`) |
| `.github/workflows/` | CI build gate + staging deploy (see `.github/workflows/AGENTS.md`) |

## Where to Look

| Task | Start here |
|---|---|
| API endpoint / auth / business rule | `dotnet-backend/dotnet_backend/Controllers/` → `Services/` → `Models/`/`Dtos/` |
| DB schema / seed / migration | `dotnet-backend/dotnet_backend/Database/` + `Models/` + `Migrations/` |
| Audit trail of mutations | `dotnet-backend/dotnet_backend/Middleware/AuditLogMiddleware.cs` |
| Customer page / cart / checkout | `frontend-customer/src/pages/` → `src/api/` → `src/types/` |
| Admin page / RBAC / AI console | `frontend/src/pages/` → `src/api/` → `src/auth/` |
| Release to staging | `deploy/staging/` + `.github/workflows/staging.yml` |
| Build failure / port mismatch | `Makefile`, `*/Properties/launchSettings.json`, `*/appsettings.json` |

## Code Map

- Request flow: `Controllers/*Controller.cs` → `Services/Interface/I*Service.cs` → `Services/*Service.cs` → `Database/ApplicationDbContext.cs` (Pomelo MySQL) → MySQL/MariaDB
- Storefront → API: React Vite proxy or `VITE_API_URL=http://localhost:7000`
- Auth: admin `AuthService`/`AuthController` vs customer `CustomerAuthService`/`CustomerAuthController`; JWT `sub` claim via `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` + `NameClaimType="sub"`
- Payments: `VNPayService` + `S3Service`/`UnavailableS3Service` (graceful when AWS env missing), `InvoicePdfService` (QuestPDF)
- AI: `AiService` (customer chat), `AdminAiService` + `AgentRuntime`/`AdminAiToolRegistry`/`AgentOperationsService`/`AgentReportService`/`AgentAutoAnalysisService`
- Outbound integration: `Services/OdooHookService.cs` fires a signed order-paid webhook to `ODOO_CONNECTOR_URL`

## Conventions

- API and storefront are separately buildable; don't cross-edit contracts without updating controllers ↔ services ↔ DTOs ↔ entities together.
- `Makefile` is source of truth for local commands; `dotnet build`/`npm run build` paths in child AGENTS.md mirror it.
- Every directory has its own `AGENTS.md`; each one carries a `<!-- Parent: ... -->` link up the tree.

## Anti-Patterns

- Committing secrets to `appsettings.json`, `wwwroot/appsettings.json`, or `schema.sql`.
- Adding generated dirs (`bin/`, `obj/`, `node_modules/`, `wwwroot/lib`, `.make-dev-*`, `e2e/test-results/`) to docs or version control.
- Changing a `Services/Interface/I*Service` signature without its impl, DI registration in `Program.cs`, and caller.

## For AI Agents

### Working In This Directory

- Read the child `AGENTS.md` for the area you are about to touch — they carry the file-level conventions and the gotchas that are not visible from the root.
- The `Makefile` is the source of truth for local commands. Do not invent a new build command; add a `make` target instead.
- Never commit secrets. `.env`, `appsettings*.json` secrets and `deploy/staging/shared/` stay out of the repo.
- Do not add generated output (`bin/`, `obj/`, `node_modules/`, `dist/`, `e2e/test-results/`, `.make-dev-*`) to version control.

### Testing Requirements

- `make build` (API + both SPAs) must pass before any change is called done.
- `make static-check` is the pre-push gate and is the same command.
- Backend: `dotnet test dotnet-backend/dotnet_backend.Tests/dotnet_backend.Tests.csproj`.
- E2E: `cd e2e && npx playwright test` — against staging, not a local dev server.

### Common Patterns

- API contract changes travel in one commit across controllers → services → DTOs → entities → migrations → SPA types.
- JSON stays PascalCase end to end. `PropertyNamingPolicy=null` on the server, PascalCase reads on the client.
- Every directory owns an `AGENTS.md` with a `<!-- Parent: ... -->` link. Regenerate rather than hand-editing when the structure changes.

## Dependencies

### Internal

- `dotnet-backend/` — the API, the MySQL compose file and the `.env` template
- `frontend/`, `frontend-customer/` — the two SPAs
- `e2e/`, `deploy/`, `docs/`, `.github/workflows/` — verification, release and documentation

### External

- .NET SDK 10, Node >= 20.19.0, Docker Engine + Compose v2, MySQL 8.0, Playwright 1.63

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
- `.sln`/`.csproj` sit in `dotnet-backend/dotnet_backend/`, but `dotnet-backend/.env` sits one level up — `Env.Load` walks four directories up from `AppContext.BaseDirectory`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
