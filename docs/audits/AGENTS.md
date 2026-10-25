<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# audits

## Purpose

Point-in-time defect reports. Each file is a snapshot taken on its date; it is a historical record, not living documentation.

## Key Files

| File | Description |
|---|---|
| `2026-10-01-full-audit.md` | 60-line full-stack audit: auth/JWT/RBAC leakage, password-hash exposure in `UserDto`, admin endpoint authorization gaps. Each row lists the defect, the fix, and the evidence. |

## For AI Agents

### Working In This Directory

- New audit files use `YYYY-MM-DD-<scope>-audit.md`.
- An audit must state its scope and the environment it was tested against before listing findings.
- Do not rewrite an old audit after the code changes — the value is that it records what was true on that date. Write a new audit instead.
- When a finding is fixed, leave the row in place; the fix column is the record.

### Testing Requirements

- None. Audits describe tests already executed; cite the command or the manual repro so the finding is checkable.

### Common Patterns

- A `| Khu vực | Lỗi | Sửa |` table is the dominant shape — one row per defect.
- Group findings by subsystem (auth, RBAC, data leak, frontend), then by severity.

## Dependencies

### Internal

- `../../dotnet-backend/dotnet_backend/Controllers/` — where authorization gaps were found
- `../../frontend/` — admin SPA audited alongside the API
- `../../frontend-customer/` — storefront audited alongside the API

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
