<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# .github

## Purpose

Repository automation.

## Key Files

_(none — this directory only groups the workflow definitions in `workflows/`.)_

## Subdirectories

| Directory | Purpose |
|---|---|
| `workflows/` | CI build gate and staging deploy (see `workflows/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Workflow files are the only thing that lives under `.github/` in this repo. Do not add issue templates or PR templates without being asked.
- Secrets are referenced by name only (`secrets.STAGING_*`). Never inline a value into a workflow file.
- The staging workflow runs on every push to `main` and is not gated on CI passing — both jobs are independent. Keep that in mind before pushing.

### Testing Requirements

- Validate the YAML locally: `python -c "import yaml,sys;yaml.safe_load(open('workflows/ci.yml'))"`.
- There is no local runner for GitHub Actions. `act` is not set up in this repo.

### Common Patterns

- Pin actions to a major tag (`actions/checkout@v4`) as the existing workflows do; do not introduce floating tags.
- Use `set -euo pipefail` at the top of any multi-line `run:` block.

## Dependencies

### Internal

- `../workflows/` — the workflow definitions
- `../dotnet-backend/`, `../frontend/`, `../frontend-customer/` — what CI builds
- `../deploy/staging/` — what the staging workflow ships

### External

- GitHub Actions, `actions/setup-dotnet`, `actions/setup-node`, `webfactory/ssh-agent`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
