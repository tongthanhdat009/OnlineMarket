<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# tests

## Purpose

Spec files, split by the app under test. `playwright.config.ts` maps `tests/customer/**` to the `customer` project and `tests/admin/**` to the `admin` project.

## Key Files

_(none — this directory only groups the admin and customer spec folders.)_

## Subdirectories

| Directory | Purpose |
|---|---|
| `admin/` | Admin console specs — auth, catalog, dashboard, finance/admin, orders (see `admin/AGENTS.md`) |
| `customer/` | Storefront specs — account, cart-checkout, catalog, checkout-api, login (see `customer/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- One `*.spec.ts` per feature area; the area name must match the Playwright project layout or the spec will not be collected.
- Shared login helpers live next to the specs as `helpers.ts` in each project folder. There is no cross-project shared module — the two apps have different auth contracts (admin JWT pair vs customer single token).
- Do not add a `data-testid` selector that does not exist in the SPA. Add the attribute in the SPA first, or target role/text.
- Specs assert on user-visible outcome (rows rendered, labels shown), not on internal component state.

### Testing Requirements

```bash
cd e2e
npx playwright test tests/admin          # admin only
npx playwright test tests/customer       # customer only
npx playwright test --project=customer --grep "checkout"
```

- Every spec runs against staging and changes real staging data. Do not point `baseURL` at a local dev server without also repointing the hardcoded host constants in each `helpers.ts`.

### Common Patterns

- `test.describe(...)` blocks group by area; a `test()` per user-visible behaviour.
- Login is done once per test via the project helper, then the spec navigates directly.
- API-level assertions use `page.evaluate` with `fetch` against the absolute staging origin — the SPA is same-origin only in production.

## Dependencies

### Internal

- `../../frontend/` — admin SPA
- `../../frontend-customer/` — customer SPA
- `../../dotnet-backend/dotnet_backend/` — API under test
- `../playwright.config.ts` — project mapping and shared `use` options

### External

- `@playwright/test` `^1.63.0`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
