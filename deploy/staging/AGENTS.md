<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# staging

## Purpose

Staging release plumbing for the VPS `vps-hk`. API + admin SPA + customer SPA run under PM2 behind nginx; MySQL 8 runs in a container.

## Key Files

| File | Description |
|---|---|
| `nginx.conf` | Two vhosts — customer on `127.0.0.1:18080` (`staging-online-market.jadt.io.vn`), admin on `127.0.0.1:18081` (`staging-admin-online-market.jadt.io.vn`). Both proxy `/api/` → `127.0.0.1:17000` with a 1250 s timeout for AI streaming, and serve the SPA with `try_files … /index.html`, `no-store` on `index.html` and `immutable` on `/assets/`. |
| `ecosystem.config.cjs` | PM2 config for three processes: `onlinemarket-staging-api` (fork, `ASPNETCORE_URLS=http://127.0.0.1:17000`), `-admin` (`pm2-serve` on 15173), `-customer` (`pm2-serve` on 15193). Reads `shared/backend.env` with `node:util parseEnv`. |
| `deploy.sh` | Release entrypoint: validates the release dir and `backend.env` mode `600`, runs the EF migration bundle, flips the `current` symlink, health-checks API + both SPAs, `pm2 save`, and rolls back the symlink on failure. Migrations are never rolled back. |
| `bootstrap-vps.sh` | Idempotent one-time VPS setup: staging user/group, `/opt/onlinemarket-staging/{releases,shared}`, nginx vhost, MySQL DB + user via `docker exec mysql-container`, `pm2 startup systemd`. Does not run `pm2 save`. |
| `onlinemarket-staging.service` | Legacy/optional systemd unit. Reads `shared/staging.env` while the current PM2 flow reads `shared/backend.env` — do not enable it next to PM2 (port 17000 collision). |
| `9router.compose.yml` | Local AI-gateway container (`9router:local`, port 20128). Unrelated to the staging release — do not ship it in a release. |
| `README-staging.md` | Operator runbook: port table, secrets table, bootstrap → deploy → watch order, rollback and reboot behaviour. |

## For AI Agents

### Working In This Directory

- Read `README-staging.md` first — it is the authoritative runbook and states which files are legacy.
- `deploy.sh` takes exactly one argument: the release id, matched against `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.
- `shared/backend.env` must exist with mode `600`; the script refuses to run otherwise. Do not relax that check.
- `backend.env` is streamed over SSH stdin by CI and never echoed. Keep it that way.
- Migration output goes to `shared/migration-<release-id>.log` (mode `600`) because provider errors can contain credentials.

### Testing Requirements

- `bash -n deploy.sh bootstrap-vps.sh` and `node --check ecosystem.config.cjs` before shipping a change.
- `nginx -t` is run by `bootstrap-vps.sh` after installing the vhost; run it manually when editing `nginx.conf`.
- The release is health-gated by `deploy.sh` itself: `/api/test`, `/api/test/mysql`, and both SPA roots must serve the new `index.html` before the release is accepted.

### Common Patterns

- `flock` on `$root/.deploy.lock` serialises concurrent deploys.
- `pm2` is invoked through `env -i` so API credentials never reach the PM2 daemon environment.
- SPA asset directories get `chmod -R a+rX`; `index.html` gets `644` — the nginx worker user must be able to read them.
- Health checks compare the served `index.html` byte-for-byte against the release directory, which catches a stale symlink.

## Dependencies

### Internal

- `../../.github/workflows/staging.yml` — builds and ships this folder
- `../../dotnet-backend/dotnet_backend/` — the published API
- `../../frontend/`, `../../frontend-customer/` — the published SPAs

### External

- nginx, PM2 (+ `pm2-serve`), `node:util parseEnv`
- `mysql:8.4` container named `mysql-container`
- `dotnet-ef` 9.0.9 — migration bundle (`efbundle`)
- SSH + `webfactory/ssh-agent` — CI transport

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
