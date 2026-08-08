<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-07 -->

# dotnet-backend

## Purpose
Container for the ASP.NET Core API solution and its project.

## Key Files
| File | Description |
|---|---|
| `dotnet-backend.sln` | Top-level .NET solution. |
| `README.md` | API architecture, configuration, and run instructions. |
| `docker-compose.yml` | Orchestrates the API container. |
| `.env.example` | Environment variable template; `.env` is the local copy (gitignored). |

## Subdirectories
| Directory | Purpose |
|---|---|
| `dotnet_backend/` | ASP.NET Core Web API project (see `dotnet_backend/AGENTS.md`). |

## For AI Agents

### Working In This Directory
- Build through `dotnet_backend/dotnet_backend.sln`; application code lives under `dotnet_backend/`.

### Testing Requirements
- Run `dotnet build dotnet_backend/dotnet_backend.sln` after API changes.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
