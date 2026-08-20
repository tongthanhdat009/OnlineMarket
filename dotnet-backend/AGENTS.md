<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# dotnet-backend

Solution container for the ASP.NET Core API. Real code lives in `dotnet_backend/`; this dir owns orchestration.

## Key Files

| File | Description |
|---|---|
| `dotnet-backend.sln` | Outer solution (also present as `dotnet_backend/dotnet_backend.sln` — canonical build uses inner path) |
| `dotnet_backend/dotnet-backend.csproj` | Project file (`net10.0`, `RootNamespace=dotnet_backend`) |
| `docker-compose.yml` | MySQL 8.0 `db` on `127.0.0.1:3308` → `store_management` (healthcheck `mysqladmin ping`) |
| `.env.example` | Template for `AWS_*`, `Jwt__*`, `VNPay:*`, `ConnectionStrings:DefaultConnection`; `.env` is gitignored |
| `README.md` | Vietnamese API architecture & run notes |

## Subdirectories

| Directory | Purpose |
|---|---|
| `dotnet_backend/` | API project — controllers, services, models, DTOs, DB, migrations (see `dotnet_backend/AGENTS.md`) |

## For AI Agents

- Always `make env` / copy `.env.example` → `.env` and fill `Jwt__Secret` before `make dev-api`; `Program.cs` does `Env.Load(…/.env)` with `GetSetting` fallback `AWS:Key` ↔ `AWS_KEY`.
- Build via `dotnet build dotnet_backend/dotnet_backend.sln` (inner sln is canonical; outer may drift).
- `docker compose -f docker-compose.yml` is wrapped as `make db-up`/`db-wait`/`db-reset` (volume `local-mysql-data`).

## Testing Requirements

- `dotnet build dotnet_backend/dotnet_backend.sln` after any API change.
- No test project; manual smoke via `dotnet_backend/dotnet-backend.http` (or `make dev-api` + curl/Swagger at `http://localhost:7000/swagger` if enabled).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
