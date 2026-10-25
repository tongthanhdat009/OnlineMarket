<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# dotnet-backend

## Purpose

Solution container for the ASP.NET Core API. Real code lives in `dotnet_backend/`; this dir owns orchestration.

## Key Files

| File | Description |
|---|---|
| `dotnet-backend.sln` | Outer solution (also present as `dotnet_backend/dotnet_backend.sln` — canonical build uses inner path) |
| `dotnet_backend/dotnet-backend.csproj` | Project file (`net10.0`, `RootNamespace=dotnet_backend`) |
| `docker-compose.yml` | MySQL 8.0 `db` on `127.0.0.1:3308` → `store_management` (healthcheck `mysqladmin ping`) |
| `.env.example` | Template for `AWS_*`, `Jwt__*`, `VNPay:*`, `ConnectionStrings:DefaultConnection`; `.env` is gitignored |
| `.env` | Real runtime config — gitignored, required by `make dev-api` |
| `README.md` | Vietnamese API architecture & run notes |
| `ADMIN_API_REFERENCE.md` | Endpoint reference for the admin console |
| `AI_AGENTS_OPERATIONS.md` | Notes on the AI agent operations console (runtime, tools, runs, reports) |
| `dotnet-tools.json` | Local tool manifest — `dotnet-ef` 9.0.9 |

## Subdirectories

| Directory | Purpose |
|---|---|
| `dotnet_backend/` | API project — controllers, services, models, DTOs, DB, migrations, middleware (see `dotnet_backend/AGENTS.md`) |
| `dotnet_backend.Tests/` | xUnit test project referencing the API project (see `dotnet_backend.Tests/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Always `make env` / copy `.env.example` → `.env` and fill `Jwt__Secret` before `make dev-api`; `Program.cs` does `Env.Load(…/.env)` with `GetSetting` fallback `AWS:Key` ↔ `AWS_KEY`.
- Build via `dotnet build dotnet_backend/dotnet_backend.sln` (inner sln is canonical; outer may drift).
- `docker compose -f docker-compose.yml` is wrapped as `make db-up`/`db-wait`/`db-reset` (volume `local-mysql-data`).
- `make db-reset` runs `docker compose down -v` — it destroys the local database volume. Ask before running it.

### Testing Requirements

- `dotnet build dotnet_backend/dotnet_backend.sln` after any API change.
- `dotnet test dotnet_backend.Tests/dotnet_backend.Tests.csproj` for the unit suite.
- Manual smoke via `dotnet_backend/dotnet-backend.http` (or `make dev-api` + curl/Swagger at `http://localhost:7000/swagger` if enabled).

### Common Patterns

- The outer `dotnet-backend.sln` and the inner `dotnet_backend/dotnet_backend.sln` both exist. The inner one is canonical — always build that one.
- `docker compose` is only ever invoked through the `Makefile` targets, so the volume name and the port stay in one place.

## Dependencies

### Internal

- `dotnet_backend/` — the API project (see `dotnet_backend/AGENTS.md`)
- `dotnet_backend.Tests/` — the xUnit project (see `dotnet_backend.Tests/AGENTS.md`)
- `../Makefile` — wraps every `docker compose` and `dotnet`/`npm` command
- `../.env.example` — the template for the gitignored `.env`

### External

- .NET SDK 10 — builds and runs the API and the test project
- Docker Engine + Compose v2 — MySQL 8.0 on `127.0.0.1:3308`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
