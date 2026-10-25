<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# plans

## Purpose

Implementation plans written before a feature lands. Each states the goal, the architecture, hard constraints, and a task breakdown.

## Key Files

| File | Description |
|---|---|
| `2026-08-30-ai-agents-console.md` | Plan for the AI Agents admin operations console: persisted `AgentRuntime`, code-owned tool registry, EF history, in-process SSE |
| `2026-09-29-customer-react-storefront.md` | Plan for replacing the Blazor customer app with `frontend-customer/` |
| `2026-09-29-react-admin-frontend.md` | Plan for the `frontend/` React admin console against the .NET contract |
| `2026-09-30-spa-api-integration.md` | Plan to replace admin mock data with real API queries and verify the customer API wiring |

## For AI Agents

### Working In This Directory

- New plans use `YYYY-MM-DD-<feature>.md`.
- Every plan opens with `**Goal:**`, `**Architecture:**`, `**Tech Stack:**` and a `## Global Constraints` section. Keep that shape — the constraints are what later audits and reviewers check against.
- Plans are English; the specs they cite are also English. The user-facing docs (`../OPERATIONS_AND_FEATURES.md`) are Vietnamese.
- A plan is a pre-commit artifact. Once the work lands, the plan stays as the record of the intended approach — do not retrofit it to match the code.

### Testing Requirements

- None. A plan lists the checks the implementation must satisfy, not tests to run now.

### Common Patterns

- Constraints are stated as absolute negatives ("no arbitrary SQL", "no new frontend dependency", "API JSON remains PascalCase") — keep that phrasing, it is what gets enforced later.
- Task breakdowns are ordered so that shared contracts land before the UI that consumes them.

## Dependencies

### Internal

- `../specs/` — the accepted designs these plans implement
- `../../frontend/`, `../../frontend-customer/` — the apps being planned
- `../../dotnet-backend/dotnet_backend/` — the API contract the plans must preserve

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
