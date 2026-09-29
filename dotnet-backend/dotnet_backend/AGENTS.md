<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# dotnet_backend

.NET 10 ASP.NET Core Web API. Flow: `Controllers/*` → `Services/Interface/I*` → `Services/*` → `Database/ApplicationDbContext` (Pomelo MySQL/MariaDB 10.4).

## Key Files

| File | Description |
|---|---|
| `Program.cs` | Composition root: `Env.Load`, EF Core `ApplicationDbContext`, JWT (`sub` claim), CORS `AllowBlazorApp`, all `I*Service` bindings, S3 fallback to `UnavailableS3Service`, `HttpClientFactory` for AI |
| `dotnet-backend.csproj` | `net10.0`, `Nullable=enable`, `ImplicitUsings=enable`; deps: Pomelo MySQL, JWT Bearer, BCrypt, AWSSDK.S3, QuestPDF, DotNetEnv |
| `appsettings.json` | Placeholder config (empty `ConnectionStrings`, `Jwt`, `OpenRouter`, `VNPay`, `AWS`); secrets come from `.env` |
| `appsettings.Development.json` | Dev logging overrides |
| `dotnet-backend.http` | Manual request collection for smoke tests |
| `dotnet_backend.sln` | Inner solution — canonical build target |

## Subdirectories

| Directory | Purpose |
|---|---|
| `Controllers/` | 24 attribute-routed endpoints: admin + `Customer*` domains (see `Controllers/AGENTS.md`) |
| `Services/` | Domain logic & integrations (see `Services/AGENTS.md`); contracts in `Services/Interface/` |
| `Dtos/` | Request/response shapes — PascalCase (JSON `PropertyNamingPolicy=null`) (see `Dtos/AGENTS.md`) |
| `Models/` | EF `partial` entities with nullable FKs + `virtual` navs (see `Models/AGENTS.md`) |
| `Database/` | `ApplicationDbContext`, `ModelSeedData`, `ApplicationDbContextFactory` (see `Database/AGENTS.md`) |
| `Migrations/` | EF migrations (`InitialCreate`, `ImportLegacySeedData`, `ModelSnapshot`) |
| `Properties/` | `launchSettings.json` — `http` on `:7000` is canonical API port |

## For AI Agents

- Keep `nullable` + `implicitUsings`; don't add secrets to `appsettings*.json`.
- New `I*Service` → register in `Program.cs` (`AddScoped`); new entity → update `ApplicationDbContext` + `Models/` + `Dtos/` together.
- Duplicate registration exists (`AddScoped<IOrderService>` twice, plus concrete `PromotionService`); preserve until intentional dedupe.
- CORS policy `AllowBlazorApp` must allow Blazor `:5192`/`:7190`.

## Testing Requirements

- `dotnet build dotnet_backend.sln` (from this dir) or `make build-backend` from root.
- `dotnet run --project dotnet-backend.csproj` needs `../.env` + MySQL `make db-up && make db-wait`.

## Dependencies

| Area | Packages |
|---|---|
| Data | Pomelo MySQL 9.0, EFCore 9.0.9, EFCore.Design |
| Auth | JWT Bearer 10.0, BCrypt.Net-Next 4.0 |
| Infra | AWSSDK.S3 4.0, QuestPDF 2025.7, DotNetEnv 3.1 |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
