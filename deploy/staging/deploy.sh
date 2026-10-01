#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ $# -ne 1 || ! $1 =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
    echo 'Usage: deploy.sh <release-id> (letters, digits, dot, underscore, hyphen only)' >&2
    exit 2
fi

release_id=$1
root=${STAGING_ROOT:-/opt/onlinemarket-staging}
[[ $root = /* && -d $root ]] || { echo 'STAGING_ROOT must be an existing absolute directory.' >&2; exit 2; }
root=$(realpath "$root")
release="$root/releases/$release_id"
backend_env="$root/shared/backend.env"
names=onlinemarket-staging-api,onlinemarket-staging-admin,onlinemarket-staging-customer
export PM2_HOME=${PM2_HOME:-/home/onlinemarket-staging/.pm2}

exec 9>"$root/.deploy.lock"
flock -n 9 || { echo 'Another staging deployment is running.' >&2; exit 1; }

for executable in "$release/api/dotnet-backend" "$release/migrations/efbundle"; do
    [[ -f $executable && -x $executable ]] || { echo "Missing executable: $executable" >&2; exit 1; }
done
for file in "$release/deploy/ecosystem.config.cjs" "$release/admin/index.html" "$release/customer/index.html" "$backend_env"; do
    [[ -f $file ]] || { echo "Missing file: $file" >&2; exit 1; }
done
[[ $(realpath "$release") = "$release" ]] || { echo 'Release must not be a symlink.' >&2; exit 1; }
[[ $(stat -c '%a' "$backend_env") = 600 ]] || { echo 'shared/backend.env must have mode 600.' >&2; exit 1; }
[[ ! -e "$root/current" || -L "$root/current" ]] || { echo 'current must be a symlink.' >&2; exit 1; }

previous=''
if [[ -L "$root/current" ]]; then
    previous=$(readlink -f "$root/current")
    [[ $previous = "$root/releases/"* && -f "$previous/deploy/ecosystem.config.cjs" ]] || {
        echo 'Current release is invalid; refusing to overwrite it.' >&2; exit 1;
    }
fi

pm2_run() {
    # API secrets enter only its ecosystem env; never the PM2 client/daemon environment.
    env -i PATH="$PATH" HOME="$HOME" LANG=C.UTF-8 PM2_HOME="$PM2_HOME" STAGING_ROOT="$root" pm2 "$@"
}

activate() {
    local target=$1
    ln -s "$target" "$root/.current-$$"
    mv -Tf "$root/.current-$$" "$root/current"
    pm2_run startOrReload "$root/current/deploy/ecosystem.config.cjs" --only "$names" --update-env
}

healthy() {
    local expected=$1 port site code path
    curl -fsS --max-time 5 http://127.0.0.1:17000/api/test >/dev/null || return 1
    curl -fsS --max-time 5 http://127.0.0.1:17000/api/test/mysql |
        node -e 'let body=""; process.stdin.on("data", c => body += c); process.stdin.on("end", () => { try { process.exit(JSON.parse(body).success === true ? 0 : 1); } catch { process.exit(1); } });' || return 1
    for site in customer admin; do
        port=18080
        [[ $site != admin ]] || port=18081
        curl -fsS --max-time 5 "http://127.0.0.1:$port/" | cmp -s - "$expected/$site/index.html" || return 1
        curl -fsS --max-time 5 "http://127.0.0.1:$port/deployment-spa-check" | cmp -s - "$expected/$site/index.html" || return 1
        curl -fsS --max-time 5 "http://127.0.0.1:$port/api/test" >/dev/null || return 1
        for path in /api/test/mysql /API/TEST/mysql /api/test/s3/presign; do
            code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$port$path") || return 1
            [[ $code = 404 ]] || return 1
        done
    done
}

wait_healthy() {
    local expected=$1 attempt
    for attempt in {1..30}; do
        if healthy "$expected"; then return 0; fi
        sleep 2
    done
    return 1
}

switched=false
failed() {
    local status=$1
    trap - ERR HUP INT TERM
    if [[ $switched = true ]]; then
        echo 'Deployment failed. Restoring previous application release; database migrations are not rolled back.' >&2
        if [[ -n $previous ]]; then
            if activate "$previous" && wait_healthy "$previous"; then
                pm2_run save || echo 'Previous release healthy, but PM2 save failed.' >&2
                echo 'Previous application release restored.' >&2
            else
                echo 'Rollback health check failed; inspect PM2 and restricted migration logs.' >&2
            fi
        else
            pm2_run delete "$names" || true
            rm -f "$root/current"
            echo 'No previous release; failed application processes stopped.' >&2
        fi
    fi
    exit "$status"
}
trap 'failed $?' ERR
trap 'failed 130' INT
trap 'failed 143' HUP TERM

echo "Applying database migrations for $release_id."
# Parse dotenv as data. Keep migration output private because provider errors may contain credentials.
node - "$backend_env" "$release" "$root/shared/migration-$release_id.log" <<'NODE'
const { readFileSync, openSync, closeSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { spawnSync } = require('node:child_process');
const [envPath, release, logPath] = process.argv.slice(2);
const env = parseEnv(readFileSync(envPath, 'utf8'));
if (!env.ConnectionStrings__DefaultConnection) {
  console.error('Missing ConnectionStrings__DefaultConnection in shared/backend.env.');
  process.exit(1);
}
const log = openSync(logPath, 'w', 0o600);
const result = spawnSync(`${release}/migrations/efbundle`, [], {
  cwd: `${release}/api`,
  env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8', ...env, ASPNETCORE_ENVIRONMENT: 'Staging' },
  stdio: ['ignore', log, log],
});
closeSync(log);
if (result.error || result.status !== 0) {
  console.error(`Migration failed; restricted log: ${logPath}`);
  process.exit(1);
}
NODE

switched=true
activate "$release"
wait_healthy "$release"
pm2_run save
trap - ERR HUP INT TERM
echo "Staging release $release_id healthy; PM2 process list saved."
