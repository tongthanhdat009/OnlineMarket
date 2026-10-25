<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# docs

## Purpose

Prose-only documentation: operations handbook, audit reports, implementation plans, design specs. No runnable code lives here.

## Key Files

| File | Description |
|---|---|
| `OPERATIONS_AND_FEATURES.md` | 235-line Vietnamese handbook of every component, port, config group and business flow; derived from the source as of 2026-08-29 |

## Subdirectories

| Directory | Purpose |
|---|---|
| `audits/` | Point-in-time defect reports with fix tables (see `audits/AGENTS.md`) |
| `plans/` | Implementation plans written before a feature lands (see `plans/AGENTS.md`) |
| `specs/` | Approved designs that plans reference (see `specs/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Files are named `YYYY-MM-DD-<slug>.md` — keep that convention when adding new documents.
- Plans (`plans/`) state goal/architecture/constraints and a task breakdown; specs (`specs/`) state the accepted design. A plan usually cites a spec; a spec never cites a plan.
- Write in Vietnamese to match the existing docs, unless the audience is explicitly the English-language plan archive.
- Never paste secrets, real `.env` values, or production connection strings into a document.
- Document behaviour, not aspirations. If a doc describes a feature that no longer exists, update or delete the doc rather than leaving a stale claim.

### Testing Requirements

- No build step. After editing, re-read the file for broken Markdown tables and dead relative links (`../../frontend/...` style).
- If a doc asserts a port, route, or env var name, verify it against `Makefile` / `Program.cs` / `appsettings*.json` before keeping the claim.

### Common Patterns

- `> ` blockquote at the top for status/date/scope, then numbered sections.
- Tables for anything that maps several items to several attributes (routes, ports, secrets, env keys).
- Every doc opens with a scope line naming what the document covers and what it excludes.

## Dependencies

### Internal

- `../Makefile` — canonical commands and ports referenced by the docs
- `../dotnet-backend/dotnet_backend/` — the API whose behaviour the docs describe
- `../frontend/`, `../frontend-customer/` — the SPAs the docs describe
- `../deploy/staging/` — staging topology referenced by the operations handbook

### External

- None. Docs are plain Markdown.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
