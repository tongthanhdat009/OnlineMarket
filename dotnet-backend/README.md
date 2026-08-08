# dotnet-backend - Store Management API

## Giới thiệu

Đây là backend API của hệ thống quản lý cửa hàng, được xây dựng bằng **ASP.NET Core Web API** (.NET 9.0). API cung cấp các dịch vụ quản lý đầy đủ bao gồm sản phẩm, đơn hàng, tồn kho, thanh toán và tích hợp AI.

## Công nghệ

| Công nghệ                        | Phiên bản | Mục đích               |
| -------------------------------- | --------- | ---------------------- |
| .NET                             | 9.0       | Framework nền tảng     |
| Entity Framework Core            | 9.0.9     | ORM                    |
| Pomelo.EntityFrameworkCore.MySql | 9.0.0     | MySQL/MariaDB provider |
| JWT Bearer Authentication        | 9.0.10    | Xác thực JWT           |
| BCrypt.Net-Next                  | 4.0.3     | Mã hóa mật khẩu        |
| QuestPDF                         | 2025.7.4  | Tạo PDF hóa đơn        |
| AWSSDK.S3                        | 4.0.14.3  | Lưu trữ file AWS S3    |

## Cấu trúc dự án

```
dotnet-backend/
├── dotnet-backend.sln              # Solution file
├── .gitignore
└── dotnet_backend/                 # Main project
    ├── dotnet-backend.csproj       # Project file
    ├── Program.cs                  # Entry point & configuration
    ├── appsettings.json            # Cấu hình (JWT, DB, AWS, VNPay)
    ├── appsettings.Development.json
    ├── Properties/
    │   └── launchSettings.json
    │
    ├── Controllers/                # 24 API Controllers
    │   ├── AuthController.cs           # Admin authentication
    │   ├── ProductController.cs        # Product CRUD & upload
    │   ├── CategoryController.cs       # Category management
    │   ├── SupplierController.cs       # Supplier management
    │   ├── InventoryController.cs      # Inventory tracking
    │   ├── OrderController.cs          # Order management
    │   ├── CartController.cs           # Shopping cart (admin)
    │   ├── PromotionController.cs      # Discount promotions
    │   ├── BillController.cs           # Billing & invoicing
    │   ├── RefundRequestController.cs  # Refund processing
    │   ├── UserController.cs           # User management
    │   ├── RoleController.cs           # Role management
    │   ├── PermissionController.cs     # Permission management
    │   ├── RolePermissionController.cs # Role-Permission mapping
    │   ├── PaymentController.cs        # Payment records
    │   ├── UploadController.cs         # File upload to S3
    │   ├── AiController.cs             # AI chat assistant
    │   ├── TestController.cs           # Testing endpoints
    │   ├── CustomerAuthController.cs   # Customer auth
    │   ├── CustomerController.cs       # Customer profile
    │   ├── CustomerCartController.cs   # Customer cart
    │   ├── CustomerProductController.cs # Customer products
    │   ├── CustomerOrderController.cs  # Customer orders
    │   ├── CustomerBillController.cs   # Customer bills
    │   ├── CustomerVNPayController.cs  # VNPay integration
    │   └── CustomerRefundController.cs # Customer refunds
    │
    ├── Services/                   # Business Logic Layer
    │   ├── Interface/              # Service Interfaces (21 files)
    │   ├── AuthService.cs              # Admin JWT auth
    │   ├── CustomerAuthService.cs      # Customer auth
    │   ├── UserService.cs              # User CRUD
    │   ├── ProductService.cs           # Product management
    │   ├── CategoryService.cs          # Category CRUD
    │   ├── SupplierService.cs          # Supplier CRUD
    │   ├── InventoryService.cs         # Stock management
    │   ├── OrderService.cs             # Order processing
    │   ├── OrderItemService.cs         # Order items
    │   ├── CartService.cs              # Cart operations
    │   ├── PromotionService.cs         # Promotion logic
    │   ├── BillService.cs              # Billing
    │   ├── PaymentService.cs           # Payment processing
    │   ├── RefundRequestService.cs     # Refund handling
    │   ├── RoleService.cs              # Role CRUD
    │   ├── PermissionService.cs        # Permission CRUD
    │   ├── RolePermissionService.cs    # Role-permission mapping
    │   ├── InvoicePdfService.cs        # PDF generation
    │   ├── VNPayService.cs             # VNPay gateway
    │   ├── S3Service.cs                # AWS S3 storage
    │   ├── EmailService.cs             # Email notifications
    │   └── AiService.cs                # AI chat integration
    │
    ├── Models/                     # Domain Models (16 entities)
    │   ├── User.cs                    # Admin users
    │   ├── Customer.cs                # Customers
    │   ├── Product.cs                 # Products
    │   ├── Category.cs                # Categories
    │   ├── Supplier.cs                # Suppliers
    │   ├── Inventory.cs               # Stock inventory
    │   ├── Order.cs                   # Orders
    │   ├── OrderItem.cs               # Order line items
    │   ├── Payment.cs                 # Payment records
    │   ├── Bill.cs                    # Bills/Invoices
    │   ├── Promotion.cs               # Promotions
    │   ├── CartItem.cs                # Shopping cart
    │   ├── RefundRequest.cs           # Refund requests
    │   ├── Role.cs                    # User roles
    │   ├── Permission.cs              # Permissions
    │   └── RolePermission.cs          # Role-permission junction
    │
    ├── Dtos/                       # Data Transfer Objects (40+ files)
    │   ├── LoginRequestDto.cs
    │   ├── LoginResponseDto.cs
    │   ├── ProductDto.cs
    │   ├── OrderDto.cs
    │   ├── CheckoutDto.cs
    │   ├── BillDto.cs
    │   ├── PaymentDto.cs
    │   ├── PromotionDto.cs
    │   ├── RefundRequestDto.cs
    │   ├── VNPayRequestDto.cs
    │   ├── VNPayResponseDto.cs
    │   ├── AiChatDto.cs
    │   └── ...
    │
    └── Database/                   # Database Layer
        ├── ApplicationDbContext.cs      # EF Core DbContext
        ├── schema.sql                  # Database schema
        └── data.sql                    # Seed data
```

## Cơ sở dữ liệu

### Database Type

- **MySQL/MariaDB 10.4** (via Pomelo.EntityFrameworkCore.MySql)
- EF Core migrations apply automatically at API startup. `EnsureCreated()` is not used.
- Initial migration seeds only the minimum Admin role, dashboard permission, and role-permission relationship required by admin authorization.

### Các bảng chính (16 tables)

| Bảng               | Mô tả                     |
| ------------------ | ------------------------- |
| `users`            | Người dùng admin/staff    |
| `customers`        | Khách hàng                |
| `roles`            | Vai trò người dùng        |
| `permissions`      | Quyền hạn chi tiết        |
| `role_permissions` | Mapping role-quyền        |
| `products`         | Danh mục sản phẩm         |
| `categories`       | Danh mục sản phẩm         |
| `suppliers`        | Nhà cung cấp              |
| `inventory`        | Tồn kho                   |
| `orders`           | Đơn hàng (online/offline) |
| `order_items`      | Chi tiết đơn hàng         |
| `cart_items`       | Giỏ hàng                  |
| `promotions`       | Mã khuyến mãi             |
| `payments`         | Giao dịch thanh toán      |
| `bills`            | Hóa đơn                   |
| `refund_requests`  | Yêu cầu hoàn tiền         |

## Các tính năng chính

### Xác thực & Phân quyền

- **Admin Authentication**: JWT với Access Token (60 phút) + Refresh Token (7 ngày)
- **Customer Authentication**: Đăng ký/đăng ký khách hàng riêng biệt
- **Role-Based Access Control (RBAC)**: Phân quyền chi tiết

### Quản lý sản phẩm

- CRUD operations
- Upload ảnh lên AWS S3
- Barcode validation
- Soft delete support

### Quản lý đơn hàng

- Hai loại đơn hàng: `online` (e-commerce) và `offline` (POS)
- Order status workflow: pending → approved → processing → shipping → delivered → completed
- Dashboard statistics

### Quản lý tồn kho

- Theo dõi stock real-time
- Tự động trừ tồn kho khi thanh toán thành công

### Thanh toán

- Tích hợp cổng thanh toán VNPay
- HMACSHA512 signature validation
- Tự động cập nhật status đơn hàng

### AI Chat Assistant

- Tư vấn nguyên liệu/recipe
- Gợi ý sản phẩm dựa trên cuộc chat

### Xuất PDF

- Tạo hóa đơn PDF bằng QuestPDF

## Cấu hình

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=store_management;..."
  },
  "Jwt": {
    "Secret": "<set via Jwt__Secret>",
    "Issuer": "<set via Jwt__Issuer>",
    "Audience": "<set via Jwt__Audience>"
  },
  "AWS": {
    "AccessKey": "<set via AWS__AccessKey>",
    "SecretKey": "<set via AWS__SecretKey>",
    "Region": "<set via AWS__Region>"
  },
  "VNPay": {
    "TmnCode": "<set via VNPay__TmnCode>",
    "HashSecret": "<set via VNPay__HashSecret>",
    "Url": "<set via VNPay__Url>",
    "ReturnUrl": "<set via VNPay__ReturnUrl>"
  }
}
```

### CORS Configuration

- Allowed Origins:
  - `http://localhost:5173` (Vue app)
  - `https://localhost:5000`, `https://localhost:5001`, `https://localhost:5192` (Blazor)

## Local MySQL (Docker)

`docker compose` runs disposable MySQL 8.0 at `127.0.0.1:3307`. The API applies EF Core migrations and seed data at startup; Docker does not execute `schema.sql`/`data.sql`.

If `ConnectionStrings__DefaultConnection` is absent, copy the ignored local placeholder, then export it. `.env.example` contains no credentials; keep `.env` uncommitted.

```bash
cd dotnet-backend
cp .env.example .env
# Replace Jwt__Secret in .env with a local-only random value:
secret="$(openssl rand -hex 32)" && sed -i "s|^Jwt__Secret=.*|Jwt__Secret=$secret|" .env && unset secret
set -a; source .env; set +a

docker compose up -d
# Wait until the db healthcheck is healthy, then start API:
ASPNETCORE_ENVIRONMENT=Development dotnet run --project dotnet_backend/dotnet-backend.csproj
```

Windows PowerShell:

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=127.0.0.1;Port=3307;Database=store_management;User=root;Password='
dotnet run --project dotnet_backend/dotnet-backend.csproj
```

Verify migration and required seed rows without printing credentials:

```bash
docker compose exec -T db mysql -uroot store_management -e "SELECT MigrationId FROM __EFMigrationsHistory; SELECT role_id, role_name FROM roles; SELECT permission_id, action_key FROM permissions; SELECT role_id, permission_id FROM role_permissions;"
```

`docker compose down` stops the local database. Reset only this compose project's disposable data: `docker compose down -v`; migrations rerun next `up`/API start.

## API Endpoints

### Admin Endpoints

| Endpoint                     | Method              | Mô tả                |
| ---------------------------- | ------------------- | -------------------- |
| `/api/auth/login`            | POST                | Đăng nhập admin      |
| `/api/products`              | GET/POST/PUT/DELETE | Quản lý sản phẩm     |
| `/api/categories`            | GET/POST/PUT/DELETE | Quản lý danh mục     |
| `/api/suppliers`             | GET/POST/PUT/DELETE | Quản lý nhà cung cấp |
| `/api/inventory`             | GET/POST/PUT        | Quản lý tồn kho      |
| `/api/order`                 | GET/POST            | Quản lý đơn hàng     |
| `/api/order/dashboard-stats` | GET                 | Thống kê dashboard   |
| `/api/promotions`            | GET/POST/PUT/DELETE | Quản lý khuyến mãi   |
| `/api/bill`                  | GET                 | Xem hóa đơn          |
| `/api/users`                 | GET/POST/PUT/DELETE | Quản lý users        |
| `/api/role`                  | GET/POST/PUT/DELETE | Quản lý vai trò      |
| `/api/refund-request`        | GET/PUT             | Xử lý hoàn tiền      |

### Customer Endpoints

| Endpoint                             | Method              | Mô tả                |
| ------------------------------------ | ------------------- | -------------------- |
| `/api/customer/auth/register`        | POST                | Đăng ký khách hàng   |
| `/api/customer/auth/login`           | POST                | Đăng nhập khách hàng |
| `/api/customer/products`             | GET                 | Xem sản phẩm         |
| `/api/customer/cart`                 | GET/POST/PUT/DELETE | Giỏ hàng             |
| `/api/customer/checkout`             | POST                | Thanh toán           |
| `/api/customer/orders`               | GET/POST            | Đơn hàng của khách   |
| `/api/customer/vnpay/create-payment` | POST                | Tạo thanh toán VNPay |
| `/api/customer/ai/chat`              | POST                | Chat AI              |
| `/api/customer/refund-request`       | POST                | Yêu cầu hoàn tiền    |

## Kiến trúc

```
┌─────────────────┐
│   Controllers   │ ← HTTP Request/Response handling
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │ ← Business logic
└────────┬────────┘
         │
┌────────▼────────┐
│  DbContext      │ ← Data access (EF Core)
└─────────────────┘
```

## Chạy ứng dụng

```bash
# Restore dependencies
dotnet restore

# Run development server
dotnet run

# Build for production
dotnet build -c Release

# Run migrations (nếu có)
dotnet ef database update
```

## Development URLs

- HTTP: `http://localhost:7000`
- HTTPS: `https://localhost:7001`
