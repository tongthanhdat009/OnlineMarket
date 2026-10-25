<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# e2e

## Purpose

Playwright end-to-end suites. They run against the **deployed staging environment**, not against a local dev server.

## Key Files

| File | Description |
|---|---|
| `playwright.config.ts` | `testDir: ./tests`, `fullyParallel: false`, `workers: 1`, `retries: 0`, `forbidOnly` in CI. `baseURL` is `https://staging-online-market.jadt.io.vn`. Two projects: `customer` (`tests/customer/**`) and `admin` (`tests/admin/**`). Trace/screenshot/video are `retain-on-failure`. |
| `package.json` | Only dependency is `@playwright/test` `^1.63.0`. The `test` script is a placeholder that exits 1 — invoke Playwright directly. |
| `package-lock.json` | Lockfile for the above. |

## Subdirectories

| Directory | Purpose |
|---|---|
| `tests/` | Spec files split by app (see `tests/AGENTS.md`) |
| `test-results/` | Generated Playwright artifacts — gitignored, safe to delete |

## For AI Agents

### Working In This Directory

- Run the suites with `npx playwright test`, not `npm test`. `npm test` in this folder is a placeholder that always fails.
- The admin project needs a base URL override for the admin host: `tests/admin/helpers.ts` hardcodes `https://staging-admin-online-market.jadt.io.vn` because `playwright.config.ts` sets only the customer `baseURL`.
- Credentials are hardcoded in the helpers (`admin`/`123456`, `kh1@mail.com`/`123456`). They are staging throwaway accounts — never promote a real account into these files.
- Helpers log in by calling the API directly and injecting tokens into storage, bypassing the login form. That is deliberate: it keeps the specs about the page under test, not about the login UI.
- There are no `data-testid` attributes anywhere in either SPA. Selectors must target role, text, or existing markup.

### Testing Requirements

```bash
cd e2e
npx playwright install          # browser binaries, once
npx playwright test             # both projects
npx playwright test --project=admin
npx playwright test tests/customer/cart-checkout.spec.ts
```

- The suite mutates staging data (it creates orders and refunds). Run it against staging, never against a seeded production database.
- `workers: 1` is intentional — the specs share one account and one cart.

### Common Patterns

- `test.describe('<App> — <area>')` per feature area; test titles start with a verb (`can …`, `page loads …`).
- Assertions wait on visible text or row counts rather than on animation.
- Failed runs leave `test-results/<suite>-<title>-<hash>/` folders containing the trace, screenshot and video.

## Dependencies

### Internal

- `../deploy/staging/` — the environment these specs exercise
- `../frontend/` — admin SPA under test
- `../frontend-customer/` — customer SPA under test
- `../dotnet-backend/dotnet_backend/` — the API under test

### External

- `@playwright/test` `^1.63.0`
- The staging host `staging-online-market.jadt.io.vn` and `staging-admin-online-market.jadt.io.vn`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
