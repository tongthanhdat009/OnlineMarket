<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Database

EF Core `DbContext` + model-managed seed; MariaDB 10.4 via Pomelo.

## Key Files

| File | Description |
|---|---|
| `ApplicationDbContext.cs` | `DbSet<>`s + fluent mappings (keys, constraints, relations) |
| `ApplicationDbContextFactory.cs` | Design-time factory for `dotnet ef` tooling |
| `ModelSeedData.cs` | `HasData` seed invoked from `OnModelCreating` |
| `schema.sql` *(if present)* | Legacy/reference DDL — not applied at runtime |

## For AI Agents

- Keep `HasData` keys stable; changing seed IDs requires a migration.
- Preserve FK constraints/indices; test against disposable DB (`make db-reset` then `dotnet ef database update` or app auto-migration).
- Never commit credentials; `DefaultConnection` comes from `appsettings.json` → `.env`.
- Factory must stay in sync with `Program.cs` `UseMySql` version (`MariaDB 10.4`).

## Testing Requirements

- `dotnet build dotnet_backend.sln`; for seed/schema change: `make db-up && make db-wait` then verify migration applies cleanly.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
