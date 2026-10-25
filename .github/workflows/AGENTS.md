<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# workflows

## Purpose

Two GitHub Actions workflows: a build gate and a staging deploy.

## Key Files

| File | Description |
|---|---|
| `ci.yml` | On every pull request and every push to `main`: builds the API (`dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln`), then `npm ci` + `npm run build` for the admin SPA and the customer SPA with `VITE_API_URL=/api`. No tests are run, no artefact is uploaded. |
| `staging.yml` | On push to `main` and on manual dispatch: publishes the API self-contained for `linux-x64`, builds an EF migration bundle (`dotnet-ef` 9.0.9, `--self-contained`), builds both SPAs, assembles `release/` (api, migrations, admin, customer, `deploy/ecosystem.config.cjs`, `deploy/deploy.sh`) into `release-<sha>.tar.gz`, then SSHes to the staging VPS, extracts it, streams `STAGING_BACKEND_ENV` into `shared/backend.env` (mode 600) and runs `deploy.sh <sha>`. `concurrency: staging` with `cancel-in-progress: false`. |

## For AI Agents

### Working In This Directory

- `VITE_API_URL=/api` in both workflows is deliberate: the deployed SPAs are served same-origin behind nginx, which proxies `/api/` to the API. A relative value keeps the SPA off CORS.
- The staging job has no environment gate — any push to `main` deploys. Add one if that is ever wanted; do not change it silently.
- `STAGING_BACKEND_ENV` is passed as an env var and piped to `ssh` over stdin; it is never echoed. Keep it that way.
- The deploy step relies on `deploy.sh` to fail the step: `deploy.sh` exits non-zero on a failed health check and rolls the app release back.
- `chmod 755` is applied to the release dirs and `644` to `index.html` before extraction — the nginx worker user must be able to read them.

### Testing Requirements

- `python -c "import yaml,sys;yaml.safe_load(open('ci.yml'))"` and the same for `staging.yml`.
- A staging deploy is verified by the job result plus `gh run watch`; the deploy script's own health checks are the real gate.
- There is no CI step that runs the unit tests or the Playwright suites. If you add one, keep it in `ci.yml` and make it non-blocking until the suites are green.

### Common Patterns

- Actions pinned to a major version tag (`actions/checkout@v4`, `actions/setup-dotnet@v4`, `actions/setup-node@v4`, `webfactory/ssh-agent@v0.9.0`).
- npm cache keyed on `frontend/package-lock.json` and `frontend-customer/package-lock.json`.
- Release id is the commit SHA — `deploy.sh` accepts `[A-Za-z0-9][A-Za-z0-9._-]{0,127}`.

## Dependencies

### Internal

- `../../dotnet-backend/dotnet_backend/` — API project and solution
- `../../frontend/`, `../../frontend-customer/` — the SPAs
- `../../deploy/staging/` — `deploy.sh` + `ecosystem.config.cjs` copied into the release

### External

- GitHub Actions runners (`ubuntu-latest`)
- .NET SDK `10.0.x`, Node `20`
- SSH key pair — `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY`, `STAGING_BACKEND_ENV`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
