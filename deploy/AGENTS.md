<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# deploy

## Purpose

Deployment artefacts. One environment lives here today: staging on a single VPS behind nginx + PM2.

## Key Files

_(none — this directory only groups the staging release files in `staging/`.)_

## Subdirectories

| Directory | Purpose |
|---|---|
| `staging/` | nginx vhost, PM2 ecosystem, systemd unit, bootstrap + release scripts for the staging VPS (see `staging/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Never put a secret, private key, host password or `.env` payload in this tree. Secrets travel as GitHub Actions secrets and as `shared/backend.env` on the VPS.
- Scripts are bash and are expected to be safe to re-run (`set -Eeuo pipefail`, `umask 077`, explicit existence checks).
- `staging/deploy.sh` is the release entrypoint; the systemd unit in that folder is legacy and must not be enabled alongside PM2 — they both bind port `17000`.

### Testing Requirements

- `bash -n <script>` for a syntax check.
- `shellcheck` if it is installed locally.
- Never test a deploy script against a host you were not asked to touch. `deploy.sh` performs real migrations and real PM2 restarts.

### Common Patterns

- Secrets enter a process only through that process's own environment (`pm2` ecosystem `env`, `EnvironmentFile=`), never through the invoking shell.
- Release layout is `/opt/onlinemarket-staging/{releases/<id>,shared/backend.env,current}` with `current` a symlink.
- Health-gated rollout: migrate → switch symlink → health check → `pm2 save`; on failure, roll the symlink back to the previous release.

## Dependencies

### Internal

- `../dotnet-backend/dotnet_backend/` — the API published into the release
- `../frontend/`, `../frontend-customer/` — the SPAs published into the release
- `../.github/workflows/staging.yml` — the CI job that builds and ships these files

### External

- nginx — reverse proxy and static file server
- PM2 — process supervisor for API + both static servers
- MySQL 8 (`mysql:8.4` container) — staging database
- `dotnet-ef` — produces the migration bundle

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
