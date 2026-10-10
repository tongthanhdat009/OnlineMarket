# OnlineMarket

Monorepo quản lý cửa hàng: .NET 10 API + MySQL, React admin + customer SPA.

| Thành phần | Tech | Dev URL | Vai trò |
|---|---|---|---|
| API | ASP.NET Core `net10.0`, EF Core + Pomelo MySQL | `http://localhost:7000` | Auth, nghiệp vụ, MySQL, VNPay, S3, AI, PDF |
| Admin | React `19.3.0` + TS + Vite `8.3.1` | `http://localhost:5173` | Dashboard, POS, orders, catalog, finance, AI agents, RBAC |
| Storefront | React `19.3.0` + TS + Vite `8.3.1` | `http://localhost:5193` | Home, catalog, cart, checkout, VNPay, account, AI chat |
| DB | MySQL `8.0` Docker | `127.0.0.1:3308` | DB `store_management`, user `root`, no password |

Flow: `Controllers/*Controller.cs` → `Services/Interface/I*Service.cs` → `Services/*Service.cs` → `Database/ApplicationDbContext.cs` → MySQL.
Storefront/Admin → API: Vite proxy `/api` → `http://localhost:7000`, prod dùng `VITE_API_URL`.

## Cấu trúc

```text
OnlineMarket/
├── Makefile                      # source of truth lệnh dev/build/db
├── dotnet-backend/               # ASP.NET Core API + docker-compose.yml MySQL 8.0
│   └── dotnet_backend/           # project chính: Controllers/Services/Models/Dtos/Database/Migrations
├── frontend/                     # React admin SPA (:5173)
├── frontend-customer/            # React customer storefront (:5193)
├── e2e/                          # Playwright admin + customer
├── deploy/staging/               # nginx + PM2 + bootstrap/deploy staging VPS
├── docs/                         # OPERATIONS_AND_FEATURES.md, audits/, plans/, specs/
└── dotnet-backend/.env.example   # template env; .env thật gitignored
```

Chi tiết: `dotnet-backend/AGENTS.md`, `frontend/AGENTS.md`, `frontend-customer/AGENTS.md`, `docs/OPERATIONS_AND_FEATURES.md`.

## Yêu cầu

- .NET SDK `10`, Node `>=20.19.0` + npm, Docker Engine + Compose v2.
- `openssl` tùy chọn (`make env` sinh `Jwt__Secret`).
- Port trống: `7000`, `5173`, `5193`, `3308`.

## Chạy nhanh

```bash
make env                  # copy .env.example → .env, sinh Jwt__Secret nếu có openssl
# mở dotnet-backend/.env điền VNPay/AWS/OpenAI/Email nếu test tích hợp
make install              # dotnet restore + npm install admin/customer
make db-up && make db-wait
make dev                  # DB + API :7000 + admin :5173 + customer :5193
make urls                 # in URLs
```

Chạy lẻ / nền:

```bash
make dev-api              # API :7000, tự bật DB, Development tự Migrate
make dev-admin            # admin :5173
make dev-customer         # customer :5193
make dev-bg               # nền, log .make-dev-*.log, PID .make-dev-*.pid
make dev-stop             # dừng dev-bg
```

Build / check:

```bash
make build                # build API + admin + customer
make static-check         # == make build, gate pre-push
dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln
npm run build --prefix frontend
npm run build --prefix frontend-customer
```

DB:

```bash
make db-up | make db-wait | make db-ps | make db-logs | make db-down | make db-restart
```

> Warning: `make db-reset` chạy `docker compose down -v`, xóa volume `local-mysql-data`, mất toàn bộ dữ liệu DB local, không undo nếu không backup. Yêu cầu gõ `yes` để xác nhận.

## Cấu hình

`dotnet-backend/.env` gitignored. `Program.cs` gọi `Env.Load(.../.env)` + `GetSetting` fallback `AWS:*` ↔ `AWS_*`, `OpenAI:*` ↔ `OPENAI_*`.

| Nhóm | Keys | Ghi chú |
|---|---|---|
| DB | `ConnectionStrings__DefaultConnection` | Bắt buộc, local port `3308` |
| JWT | `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience` | Bắt buộc, `Secret` ≥32 ký tự random |
| AI | `OpenAI__BaseUrl`, `OpenAI__ApiKey`, `OpenAI__Model`, `OpenAI__TimeoutSeconds` | Gateway OpenAI-compatible, default timeout `1200s` |
| VNPay | `VNPay__TmnCode`, `VNPay__HashSecret`, `VNPay__Url`, `VNPay__ReturnUrl`, `VNPay__CustomerAppUrl` | Checkout VNPay |
| S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, region/endpoint/public/private | Thiếu creds → `UnavailableS3Service` |
| Email | `Email__User`, `Email__Pass` | Gmail SMTP TLS `587` |

Không commit secret vào `appsettings.json`, `wwwroot/appsettings.json`, `schema.sql`.

## Backend — `dotnet-backend/dotnet_backend/`

- `TargetFramework net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, `RootNamespace=dotnet_backend`.
- Build chuẩn: `dotnet-backend/dotnet_backend/dotnet_backend.sln` (solution ngoài `dotnet-backend/dotnet-backend.sln` có thể lệch).
- JSON giữ PascalCase: `PropertyNamingPolicy=null`, `ReferenceHandler.IgnoreCycles`, `WriteIndented=true`.
- JWT: `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()`, `NameClaimType="sub"`, `ClockSkew=Zero`, `ValidateLifetime=true`.
- Auth kép: admin `AuthService`/`AuthController` vs customer `CustomerAuthService`/`CustomerAuthController` (`api/customer/auth`).
- EF `Database.Migrate()` chỉ khi `ASPNETCORE_ENVIRONMENT=Development`; prod chạy migration riêng trước deploy.
- Smoke: `dotnet-backend.http`, `http://localhost:7000/swagger` (nếu bật).

Controllers `27` file, Services `33` file, Models `18` entities (`User`, `Customer`, `Product`, `Category`, `Supplier`, `Inventory`, `Order`, `OrderItem`, `Payment`, `Bill`, `Promotion`, `CartItem`, `RefundRequest`, `Role`, `Permission`, `RolePermission`, `AgentOperations`, `AuditLog`).

Routes chính (`[Route]`):

```text
api/Auth api/Users api/Customer api/Categories api/Suppliers api/Inventory
api/products api/Order api/Cart api/Promotion api/Bill api/RefundRequest
api/Role api/Permissions api/RolePermission api/Test
api/customer/auth api/customer/products api/customer/cart api/customer/orders
api/customer/bills api/customer/vnpay api/customer/ai api/CustomerRefund
api/admin/ai api/admin/agents api/admin/agent-runs api/admin/agent-activity
api/admin/agent-tools api/admin/agent-analytics api/admin/agent-reports
api/admin/agent-auto-analysis api/admin/audit-log
```

Nghiệp vụ nổi bật: `OrderService` (online/offline, POS, cancel/pay, dashboard stats), `VNPayService` (create/verify/callback), `S3Service`, `InvoicePdfService` (QuestPDF), `EmailService`, `AdminAiService` + `AgentRuntime`/`AdminAiToolRegistry`/`AgentOperationsService`/`AgentReportService`, `AuditLogMiddleware` + `AuditLogService`.

DB: `Database/ApplicationDbContext.cs` (+ partial `AgentOperations`, `AuditLog`), `ModelSeedData.cs`, `Migrations/` (InitialCreate → ImportLegacySeedData → AddAgentOperationsConsole → UpdateAdminAgentModel → AddAuditLog). Compose `mysql:8.0`, `127.0.0.1:3308→3306`, healthcheck `mysqladmin ping`.

## Admin — `frontend/`

- Deps: `react 19.3.0`, `vite 8.3.1`, `typescript 7.0.2`, `tailwindcss 4.3.3` via `@tailwindcss/vite`, `react-router-dom 7.18.4`, `@tanstack/react-query 5.104.0`, `recharts 3.10.1`, `lucide-react 0.548.0`, `vitest 5.0.2`.
- Dev proxy: `/api` → `http://localhost:7000`. Prod: `VITE_API_URL`.
- `src/`: `api/` (19 adapters PascalCase + SSE), `auth/` (`AuthContext`, `session`, `permissions`), `components/ai/AdminAssistantWidget.tsx`, `layouts/AppShell.tsx`, `lib/api-client.ts`, `hooks/`, `pages/AdminPages.tsx` + `ProfilePage.tsx`, `types/`, `router.tsx`.

Routes (`src/router.tsx`): `/login`, `/dashboard`, `/orders`, `/orders/:id`, `/pos`, `/products`, `/categories`, `/suppliers`, `/inventory`, `/customers`, `/customers/:id`, `/promotions`, `/bills`, `/refunds`, `/ai/chat`, `/ai/agents`, `/ai/agents/:id`, `/ai/runs`, `/ai/runs/:id`, `/ai/activity`, `/ai/reports`, `/ai/analytics`, `/ai/tools`, `/admin/users`, `/admin/roles`, `/admin/permissions`, `/audit-log`, `/profile`.

```bash
npm install --prefix frontend
npm run dev --prefix frontend -- --host 0.0.0.0
npm run test --prefix frontend -- --run
npm run build --prefix frontend
```

## Storefront — `frontend-customer/`

- Deps như admin, khác `lucide-react 1.48.0`. Tên pkg `online-market-customer`.
- Proxy `/api` → `http://localhost:7000`; client tự append `/api` khi `VITE_API_URL` absolute; search keyword URL-encoded; session restore gọi `/api/customer/auth/me`.
- `src/`: `api/client.ts`, `app/router.tsx` + `providers.tsx`, `pages/CatalogPages.tsx` (`HomePage`, `ProductsPage`), `pages/CommercePages.tsx` (`ProductDetailPage`, `CartPage`, `CheckoutPage`, `OrdersPage`, `OrderDetailPage`, `RefundRequestPage`, `PaymentResultPage`), `pages/AuthPages.tsx` (`LoginPage`, `RegisterPage`, `AccountProfilePage`, `SecurityPage`), `pages/AccountPages.tsx`, `layouts/StoreLayout.tsx` + `AccountLayout.tsx`, `hooks/catalog.ts` + `account.ts`, `lib/` (`errors`, `format`, `sse`, `storage`, `translator`, `unwrap`), `components/ai/AiAssistant.tsx`.

Routes: `/`, `/products`, `/products/:id`, `/category/:id`, `/search?q=`, `/cart` (auth), `/checkout` (auth), `/payment-result`, `/login`, `/register`, `/account/profile`, `/account/security`, `/account/orders`, `/account/orders/:id`, `/account/bills`, `/account/refunds`.

```bash
npm install --prefix frontend-customer
npm run dev --prefix frontend-customer -- --host 0.0.0.0
npm run test --prefix frontend-customer -- --run
npm run build --prefix frontend-customer
```

## E2E — `e2e/`

Playwright `1.63.0`, `baseURL=https://staging-online-market.jadt.io.vn`, `workers=1`, `trace/screenshot/video=retain-on-failure`.

```text
e2e/tests/admin/    auth-api, auth, catalog, dashboard, finance-admin, orders
e2e/tests/customer/ account, cart-checkout, catalog, checkout-api, login
```

## Deploy staging — `deploy/staging/`

- `nginx.conf`: `listen 127.0.0.1:18080`, `server_name staging-online-market.jadt.io.vn`, `root /opt/onlinemarket-staging/current/customer`, `/api/` → `127.0.0.1:17000`, timeout `1250s` cho AI.
- `9router.compose.yml`, `ecosystem.config.cjs`, `onlinemarket-staging.service` (PM2 systemd), `bootstrap-vps.sh` (idempotent), `deploy.sh` (release + healthcheck + rollback app).
- DB staging bắt buộc MySQL (`UseMySql`, Pomelo-only, `utf8mb4`/`utf8mb4_unicode_ci`).
- Rollback app tự động, migration không rollback — restore DB thủ công. Chi tiết `deploy/staging/README-staging.md`.

## Gotchas

- Thiếu `dotnet-backend/.env` → `make dev-api` lỗi (`Env.Load` + `Jwt:Secret/Issuer/Audience required`, `ConnectionStrings:DefaultConnection required`).
- 2 `.sln` tồn tại — build chuẩn inner `dotnet_backend/dotnet_backend.sln`.
- DTO JSON PascalCase — client phải gửi/parse đúng case, không camelCase.
- Đổi `Services/Interface/I*Service` phải sửa impl + đăng ký DI `Program.cs` + caller.
- Không thêm `bin/`, `obj/`, `node_modules/`, `dist/`, `wwwroot/lib`, `.make-dev-*` vào docs/git.
