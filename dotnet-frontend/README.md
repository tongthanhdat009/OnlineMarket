# dotnet-frontend - Store Management Admin Frontend

## Giới thiệu

Đây là ứng dụng frontend dành cho admin/staff của hệ thống quản lý cửa hàng. **Lưu ý**: Mặc dù tên thư mục là "dotnet-frontend", đây thực chất là một **Vue 3 SPA** (không phải .NET/Blazor) dùng để quản lý các hoạt động của cửa hàng.

## Công nghệ

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Vue.js | 3.5.18 | UI Framework (Composition API) |
| Vite | 7.0.6 | Build tool & dev server |
| Vue Router | 4.5.1 | Client-side routing |
| Axios | 1.12.2 | HTTP client |
| Lucide Vue Next | - | Icon library |
| Flatpickr | - | Date picker |
| Chart.js | - | Data visualization |
| jsPDF | - | PDF invoice generation |

### Yêu cầu
- **Node.js**: ^20.19.0 || >=22.12.0

## Cấu trúc dự án

```
dotnet-frontend/
├── public/                    # Static assets
├── src/
│   ├── api/                   # API client modules (15 files)
│   │   ├── apiClient.js       # Axios instance với interceptors
│   │   ├── api.js             # Auth API với token refresh logic
│   │   ├── Auth.js            # Login, logout, token management
│   │   ├── Category.js        # Category CRUD
│   │   ├── Customer.js        # Customer management
│   │   ├── Inventory.js       # Inventory operations
│   │   ├── Order.js           # Order management & statistics
│   │   ├── Permission.js      # Permission checks
│   │   ├── Product.js         # Product CRUD + image upload
│   │   ├── Promotion.js       # Promotion management
│   │   ├── Role.js            # Role management
│   │   ├── RolePermission.js  # Role-Permission mapping
│   │   ├── Suppliers.js       # Supplier management
│   │   └── Users.js           # User management
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── global.css     # Global styles
│   │   │   ├── inventory.css  # Inventory styles
│   │   │   └── product.css    # Product styles
│   │   ├── base.css
│   │   ├── main.css
│   │   └── logo.svg
│   │
│   ├── components/
│   │   └── icons/             # Icon components
│   │
│   ├── composables/
│   │   └── usePermissions.js  # Permission composable
│   │
│   ├── router/
│   │   └── index.js           # Vue Router configuration
│   │
│   ├── utils/
│   │   ├── generateInvoicePDF.js    # PDF invoice generation
│   │   ├── permissionUtils.js       # Permission utilities
│   │   ├── registerVietnameseFont.js
│   │   └── robotoRegularBase64.js   # Font embedding cho PDF
│   │
│   ├── views/                 # Page components (15 files)
│   │   ├── Dashboard.vue      # Dashboard chính (1283 dòng)
│   │   ├── POS.vue            # Point of Sale (1881 dòng)
│   │   ├── Customers.vue      # Quản lý khách hàng (755 dòng)
│   │   ├── Products.vue       # Quản lý sản phẩm (644 dòng)
│   │   ├── Promotions.vue     # Quản lý khuyến mãi (648 dòng)
│   │   ├── Profile.vue        # Hồ sơ người dùng (488 dòng)
│   │   ├── Users.vue          # Quản lý users (537 dòng)
│   │   ├── RolePermission.vue # Vai trò & quyền hạn (529 dòng)
│   │   ├── Inventory.vue      # Quản lý tồn kho (357 dòng)
│   │   ├── Suppliers.vue      # Quản lý nhà cung cấp (314 dòng)
│   │   ├── Categories.vue     # Quản lý danh mục (299 dòng)
│   │   ├── Orders.vue         # Quản lý đơn hàng offline (203 dòng)
│   │   ├── OrdersOnline.vue   # Quản lý đơn hàng online (209 dòng)
│   │   ├── Refunds.vue        # Quản lý hoàn tiền (160 dòng)
│   │   └── Login.vue          # Đăng nhập (397 dòng)
│   │
│   ├── App.vue                # Root component với sidebar
│   └── main.js                # Application entry point
│
├── .vscode/
│   └── extensions.json        # VSCode recommendations
├── index.html                 # HTML entry point
├── jsconfig.json              # JS configuration
├── package.json               # Dependencies & scripts
└── vite.config.js             # Vite configuration
```

## Các trang chính

| Route | Component | Số dòng | Mô tả |
|-------|-----------|---------|-------|
| `/login` | Login.vue | 397 | Đăng nhập admin |
| `/dashboard` | Dashboard.vue | 1283 | Dashboard với biểu đồ, thống kê |
| `/pos` | POS.vue | 1881 | Point of Sale - Bán hàng tại quầy |
| `/products` | Products.vue | 644 | Quản lý sản phẩm |
| `/categories` | Categories.vue | 299 | Quản lý danh mục |
| `/suppliers` | Suppliers.vue | 314 | Quản lý nhà cung cấp |
| `/inventory` | Inventory.vue | 357 | Quản lý tồn kho |
| `/customers` | Customers.vue | 755 | Quản lý khách hàng |
| `/promotions` | Promotions.vue | 648 | Quản lý khuyến mãi |
| `/orders` | Orders.vue | 203 | Đơn hàng offline |
| `/orders-online` | OrdersOnline.vue | 209 | Đơn hàng online |
| `/refunds` | Refunds.vue | 160 | Yêu cầu hoàn tiền |
| `/users` | Users.vue | 537 | Quản lý users |
| `/roles` | RolePermission.vue | 529 | Vai trò & quyền hạn |
| `/profile` | Profile.vue | 488 | Hồ sơ cá nhân |

## Hệ thống phân quyền (Permissions)

### Permission Keys
| Key | Mô tả |
|-----|-------|
| `dashboard_view` | Xem dashboard |
| `user_manage` | Quản lý users |
| `customer_manage` | Quản lý khách hàng |
| `supplier_manage` | Quản lý nhà cung cấp |
| `category_manage` | Quản lý danh mục |
| `product_manage` | Quản lý sản phẩm |
| `inventory_manage` | Quản lý tồn kho |
| `promotion_manage` | Quản lý khuyến mãi |
| `order_manage` | Quản lý đơn hàng |
| `role_manage` | Quản lý vai trò & quyền |

### Permission Utilities
```javascript
getPermissions()           // Lấy permissions từ localStorage
hasPermission(actionKey)   // Kiểm tra single permission
hasAnyPermission(keys)     // Kiểm tra có ít nhất một quyền
hasAllPermissions(keys)    // Kiểm tra có tất cả quyền
```

## Tính năng chính

- **Xác thực JWT**: Login với access + refresh token
- **Token Refresh Queue**: Tự động refresh token, tránh race conditions
- **Phân quyền RBAC**: Menu navigation dựa trên user permissions
- **Point of Sale (POS)**: Bán hàng tại quầy với giao diện chuyên nghiệp
- **Dashboard**: Biểu đồ với Chart.js, thống kê doanh thu
- **Quản lý hình ảnh**: Upload ảnh sản phẩm
- **Xuất PDF hóa đơn**: Hỗ trợ font tiếng Việt
- **Auto 401 Redirect**: Tự động chuyển về login khi token hết hạn

## Cấu hình API

### Backend API
- **Base URL**: `http://localhost:7000`

### Các Endpoints chính
| Endpoint | Mô tả |
|----------|-------|
| `/api/auth/*` | Authentication |
| `/api/users` | User management |
| `/api/products` | Product operations |
| `/api/categories` | Category operations |
| `/api/customer` | Customer operations |
| `/api/suppliers` | Supplier operations |
| `/api/inventory` | Inventory operations |
| `/api/role` | Role management |
| `/api/order` | Order operations & statistics |
| `/api/promotions` | Promotion management |

## Cấu hình Vite

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

## Chạy ứng dụng

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

### Development Server
- URL: `http://localhost:5173`

## Scripts (package.json)
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## Đặc điểm nổi bật

1. **Hỗ trợ tiếng Việt**: UI và code comments hoàn toàn bằng tiếng Việt
2. **PDF Invoice Generation**: Tạo hóa đơn PDF với font tiếng Việt nhúng
3. **Chart.js Integration**: Biểu đồ trực quan trên dashboard
4. **Token Refresh Queue**: Queue mechanism để tránh nhiều refresh call cùng lúc
5. **Permission-Based Navigation**: Menu sidebar tự động ẩn/hiện theo permissions
6. **Image Upload**: Hỗ trợ upload ảnh sản phẩm
7. **Vietnamese Font for PDF**: Font tiếng Việt được nhúng vào PDF

## Tóm tắt

Đây là **Vue 3 SPA cho hệ thống Store Management** với đầy đủ tính năng:
- Xác thực người dùng với JWT tokens
- Role-based access control (RBAC)
- Point of Sale (POS) system
- Quản lý sản phẩm, khách hàng, nhà cung cấp, tồn kho
- Quản lý đơn hàng (online & offline)
- Dashboard với analytics và biểu đồ
- Xuất hóa đơn PDF

Ứng dụng kết nối đến backend API tại `http://localhost:7000`.
