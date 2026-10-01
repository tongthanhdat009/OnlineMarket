const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { parseEnv } = require('node:util');

const root = process.env.STAGING_ROOT || '/opt/onlinemarket-staging';
const current = join(root, 'current');
const backendEnv = parseEnv(readFileSync(join(root, 'shared/backend.env'), 'utf8'));
const common = {
  autorestart: true,
  restart_delay: 2000,
  max_restarts: 15,
  min_uptime: '10s',
  kill_timeout: 30000,
  time: true,
};

function frontend(name, directory, port) {
  return {
    ...common,
    name,
    script: 'serve',
    cwd: current,
    // Do not carry API credentials from an invoking environment into static servers.
    filter_env: [...Object.keys(backendEnv), 'GITHUB_', 'ACTIONS_', 'RUNNER_'],
    env: {
      NODE_ENV: 'production',
      PM2_SERVE_PATH: join(current, directory),
      PM2_SERVE_HOST: '127.0.0.1',
      PM2_SERVE_PORT: String(port),
      PM2_SERVE_SPA: 'true',
      PM2_SERVE_HOMEPAGE: './index.html',
    },
    max_memory_restart: '192M',
  };
}

module.exports = {
  apps: [
    {
      ...common,
      name: 'onlinemarket-staging-api',
      script: join(current, 'api/dotnet-backend'),
      cwd: join(current, 'api'),
      interpreter: 'none',
      exec_mode: 'fork',
      instances: 1,
      env: {
        ...backendEnv,
        ASPNETCORE_ENVIRONMENT: 'Staging',
        ASPNETCORE_URLS: 'http://127.0.0.1:17000',
        TZ: 'Asia/Ho_Chi_Minh',
      },
      max_memory_restart: '768M',
    },
    frontend('onlinemarket-staging-admin', 'admin', 15173),
    frontend('onlinemarket-staging-customer', 'customer', 15193),
  ],
};
