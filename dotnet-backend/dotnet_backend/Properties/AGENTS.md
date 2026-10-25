<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# Properties

## Purpose

`launchSettings.json` — the .NET launch profiles. One file.

## Key Files

| File | Description |
|---|---|
| `launchSettings.json` | Two profiles. `http`: `applicationUrl` `http://localhost:7000`, `launchBrowser: true`, `ASPNETCORE_ENVIRONMENT=Development` — the canonical dev API port. `https`: `https://localhost:7090;http://localhost:5136`, no browser. |

## For AI Agents

### Working In This Directory

- The `http` profile's port `7000` is referenced by the Vite dev proxies in `frontend/vite.config.ts` and `frontend-customer/vite.config.ts`, by the backend CORS allowlist, and by `Makefile`. Changing it breaks all three.
- `ASPNETCORE_ENVIRONMENT=Development` is what enables the auto-migrate + agent-tool seed block in `../Program.cs`. Without it, the API starts against an unmigrated database.
- `launchSettings.json` is read by `dotnet run` only. The Makefile sets `ASPNETCORE_ENVIRONMENT` in the shell as well, so `make dev-api` works even if the profile changes.
- The `https` profile is a leftover from the old Blazor-era setup and is not used by any script in this repo.

### Testing Requirements

- `dotnet build ../dotnet_backend.sln` after changing it (it is copied to the output as part of the build).
- `make dev-api` then `curl http://localhost:7000/api/test` to confirm the port.

### Common Patterns

- Keep one profile per purpose and name it consistently (`http` here, not `Api`).
- Ports in this file are duplicated in three other places — when you change one, grep for the old value.

## Dependencies

### Internal

- `../Program.cs` — reads `ASPNETCORE_ENVIRONMENT`
- `../../../frontend/vite.config.ts`, `../../../frontend-customer/vite.config.ts` — proxy target `:7000`
- `../../../Makefile` — `dev-api`, `urls`

### External

- None. This is a .NET SDK convention file.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
