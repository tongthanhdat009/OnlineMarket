<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# dotnet_backend

## Purpose

.NET 9 ASP.NET Core Web API. Request flow: controller → service contract/implementation → EF Core `ApplicationDbContext` → MySQL/MariaDB.

## Key Files

| File                    | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `Program.cs`            | Composition root: EF Core, JWT, CORS, service registrations, middleware. |
| `dotnet-backend.csproj` | .NET SDK target and NuGet dependencies.                                  |
| `appsettings.json`      | Runtime configuration; never add secrets.                                |
| `dotnet-backend.http`   | Manual API smoke requests.                                               |

## Subdirectories

| Directory      | Purpose                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| `Controllers/` | Attribute-routed HTTP endpoints (see `Controllers/AGENTS.md`).                       |
| `Services/`    | Domain logic and integrations (see `Services/AGENTS.md`).                            |
| `Dtos/`        | API request/response transport types (see `Dtos/AGENTS.md`).                         |
| `Models/`      | EF Core entity models (see `Models/AGENTS.md`).                                      |
| `Database/`    | DbContext, model-managed seed data, and schema reference (see `Database/AGENTS.md`). |
| `Properties/`  | Local launch profiles (see `Properties/AGENTS.md`).                                  |

## For AI Agents

### Working In This Directory

- Preserve nullable reference types and implicit usings.
- Register each new service/interface binding in `Program.cs`.
- Keep DTOs separate from EF entities; preserve controller → service boundaries.
- Keep credentials out of committed configuration; use environment variables or a secret store.

### Testing Requirements

- Run `dotnet build dotnet_backend.sln`.
- No automated test project. Use `dotnet-backend.http` only for manual local smoke checks.

## Dependencies

### External

- EF Core/Pomelo MySQL, JWT Bearer, BCrypt, AWS S3, QuestPDF.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
