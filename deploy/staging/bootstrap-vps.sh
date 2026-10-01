#!/usr/bin/env bash
#
# bootstrap-vps.sh — one-time staging host preparation for OnlineMarket.
#
# Run ONCE as root on the staging VPS:
#   STAGING_DB_NAME=<db> STAGING_DB_USER=<user> STAGING_DB_PASS=<pass> sudo -E ./bootstrap-vps.sh
#
# What it does (idempotent — safe to re-run):
#   1. Creates user/group `onlinemarket-staging` with a home directory
#      (the PM2 daemon runs as this user; no SSH setup is done here).
#   2. Creates /opt/onlinemarket-staging/{releases,shared} owned by that user.
#   3. Installs nginx.conf to /etc/nginx/sites-enabled (`nginx -t` + reload;
#      skipped with a warning when nginx is absent).
#   4. Creates the staging MySQL database+user inside the existing
#      `mysql-container` (MySQL 8.4). The backend is Pomelo MySQL-only
#      (Program.cs: UseMySql + MySqlServerVersion(8,0,0)), so the VPS
#      Postgres containers are unusable without a provider rewrite.
#   5. Installs the `pm2 startup systemd` unit for reboot persistence.
#
# What it does NOT do (by design):
#   - No `pm2 save` here: deploy.sh ends with `pm2 save` (deploy.sh:132) after
#     a healthy deploy. Correct order: bootstrap -> startup unit active ->
#     deploy -> save happens automatically. Saving now would persist nothing.
#   - No shared/backend.env: CI writes it from the STAGING_BACKEND_ENV secret
#     (deploy.sh requires it present with mode 600).
#   - Never prints credential values — only key names.
#
set -Eeuo pipefail

STAGING_USER=onlinemarket-staging
STAGING_HOME=/home/onlinemarket-staging
STAGING_ROOT=/opt/onlinemarket-staging
MYSQL_CONTAINER=mysql-container
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null && pwd)

die() { echo "bootstrap-vps.sh: $*" >&2; exit 1; }
log() { echo "bootstrap-vps.sh: $*"; }

[[ ${EUID:-$(id -u)} -eq 0 ]] || die "run as root (e.g. sudo -E ./bootstrap-vps.sh)."

# --- 0. Secrets arrive only via environment; refuse empty values. Key names only, never values.
: "${STAGING_DB_NAME:?missing env STAGING_DB_NAME}"
: "${STAGING_DB_USER:?missing env STAGING_DB_USER}"
: "${STAGING_DB_PASS:?missing env STAGING_DB_PASS}"
[[ $STAGING_DB_NAME =~ ^[A-Za-z0-9_]{1,64}$ ]] || die "STAGING_DB_NAME must match ^[A-Za-z0-9_]{1,64}$."
[[ $STAGING_DB_USER =~ ^[A-Za-z0-9_]{1,32}$ ]] || die "STAGING_DB_USER must match ^[A-Za-z0-9_]{1,32}$."

# --- 1. User/group (home is required: the PM2 daemon lives at ~/.pm2).
if id -u "$STAGING_USER" >/dev/null 2>&1; then
    log "user $STAGING_USER already exists; leaving it untouched."
else
    useradd --create-home --home-dir "$STAGING_HOME" --shell /bin/bash --user-group "$STAGING_USER"
    log "created user/group $STAGING_USER with home $STAGING_HOME."
fi

# --- 2. Directory layout expected by deploy.sh (STAGING_ROOT default).
install -d -o "$STAGING_USER" -g "$STAGING_USER" -m 755 \
    "$STAGING_ROOT" "$STAGING_ROOT/releases" "$STAGING_ROOT/shared"
log "directories ready: $STAGING_ROOT/{releases,shared} (owner $STAGING_USER, mode 755)."
log "NOTE: $STAGING_ROOT/shared/backend.env (mode 600) is written by CI from the STAGING_BACKEND_ENV secret; not created here."

# --- 3. nginx vhost (edge TLS terminates upstream; tolerate nginx absent).
if command -v nginx >/dev/null 2>&1 && [[ -d /etc/nginx/sites-enabled ]]; then
    install -o root -g root -m 644 \
        "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-enabled/onlinemarket-staging.conf
    if nginx -t; then
        if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
            log "nginx config installed and reloaded."
        else
            log "WARNING: nginx -t passed but reload failed; reload nginx manually."
        fi
    else
        die "nginx -t failed; fix /etc/nginx/sites-enabled/onlinemarket-staging.conf."
    fi
else
    log "WARNING: nginx or /etc/nginx/sites-enabled not found; skipping vhost install."
    log "When nginx is available, install $SCRIPT_DIR/nginx.conf then run: nginx -t && systemctl reload nginx"
fi

# --- 4. Staging database inside the existing mysql-container.
command -v docker >/dev/null 2>&1 || die "docker not found; cannot reach container $MYSQL_CONTAINER."
docker inspect -f '{{.State.Status}}' "$MYSQL_CONTAINER" 2>/dev/null | grep -qx running \
    || die "container $MYSQL_CONTAINER is not running."

# The password travels via stdin, never via argv. SQL-escape backslash and
# single-quote so metacharacters ($, backtick, !, %) stay literal.
esc_pass=${STAGING_DB_PASS//\\/\\\\}
esc_pass=${esc_pass//\'/\\\'}
qdb=$(printf '`%s`' "$STAGING_DB_NAME")
quser=$(printf "'%s'" "$STAGING_DB_USER")
sql="CREATE DATABASE IF NOT EXISTS ${qdb} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sql+=$'\n'"CREATE USER IF NOT EXISTS ${quser}@'%' IDENTIFIED BY '${esc_pass}';"
sql+=$'\n'"GRANT ALL PRIVILEGES ON ${qdb}.* TO ${quser}@'%';"
sql+=$'\n'"FLUSH PRIVILEGES;"
docker_args=(exec -i "$MYSQL_CONTAINER" mysql -uroot)
if [[ -n ${MYSQL_ROOT_PASSWORD:-} ]]; then
    # Optional: container-side root password enters via container env, never argv or logs.
    docker_args=(exec -i -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" "$MYSQL_CONTAINER" mysql -uroot)
fi
printf '%s\n' "$sql" | docker "${docker_args[@]}" \
    || die "mysql bootstrap failed (container $MYSQL_CONTAINER). If root needs a password, export MYSQL_ROOT_PASSWORD and re-run."
log "database + user ready in $MYSQL_CONTAINER (database STAGING_DB_NAME, login STAGING_DB_USER)."

# --- 5. Reboot persistence: pm2 resurrect via a systemd unit (run once, as root).
STARTUP_CMD="pm2 startup systemd -u $STAGING_USER --hp $STAGING_HOME"
if command -v pm2 >/dev/null 2>&1; then
    if pm2 startup systemd -u "$STAGING_USER" --hp "$STAGING_HOME"; then
        log "pm2 startup unit installed."
    else
        log "WARNING: 'pm2 startup' failed; run manually as root: $STARTUP_CMD"
    fi
else
    log "WARNING: pm2 not on root PATH; after installing pm2, run as root: $STARTUP_CMD"
fi

log "done. Next: deploy via CI (see README-staging.md); deploy.sh runs 'pm2 save' itself after a healthy release."
