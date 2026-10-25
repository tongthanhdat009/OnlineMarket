<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# dotnet_backend

## Purpose

.NET 10 ASP.NET Core Web API. Flow: `Controllers/*` → `Services/Interface/I*` → `Services/*` → `Database/ApplicationDbContext` (Pomelo MySQL/MariaDB 10.4).

## Key Files

| File | Description |
|---|---|
| `Program.cs` | Composition root: `Env.Load`, EF Core `ApplicationDbContext` (`UseMySql`, `MySqlServerVersion(10,4,0)`), JWT (`sub` claim), CORS `AllowFrontendApps`, all `I*Service` bindings, S3 fallback to `UnavailableS3Service`, `HttpClientFactory` for AI, `AuditLogMiddleware` registration, dev-only `Database.Migrate()` + agent-tool seed |
| `dotnet-backend.csproj` | `net10.0`, `Nullable=enable`, `ImplicitUsings=enable`; deps: Pomelo MySQL, JWT Bearer, BCrypt, AWSSDK.S3, QuestPDF, DotNetEnv, EFCore.Design 9.0.9 |
| `appsettings.json` | Placeholder config (empty `ConnectionStrings`, `Jwt`, `OpenAI`, `VNPay`, `AWS`); secrets come from `.env` |
| `appsettings.Development.json` | Dev logging overrides |
| `dotnet-backend.http` | Manual request collection for smoke tests |
| `dotnet_backend.sln` | Inner solution — canonical build target |

## Subdirectories

| Directory | Purpose |
|---|---|
| `Controllers/` | 27 controller files — admin + `Customer*` domains; one file holds 7 agent controllers (see `Controllers/AGENTS.md`) |
| `Services/` | Domain logic & integrations (see `Services/AGENTS.md`); contracts in `Services/Interface/` |
| `Dtos/` | Request/response shapes — PascalCase (JSON `PropertyNamingPolicy=null`) (see `Dtos/AGENTS.md`) |
| `Models/` | EF `partial` entities with nullable FKs + `virtual` navs (see `Models/AGENTS.md`) |
| `Database/` | `ApplicationDbContext`, `ModelSeedData`, `ApplicationDbContextFactory` (see `Database/AGENTS.md`) |
| `Migrations/` | EF migrations — `InitialCreate` → `ImportLegacySeedData` → `AddAgentOperationsConsole` → `UpdateAdminAgentModel` → `AddAuditLog` (see `Migrations/AGENTS.md`) |
| `Middleware/` | `AuditLogMiddleware` — writes every successful data-changing API call to `audit_logs` (see `Middleware/AGENTS.md`) |
| `Properties/` | `launchSettings.json` — `http` on `:7000` is the canonical API port (see `Properties/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Keep `nullable` + `implicitUsings`; don't add secrets to `appsettings*.json`.
- New `I*Service` → register in `Program.cs` (`AddScoped`); new entity → update `ApplicationDbContext` + `Models/` + `Dtos/` together.
- Duplicate registration exists (`AddScoped<IOrderService>` twice, plus concrete `PromotionService`); preserve until intentional dedupe.
- CORS policy `AllowFrontendApps` must allow React admin `:5173` and React customer `:5193` (localhost and 127.0.0.1).
- `Program.cs` calls `Database.Migrate()` **only** when `ASPNETCORE_ENVIRONMENT=Development`; staging/prod migrations run from the `efbundle` in `deploy/staging/deploy.sh`.
- The dev-only block in `Program.cs` also seeds agent tools for `AgentId == 1` — it is a dev convenience, not a migration.

### Testing Requirements

- `dotnet build dotnet_backend.sln` (from this dir) or `make build-backend` from root.
- `dotnet run --project dotnet-backend.csproj` needs `../.env` + MySQL `make db-up && make db-wait`.
- `dotnet test ../dotnet_backend.Tests/dotnet_backend.Tests.csproj`.

### Common Patterns

- One service per domain behind an interface; controllers depend on the interface, never on the concrete class.
- `Program.cs` is the only place where a concrete type is bound to an abstraction.

## Dependencies

### Internal

- `Controllers/` — the HTTP surface (see `Controllers/AGENTS.md`)
- `Services/` — the domain logic (see `Services/AGENTS.md`)
- `Dtos/`, `Models/`, `Database/` — the data shapes and the persistence
- `Migrations/`, `Middleware/`, `Properties/` — schema history, audit trail, launch profiles

### External

| Area | Packages |
|---|---|
| Data | Pomelo MySQL 9.0.0, EFCore 9.0.9 (Design), EF Core runtime via `net10.0` |
| Auth | JWT Bearer 10.0.10, BCrypt.Net-Next 4.0.3 |
| Infra | AWSSDK.S3 4.0.14.3, QuestPDF 2025.7.4, DotNetEnv 3.1.1 |
| API | Microsoft.AspNetCore.OpenApi 10.0.10, Microsoft.OpenApi 2.7.5 |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
