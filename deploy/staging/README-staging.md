# Staging deploy — operator runbook

Staging chạy trên VPS `vps-hk`, deploy bằng PM2 dưới user `onlinemarket-staging`.
CI build artifact từ `main`, copy lên VPS, chạy `deploy.sh <release-id>` qua SSH.

## 1. Kiến trúc: bảng port

| Thành phần               | Nghe ở                                                                                                     | File                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| API (.NET)               | `127.0.0.1:17000`                                                                                          | `deploy/staging/ecosystem.config.cjs`   |
| Admin SPA (pm2-serve)    | `127.0.0.1:15173`                                                                                          | `deploy/staging/ecosystem.config.cjs`   |
| Customer SPA (pm2-serve) | `127.0.0.1:15193`                                                                                          | `deploy/staging/ecosystem.config.cjs`   |
| nginx → customer         | `127.0.0.1:18080`, `server_name staging-online-market.jadt.io.vn`, proxy `/api/` → `127.0.0.1:17000`       | `deploy/staging/nginx.conf`             |
| nginx → admin            | `127.0.0.1:18081`, `server_name staging-admin-online-market.jadt.io.vn`, proxy `/api/` → `127.0.0.1:17000` | `deploy/staging/nginx.conf`             |
| MySQL                    | `127.0.0.1:13306` → container `3306`                                                                       | container `mysql-container` (mysql:8.4) |

Process PM2: `onlinemarket-staging-api` / `-admin` / `-customer`.
Layout trên VPS: `/opt/onlinemarket-staging/{releases/<id>/,shared/backend.env,current}` —
`deploy.sh` yêu cầu `shared/backend.env` tồn tại với mode `600`.

## 2. Thứ tự vận hành

```bash
# B1 — bootstrap VPS (CHẠY 1 LẦN, as root, qua SSH trên vps-hk).
# DB user/pass đi qua biến môi trường, KHÔNG qua argv, script không in giá trị secret.
STAGING_DB_NAME=<db> STAGING_DB_USER=<user> STAGING_DB_PASS=<pass> sudo -E ./deploy/staging/bootstrap-vps.sh

# B2 — chuẩn bị nội dung backend.env local (KHÔNG commit):
#   ConnectionStrings__DefaultConnection trỏ tới STAGING_DB_USER/STAGING_DB_PASS vừa tạo,
#   cộng Jwt__Secret và các key backend cần. deploy.sh parse dotenv bằng node:util parseEnv.

# B3 — đặt 4 GitHub secrets (tên key, không in giá trị):
gh secret set STAGING_SSH_HOST   # IP/hostname của vps-hk
gh secret set STAGING_SSH_USER   # user SSH deploy (vd. onlinemarket-staging)
gh secret set STAGING_SSH_KEY    # private key SSH (< file.key)
gh secret set STAGING_BACKEND_ENV < backend.env   # toàn bộ nội dung backend.env

# B4 — push lên main để kích hoạt workflow staging.
git push origin main

# B5 — theo dõi run:
gh run watch
```

`bootstrap-vps.sh` làm gì (idempotent, chạy lại an toàn): tạo user/group
`onlinemarket-staging` (+ home cho PM2 daemon), tạo
`/opt/onlinemarket-staging/{releases,shared}` (owner staging user, mode 755),
cài `nginx.conf` → `/etc/nginx/sites-enabled` (`nginx -t` + reload; vắng nginx thì
chỉ cảnh báo), tạo DB+user MySQL qua `docker exec mysql-container`, cài
`pm2 startup systemd` cho user staging. Nó KHÔNG chạy `pm2 save` — `deploy.sh:132`
tự `pm2 save` sau khi release healthy, nên save lúc bootstrap chưa có gì để lưu.

## 3. Bảng secret

| Secret                                                    | Dùng ở đâu                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `STAGING_SSH_HOST`                                        | CI SSH tới vps-hk                                                      |
| `STAGING_SSH_USER`                                        | user SSH chạy deploy                                                   |
| `STAGING_SSH_KEY`                                         | private key SSH                                                        |
| `STAGING_BACKEND_ENV`                                     | CI ghi thành `/opt/onlinemarket-staging/shared/backend.env` (mode 600) |
| `STAGING_DB_NAME` / `STAGING_DB_USER` / `STAGING_DB_PASS` | chỉ dùng local khi chạy `bootstrap-vps.sh`; KHÔNG phải GitHub secrets  |

## 4. MySQL-only — verdict

Staging DB **bắt buộc MySQL trong `mysql-container`**. Backend là Pomelo MySQL-only:
`Program.cs` dùng `UseMySql` + `MySqlServerVersion(8,0,0)`, không có provider Npgsql —
các container Postgres trên VPS không dùng được nếu không viết lại provider.
`bootstrap-vps.sh` tạo DB dạng `utf8mb4`/`utf8mb4_unicode_ci` và user có full quyền
trên đúng DB đó (`GRANT ALL PRIVILEGES ON <db>.*`).

## 5. Rollback

`deploy.sh` tự rollback app khi health check fail: `current` trỏ lại release trước đó
và `pm2 save`; chưa từng có release trước thì dừng process + xóa `current`.
**Migration KHÔNG rollback** — log migration hạn chế ở
`shared/migration-<release-id>.log` (mode 600). Muốn về DB cũ phải restore thủ công.

## 6. Reboot

PM2 resurrect qua systemd unit do `pm2 startup systemd -u onlinemarket-staging`
cài ở bước bootstrap (`PM2_HOME=/home/onlinemarket-staging/.pm2`, `deploy.sh`
export đúng path này). `mysql-container` dùng restart policy của nó nên tự lên lại.
Kiểm tra sau reboot: `pm2 ls` (as staging user), `curl 127.0.0.1:17000/api/test`,
`curl 127.0.0.1:18080/` và `:18081/`.

## 7. Ghi chú file kèm theo

- `onlinemarket-staging.service` là **legacy/optional**: nó đọc
  `shared/staging.env` trong khi luồng PM2 hiện tại đọc `shared/backend.env`
  (`deploy.sh`, `ecosystem.config.cjs`). Deploy chuẩn không dùng file này — đừng
  enable nó song song với PM2 (tranh port 17000).
- `9router.compose.yml` là container AI-gateway local không liên quan, KHÔNG cần
  cho staging deploy.
