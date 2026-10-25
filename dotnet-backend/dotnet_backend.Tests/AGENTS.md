<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# dotnet_backend.Tests

## Purpose

xUnit unit-test project referencing the API project. Small — it covers the agent subsystem's pure logic, not the HTTP surface.

## Key Files

| File | Description |
|---|---|
| `dotnet_backend.Tests.csproj` | `net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, `IsPackable=false`. Packages: `xunit` 2.9.3, `xunit.runner.visualstudio` 3.1.4, `Microsoft.NET.Test.Sdk` 17.14.1, `coverlet.collector` 6.0.4. `ProjectReference` to `../dotnet_backend/dotnet-backend.csproj`. |
| `UnitTest1.cs` | Class `AgentOperationsTests` (file name is a leftover from the template — the class is what matters). Five tests: sanitizer redacts secrets/emails/JWT/bearer values and caps the payload at 8 KiB while staying valid JSON; `AgentRunStatus.IsTerminal` for the six run states; the tool registry has exactly 6 definitions, all `READ_ONLY`, and rejects `execute_sql`. |

## For AI Agents

### Working In This Directory

- Tests exercise **static/pure** members only — `AgentPayloadSanitizer.Sanitize`, `AgentRunStatus.IsTerminal`, `AdminAiToolRegistry.Definitions` / `IsAllowed`. There is no `WebApplicationFactory` and no database fixture; anything needing one would be new infrastructure, not an incremental test.
- The tool-registry test asserts `Assert.Equal(6, ...)`. Adding a tool breaks it — that is intentional, it forces a conscious review of the registry.
- `UnitTest1.cs` no longer matches its contents. Rename it to `AgentOperationsTests.cs` when you next touch it, or add new test files with descriptive names.
- The project is **not** referenced by the Makefile. `make build` does not build or run it, and `.github/workflows/ci.yml` does not run it either.

### Testing Requirements

```bash
dotnet test dotnet-backend/dotnet_backend.Tests/dotnet_backend.Tests.csproj
```

- From the repo root the path is `dotnet-backend/dotnet_backend.Tests/dotnet_backend.Tests.csproj`.
- The test project builds the API project first, so a compile error in the API fails the test run.

### Common Patterns

- `Fact` for a single assertion set, `Theory` + `InlineData` for a value table (`AgentRunStatus` terminal states use this).
- Assertions are on the returned value, never on log output.
- No mocking library is installed. If you need to fake a dependency, hand-roll a stub rather than adding a package.

## Dependencies

### Internal

- `../dotnet_backend/Services/AgentRuntime.cs` — `AgentPayloadSanitizer`, `AgentRunStatus`
- `../dotnet_backend/Services/AdminAiToolRegistry.cs` — the tool definitions
- `../dotnet_backend/Models/AgentOperations.cs` — `AgentRunStatus` constants

### External

- xunit 2.9.3 + runner 3.1.4
- Microsoft.NET.Test.Sdk 17.14.1
- coverlet.collector 6.0.4

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
