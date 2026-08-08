<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Database

## Purpose

EF Core DbContext mappings plus MySQL/MariaDB schema and seed data.

## Key Files

| File                      | Description                        |
| ------------------------- | ---------------------------------- |
| `ApplicationDbContext.cs` | DbSets and fluent entity mappings. |
| `ModelSeedData.cs`        | EF Core model-managed seed data.   |
| `schema.sql`              | Database schema definition.        |

## For AI Agents

### Working In This Directory

- Coordinate entity/schema changes with `../Models/`, services, and DTOs.
- Preserve constraints, keys, and production data compatibility.
- Do not add credentials to SQL or configuration.

### Testing Requirements

- Build `../dotnet_backend.sln`; apply schema changes only against a disposable local database.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
