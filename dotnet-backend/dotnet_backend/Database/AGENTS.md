<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Database

## Purpose

EF Core `DbContext` + model-managed seed; MariaDB 10.4 via Pomelo (MySQL 8 in production/staging).

## Key Files

| File | Description |
|---|---|
| `ApplicationDbContext.cs` | `DbSet<>`s + fluent mappings (keys, constraints, relations) for the core store domain |
| `ApplicationDbContext.AgentOperations.cs` | Partial `DbContext` — the `DbSet`s for the AI agent console (`Agent`, `AgentTool`, `AgentRun`, `AgentEvent`, `AgentToolCall`, `AgentReport`, `AdminChatSession`, `AdminChatMessage`) |
| `ApplicationDbContext.AuditLog.cs` | Partial `DbContext` — the `AuditLog` `DbSet` |
| `ApplicationDbContextFactory.cs` | Design-time factory for `dotnet ef` tooling |
| `ModelSeedData.cs` | `HasData` seed invoked from `OnModelCreating` |

## For AI Agents

### Working In This Directory

- Keep `HasData` keys stable; changing seed IDs requires a migration.
- Preserve FK constraints/indices; test against disposable DB (`make db-reset` then `dotnet ef database update` or app auto-migration).
- Never commit credentials; `DefaultConnection` comes from `appsettings.json` → `.env`.
- Factory must stay in sync with `Program.cs` `UseMySql` version (`MariaDB 10.4`).
- The `DbContext` is split into three files. Add a new agent/audit entity to the matching partial, not to `ApplicationDbContext.cs`.
- `Program.cs` seeds the chart/agent tools for `AgentId == 1` in the Development branch only — it is not part of `ModelSeedData` and will not run on staging.

### Testing Requirements

- `dotnet build dotnet_backend.sln`; for seed/schema change: `make db-up && make db-wait` then verify migration applies cleanly.
- The migration must also apply on **MySQL 8** — check for MariaDB-only SQL.

### Common Patterns

- One `DbSet` per entity, declared in the matching partial file.
- Fluent mappings over data annotations, so the C# classes stay POCOs.

## Dependencies

### Internal

- `../Models/` — the entities mapped here
- `../Migrations/` — the generated schema history
- `../Program.cs` — `UseMySql` + the dev-only `Database.Migrate()` call

### External

- Pomelo.EntityFrameworkCore.MySql 9.0.0 — the MySQL provider
- Microsoft.EntityFrameworkCore.Design 9.0.9 — the design-time factory support

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
