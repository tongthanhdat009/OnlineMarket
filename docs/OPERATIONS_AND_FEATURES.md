# OnlineMarket — Vận hành và chức năng hiện có

> Cập nhật từ mã nguồn ngày 2026-08-29. Nguồn chuẩn: `Makefile`, cấu hình ứng dụng, controller/service/page. Không ghi secret vào tài liệu hay `wwwroot/`.

## 1. Tổng quan

OnlineMarket gồm hai ứng dụng độc lập, cùng dùng API ASP.NET Core và MySQL:

| Thành phần | Công nghệ                              | Dev URL                 | Vai trò                                                 |
| ---------- | -------------------------------------- | ----------------------- | ------------------------------------------------------- |
| API        | ASP.NET Core `net10.0`, EF Core/Pomelo | `http://localhost:7000` | API, auth, nghiệp vụ, MySQL, VNPay, S3, AI, PDF         |
| Storefront | React + TypeScript + Vite           | `http://localhost:5193` | Mua hàng khách hàng, giỏ hàng, checkout, VNPay, AI chat |
| DB         | MySQL 8.0 Docker                       | `127.0.0.1:3308`        | Database `store_management`                             |

Request flow backend: `Controllers/*Controller.cs` → `Services/Interface/I*Service.cs` → `Services/*Service.cs` → `Database/ApplicationDbContext.cs` → MySQL.

API JSON giữ PascalCase (`PropertyNamingPolicy=null`); client phải chấp nhận/gửi DTO PascalCase.

## 2. Yêu cầu máy phát triển

- .NET SDK 10 (`dotnet-backend/dotnet_backend/dotnet-backend.csproj`) và Node.js + npm cho `frontend/`, `frontend-customer/`.
- Docker Engine + Docker Compose v2.
- `openssl` tùy chọn; `make env` dùng để tạo JWT secret.
- Cổng trống: `7000`, `5173`, `5193`, `3308`.

## 3. Cài đặt và chạy local

```bash
# 1. Tạo biến môi trường backend; tạo Jwt__Secret nếu có openssl.
make env

# 2. Mở dotnet-backend/.env. Điền OpenAI/OpenRouter, VNPay, AWS, Email nếu test tích hợp.

# 3. Cài toàn bộ dependencies.
make install

# 4. Chạy MySQL và chờ healthy.
make db-up && make db-wait

# 5. Chạy API + React customer.
make dev
```

Chạy lẻ:

```bash
make dev-api       # API :7000; tự bật DB, Development migration
make dev-admin      # React admin :5173
make dev-customer   # React customer :5193
make dev-bg        # chạy nền; log .make-dev-*.log, PID .make-dev-*.pid
make dev-stop      # dừng process do dev-bg tạo
make urls          # in các URL
```

Build/check:

```bash
make build
make static-check  # hiện là alias của make build

# Kiểm tra từng ứng dụng
dotnet build dotnet-backend/dotnet_backend/dotnet_backend.sln
npm run build --prefix frontend-customer
```

`dotnet-backend/dotnet_backend/dotnet_backend.sln` là backend solution chuẩn; solution ngoài có thể lệch.

## 4. Database

```bash
make db-up       # bật MySQL, giữ volume
make db-wait     # đợi mysqladmin ping
make db-ps       # trạng thái container
make db-logs     # follow log DB
make db-down     # tắt DB, giữ dữ liệu
make db-restart  # restart DB
make db-reset    # xóa volume, mất toàn bộ dữ liệu local
```

**Cảnh báo:** `make db-reset` chạy `docker compose down -v`, xóa `local-mysql-data`. Không thể hoàn tác nếu không có backup.

Compose dùng `mysql:8.0`, `store_management`, user `root`, mật khẩu rỗng, map `127.0.0.1:3308 → 3306`. API tự gọi EF `Database.Migrate()` chỉ khi `ASPNETCORE_ENVIRONMENT=Development`; production phải chạy migration riêng trước deploy.

## 5. Cấu hình và secret

`dotnet-backend/.env` bị Git ignore. Tạo từ `.env.example` qua `make env`.

| Nhóm     | Keys chính                                                                                        | Ghi chú                                                |
| -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Database | `ConnectionStrings__DefaultConnection`                                                            | Bắt buộc; local mặc định port `3308`                   |
| JWT      | `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`                                                     | Bắt buộc; `Secret` tối thiểu 32 ký tự random           |
| AI       | `OpenAI__BaseUrl`, `OpenAI__ApiKey`, `OpenAI__Model`, `OpenAI__TimeoutSeconds`                    | Tương thích fallback `OPENAI_*`                        |
| VNPay    | `VNPay__TmnCode`, `VNPay__HashSecret`, `VNPay__Url`, `VNPay__ReturnUrl`, `VNPay__CustomerAppUrl`    | Cần cho checkout VNPay                                 |
| S3       | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, region/endpoint/bucket public/private | Thiếu credentials: backend dùng `UnavailableS3Service` |
| Email    | `Email__User`, `Email__Pass`                                                                      | Gmail SMTP TLS port 587                                |

Không commit `.env`, JWT secret, AWS key, VNPay hash secret, OpenAI key, email password. `.env` files bị Git ignore; chỉ đặt `VITE_API_URL`, không đặt secret backend.

## 6. Kiến trúc runtime

- Backend load `.env`, bắt buộc connection string + JWT issuer/audience/secret.
- JWT giữ claim `sub`, kiểm tra issuer, audience, signing key, lifetime; `ClockSkew=Zero`.
- CORS cho React admin `5173` và React customer `5193`; credentials được bật.
- S3 có fallback an toàn: thiếu `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` hoặc bucket thì upload ảnh không hoạt động thay vì làm API không khởi động.
- AI dùng OpenAI-compatible gateway, HTTP timeout cấu hình được; admin/customer chat stream theo SSE.
- Invoice PDF dùng QuestPDF Community.
- DB schema chính: categories, customers, inventory, orders, order_items, payments, permissions, products, promotions, roles, role_permissions, suppliers, users, cart_items, bills, refund_requests.

## 7. Xác thực và phân quyền

### Customer

- Register/login: `/api/customer/auth/register`, `/api/customer/auth/login`.
- Customer JWT và `currentUser` lưu `localStorage` với keys `customer_access_token`, `currentUser`.
- Customer API tự thêm Bearer token; `CartStateService` singleton phát event để badge giỏ cập nhật giữa component.

**Lưu ý bảo mật:** token trong `localStorage` chịu rủi ro XSS; hiện client chỉ kiểm tra token tồn tại, token expiry được server quyết định.

## 8. Chức năng Storefront React

| Route                            | Chức năng                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `/`                              | Banner carousel, nội dung ưu đãi                                                         |
| `/products`                      | Tìm kiếm, lọc danh mục, filter giá, phân trang catalog                                   |
| `/products/{productId:int}`      | Chi tiết sản phẩm, ảnh/fallback, thêm giỏ                                                |
| `/cart`                          | Chọn item, sửa số lượng/xóa, cảnh báo hàng đã xóa, validate tồn kho                      |
| `/checkout`                      | Preview giỏ, áp mã giảm giá, validate tồn/giá, cash/card, tạo đơn hoặc redirect VNPay    |
| `/payment-result`                | Nhận kết quả qua query string; retry checkout khi cần                                    |
| `/payment-success/{OrderId:int}` | Xem đơn và tải PDF invoice                                                               |
| `/orders`                        | Lọc/tìm/paginate đơn customer; status gồm pending…canceled/refund; cancel/refund request |
| `/profile`                       | Sửa Name/Phone/Address, đổi mật khẩu                                                     |
| `/login`                         | Customer login, return URL, trạng thái registered                                        |
| `/register`                      | Customer registration, confirm password, đồng ý điều khoản                               |
| `/not-found`                     | 404                                                                                      |

UI chung: `CustomerLayout` có navbar, cart badge, toast bốn mức (`Success/Error/Warning/Info`), AI chat assistant. `ProductImage` dùng ảnh URL có sẵn hoặc placeholder SVG khi ảnh lỗi/không tồn tại.

### Customer services

| Service            | API/hành vi                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `AuthService`      | register/login/update profile/change password, localStorage JWT          |
| `ProductService`   | public product/catalog/category/search                                   |
| `CartService`      | customer cart CRUD, validate checkout                                    |
| `OrderService`     | preview/create/checkout/list/detail/cancel, invoice PDF, refund endpoint |
| `PaymentService`   | pay order, tạo VNPay payment URL                                         |
| `PromotionService` | áp `PromoCode` trên tổng tiền                                            |
| `InventoryService` | validate giỏ trước checkout                                              |
| `AiChatService`    | chat thường, SSE stream, thêm sản phẩm được AI gợi ý vào giỏ             |
| `S3ImageService`   | passthrough absolute URL hoặc placeholder; hiện không tạo presigned URL  |
| `ToastService`     | event bus UI trong bộ nhớ                                                |

## 9. Backend API domains

| Domain          | Surface hiện có                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin auth/RBAC | admin login/refresh/me; users, roles, permissions, role-permissions                                                                                                                   |
| Customer auth   | register, login, me, profile update, password change                                                                                                                                  |
| Catalog         | admin product/category/supplier CRUD; product POS/top/total; product image upload; public customer catalog/search/categories                                                          |
| Inventory       | list/detail/by-product/update/patch quantity; anonymous validate cart stock                                                                                                           |
| Customer/order  | admin customer CRUD/top buyers/spending; admin online/offline order, dashboard stats, create/update/delete/cancel/status; customer create/preview/checkout/list/detail/cancel/invoice |
| Cart            | admin cart by `customerId`; authenticated customer cart CRUD/total/validate checkout                                                                                                  |
| Billing/payment | bills by id/customer/order/status/date range/revenue; customer bill view; order payment; VNPay create/callback/verify                                                                 |
| Promotion       | admin CRUD; apply code; gift voucher                                                                                                                                                  |
| Refund          | admin refund request processing; customer create/list/cancel refund request                                                                                                           |
| AI              | anonymous customer chat + SSE; authenticated add suggested products to cart; authenticated admin AI sessions/chat SSE                                                                 |
| Diagnostics     | public `TestController` endpoint, MySQL connectivity/version info                                                                                                                     |

Admin controllers mặc định `[Authorize]`; customer private controllers scope customer từ `customer_id`/JWT claim. `CustomerProductController` catalog công khai. Xóa product yêu cầu role `1`.

## 10. Thanh toán, ảnh, AI, email

### VNPay

1. Customer checkout tạo payment URL qua `/api/customer/vnpay/create-payment`.
2. Browser redirect sang VNPay.
3. Callback backend xác thực `vnp_SecureHash` HMAC SHA-512, response code/transaction status/amount/order reference.
4. Backend cập nhật payment/order status; customer về payment result/success và có thể tải invoice PDF.

Dùng sandbox URL mặc định trong template. Cấu hình `VNPay__*` bắt buộc để luồng thực chạy.

### S3-compatible storage

- Product image upload backend dùng AWS SDK/S3 endpoint có thể cấu hình.
- Public object dùng public URL; private object có thể dùng presigned URL backend.
- Thiếu AWS config: `UnavailableS3Service`; hệ thống chạy nhưng upload ảnh không khả dụng.
- React customer hiển thị URL ảnh theo DTO, chưa lấy presigned URL từ backend.

### AI

- Customer chat dùng `/api/customer/ai/chat` hoặc `/chat/stream` SSE, AI có product suggestion rồi khách có thể thêm gợi ý vào giỏ.
- Admin chat dùng `/api/admin/ai/chat/stream`, hỗ trợ session management.
- Backend AI dùng OpenAI-compatible gateway, product search/function calling, giới hạn `MaxToolRounds=3`.

### Email/PDF

- Email service dùng Gmail SMTP `smtp.gmail.com:587`, TLS; thiếu user/password thì log cảnh báo và bỏ gửi.
- Hóa đơn PDF backend dùng QuestPDF; admin còn có jsPDF client-side export.

## 12. Dữ liệu và business status

`orders` có:

- `PayStatus`: `pending`, `paid`, `canceled`, `refunded`.
- `OrderStatus`: `pending`, `approved`, `processing`, `shipping`, `delivered`, `completed`, `canceled`.
- `OrderType`: `online`, `offline`.

`payments` có payment method `cash`, `card`, `bank_transfer`, `e-wallet`; transaction status `pending`, `success`, `failed`.

## 12. Triển khai và khắc phục sự cố

| Triệu chứng                     | Kiểm tra / xử lý                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DefaultConnection is required` | Kiểm tra `dotnet-backend/.env`, `make db-up`, `make db-wait`                                       |
| JWT config missing              | Điền `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience` trong `.env`                                    |
| React CORS hoặc API fail       | Kiểm tra API `:7000`, React customer `:5193`, CORS trong `Program.cs`                  |
| MySQL không healthy             | `make db-ps`, `make db-logs`, `make db-wait`                                                       |
| S3 upload không chạy            | Điền `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`; xem log fallback                  |
| Dev nền treo/cổng bận           | `make dev-stop`; `lsof -i :7000 -i :5173 -i :5193 -i :3308`                                      |
| Build fail                      | Chạy granular build theo mục 3 để cô lập ứng dụng lỗi                                              |
| Production migration thiếu      | Chạy `dotnet ef database update`/migration pipeline trước chạy API; auto migration chỉ Development |

## 13. Caveats đã xác minh

- Backend runtime đặt `MySqlServerVersion(10.4.0)`, nhưng local Compose là MySQL 8.0; design-time factory có fallback legacy port `3307`. Local chuẩn thực tế là Compose `3308`.
- `IOrderService` được DI đăng ký lặp; không thay đổi behavior hiện tại.
- Vue có hai Axios flow: `apiClient.js` xử lý 401 trực tiếp, `Auth.js` xử lý refresh queue. Khi đổi token key/flow phải sửa đồng bộ.
- `PaymentService.GetPaymentsByOrderAsync` phía customer React cần kiểm tra qua API thực.
- Swagger chưa được xác nhận là expose: `Makefile` ghi “nếu có”, còn startup không thấy cấu hình Swagger rõ ràng.

## 14. Nguồn mã chính

- Vận hành: `Makefile`, `dotnet-backend/docker-compose.yml`, `dotnet-backend/.env.example`.
- Backend composition: `dotnet-backend/dotnet_backend/Program.cs`, `Database/ApplicationDbContext.cs`, `Controllers/`, `Services/`.
- Storefront: `frontend-customer/src/` (pages, components, api, hooks, layouts).
