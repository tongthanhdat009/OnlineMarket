<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# Migrations

## Purpose

EF Core migrations for the MySQL database. Generated artefacts — edit the model and regenerate, do not hand-edit the migration bodies.

## Key Files

| File | Description |
|---|---|
| `20260807135237_InitialCreate.cs` | Base schema: users, roles, permissions, products, categories, suppliers, inventory, orders, order items, payments, bills, promotions, cart items, customers, refund requests |
| `20260808042518_ImportLegacySeedData.cs` | Moves the legacy SQL seed into EF `HasData` |
| `20260831011846_AddAgentOperationsConsole.cs` | Adds `agents`, `agent_tools`, `agent_runs`, `agent_events`, `agent_tool_calls`, `agent_reports`, `admin_chat_sessions`, `admin_chat_messages` |
| `20260831063357_UpdateAdminAgentModel.cs` | Adjusts the agent model (system instructions, model, temperature, max tool rounds) |
| `20261008051602_AddAuditLog.cs` | Adds the `audit_logs` table |
| `ApplicationDbContextModelSnapshot.cs` | The model snapshot `dotnet ef` diffs against — do not hand-edit |
| `*.Designer.cs` | Per-migration model snapshot |

## For AI Agents

### Working In This Directory

- Regenerate with `dotnet ef migrations add <Name> --project dotnet-backend.csproj` from `dotnet-backend/dotnet_backend/`. The local tool version is pinned in `../../dotnet-tools.json` (`dotnet-ef` 9.0.9).
- The migration **name** becomes part of the deployment artifact — the staging release bundles all migrations into `efbundle` and applies them in order. Never rename or delete an applied migration; add a new one instead.
- `ApplicationDbContextModelSnapshot.cs` is regenerated with the migration. A dirty snapshot makes the next migration diff wrong.
- `Program.cs` calls `Database.Migrate()` in Development only. Staging applies migrations from the `efbundle` built in `.github/workflows/staging.yml`.
- The Pomelo provider version (`MySqlServerVersion(10,4,0)` in `../Program.cs`, `8,0,0` in `../../dotnet-backend/docker-compose.yml` context) affects the generated SQL. Keep the design-time factory in `../Database/ApplicationDbContextFactory.cs` in sync with it.

### Testing Requirements

- `dotnet build ../dotnet_backend.sln`.
- Apply against a disposable local DB: `make db-up && make db-wait`, then `dotnet ef database update --project dotnet-backend.csproj`. Auto-migration on `make dev-api` is an equivalent check.
- The migration must apply on **MySQL 8** (production/staging), not only on MariaDB 10.4 — check for `HasColumnType`/index syntax that only one of them accepts.

### Common Patterns

- Migration timestamps are `yyyyMMddHHmmss` UTC — the ordering is the file name, not the git order.
- Seed data changes belong in `../Database/ModelSeedData.cs` and produce a new migration; editing `HasData` without a migration silently desyncs the DB.

## Dependencies

### Internal

- `../Database/ApplicationDbContext.cs` — the model being migrated
- `../Models/` — the entities
- `../Database/ApplicationDbContextFactory.cs` — design-time connection
- `../../dotnet-tools.json` — `dotnet-ef` version

### External

- `Microsoft.EntityFrameworkCore.Design` 9.0.9
- `Pomelo.EntityFrameworkCore.MySql` 9.0.0

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
