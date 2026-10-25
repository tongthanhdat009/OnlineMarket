<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# specs

## Purpose

Accepted design documents. A spec states the goal, scope, product shape and data/component boundaries; the matching plan in `../plans/` breaks it into tasks.

## Key Files

| File | Description |
|---|---|
| `2026-08-30-ai-agents-console-design.md` | Design for the AI Agents operations console — baseline analysis, agent runtime, tool registry risk model, SSE delivery |
| `2026-09-29-customer-react-storefront-design.md` | Design for the customer storefront — phase scope, anonymous vs authenticated areas, response-wrapper normalisation |
| `2026-09-29-react-admin-frontend-design.md` | Design for the admin console — 240–260px sidebar shell, dense tables, right drawers, deep-linkable routes |

## For AI Agents

### Working In This Directory

- New specs use `YYYY-MM-DD-<feature>-design.md`.
- Each spec opens with `## Goal` and `## Scope` (or `## Current baseline` when it supersedes existing behaviour). Keep that structure.
- A spec is the accepted contract. If the code diverges, change the spec deliberately with a dated note — do not silently let the code become the spec.
- Specs are in Vietnamese for the two React apps and English for the AI console, matching the source the design was written against. Follow the language of the sibling spec you extend.

### Testing Requirements

- None. Specs describe intent; verification belongs to the plan and the test suites.

### Common Patterns

- Phase-scoped bullets for multi-phase designs ("Phase triển khai trong app này: …").
- Explicit "must not" lists for scope boundaries — the customer spec names the exact routes that need a JWT and the ones that do not.
- Cross-references to the API route names and the PascalCase JSON contract.

## Dependencies

### Internal

- `../plans/` — the implementation plans that consume these specs
- `../../dotnet-backend/dotnet_backend/` — the API contract the specs pin down
- `../../frontend/`, `../../frontend-customer/` — the apps the specs describe

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
