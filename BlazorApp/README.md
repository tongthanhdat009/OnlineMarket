# BlazorApp - Store Management Customer Frontend

## Giới thiệu

Đây là ứng dụng frontend dành cho khách hàng của hệ thống quản lý cửa hàng, được xây dựng bằng **Blazor WebAssembly** (.NET 9.0). Ứng dụng cung cấp giao diện thương mại điện tử cho phép khách hàng duyệt sản phẩm, quản lý giỏ hàng, đặt hàng và tương tác với trợ lý AI.

## Công nghệ

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| .NET | 9.0 | Framework nền tảng |
| Blazor WebAssembly | 9.0.0 | Client-side SPA framework |
| AutoMapper | 12.0.1 | Object mapping |
| Blazored.LocalStorage | 4.5.0 | LocalStorage access |
| Bootstrap | 5 | UI Framework |
| Bootstrap Icons | 1.11.0 | Icon library |

## Cấu trúc dự án

```
BlazorApp/
├── App.razor                    # Root component với routing
├── Program.cs                   # Entry point & DI configuration
├── _Imports.razor               # Global using statements
├── BlazorApp.csproj            # Project configuration
│
├── Components/                  # Reusable UI components
│   ├── ChatAssistant.razor     # Widget chat AI
│   ├── ProductImage.razor      # Component hiển thị hình ảnh sản phẩm
│   └── Toast.razor             # Component thông báo (notification)
│
├── dto/                        # Data Transfer Objects
│   ├── AiChatDto.cs            # DTO cho chat AI
│   ├── CartItemDto.cs          # DTO cho giỏ hàng
│   ├── CustomerDto.cs          # DTO cho khách hàng
│   ├── OrderDto.cs             # DTO cho đơn hàng
│   ├── ProductDto.cs           # DTO cho sản phẩm
│   ├── PromotionDto.cs         # DTO cho khuyến mãi
│   ├── VNPayDto.cs             # DTO cho thanh toán VNPay
│   └── [các DTO files khác]
│
├── Layout/                     # Layout components
│   ├── MainLayout.razor        # Layout mặc định
│   ├── CustomerLayout.razor    # Layout cho khách hàng (theme Giáng sinh)
│   ├── AuthLayout.razor        # Layout cho trang đăng nhập/đăng ký
│   └── NavMenu.razor           # Menu navigation
│
├── Pages/                      # Page components (routes)
│   ├── Home.razor              # Trang chủ (/)
│   ├── Products.razor          # Danh sách sản phẩm (/products)
│   ├── ProductDetail.razor     # Chi tiết sản phẩm (/products/{id})
│   ├── Cart.razor              # Giỏ hàng (/cart)
│   ├── Checkout.razor          # Thanh toán (/checkout)
│   ├── Login.razor             # Đăng nhập (/login)
│   ├── Register.razor          # Đăng ký (/register)
│   ├── Profile.razor           # Hồ sơ (/profile)
│   ├── Orders.razor            # Lịch sử đơn hàng (/orders)
│   ├── PaymentResult.razor     # Kết quả thanh toán
│   ├── PaymentSuccess.razor    # Thanh toán thành công
│   └── NotFound.razor          # Trang 404
│
├── services/                   # Business logic & API services
│   ├── interface/              # Service interfaces
│   │   ├── ICartService.cs
│   │   ├── IPaymentService.cs
│   │   └── IS3ImageService.cs
│   ├── AiChatService.cs        # Tích hợp chat AI
│   ├── ApiService.cs           # API client generic
│   ├── AuthService.cs          # Xác thực (login/register)
│   ├── CartService.cs          # Quản lý giỏ hàng
│   ├── CartStateService.cs     # State management cho giỏ hàng
│   ├── InventoryService.cs     # Quản lý tồn kho
│   ├── OrderService.cs         # Quản lý đơn hàng
│   ├── PaymentService.cs       # Xử lý thanh toán
│   ├── ProductService.cs       # Danh mục sản phẩm
│   ├── PromotionService.cs     # Khuyến mãi/giảm giá
│   ├── S3ImageService.cs       # Xử lý hình ảnh AWS S3
│   └── ToastService.cs         # Thông báo/Notification
│
├── wwwroot/                    # Static web assets
│   ├── index.html              # HTML entry point
│   ├── css/                    # Stylesheets
│   ├── js/                     # JavaScript files
│   ├── lib/                    # Third-party libraries (Bootstrap)
│   ├── banner/                 # Banner images
│   └── appsettings.json        # Cấu hình AWS S3
│
└── Properties/
    └── launchSettings.json     # Launch configuration
```

## Các trang chính

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/` | Home.razor | Trang chủ với carousel và tính năng sản phẩm |
| `/products` | Products.razor | Danh mục sản phẩm với phân trang và bộ lọc |
| `/products/{id}` | ProductDetail.razor | Chi tiết sản phẩm |
| `/cart` | Cart.razor | Quản lý giỏ hàng |
| `/checkout` | Checkout.razor | Quy trình thanh toán |
| `/login` | Login.razor | Đăng nhập |
| `/register` | Register.razor | Đăng ký tài khoản |
| `/profile` | Profile.razor | Quản lý hồ sơ |
| `/orders` | Orders.razor | Lịch sử đơn hàng |

## Tính năng chính

- **Xác thực JWT**: Đăng nhập/đăng ký với token lưu trong localStorage
- **Giỏ hàng**: Quản lý giỏ hàng với cập nhật real-time qua CartStateService
- **Trợ lý AI**: Chat widget để tư vấn nguyên liệu nấu ăn và gợi ý sản phẩm
- **Thanh toán**: Tích hợp cổng thanh toán VNPay
- **Quản lý hình ảnh**: AWS S3 presigned URL với caching
- **Thông báo**: Hệ thống toast notification với progress indicators
- **Theme Giáng sinh**: Giao diện theo mùa với hiệu ứng tuyết rơi

## Cấu hình

### Development URLs
- HTTP: `http://localhost:5176`
- HTTPS: `https://localhost:7190`

### Backend API
- Base URL: `http://localhost:7000/`

### AWS S3 Configuration (wwwroot/appsettings.json)
```json
{
  "AWS": {
    "BucketName": "dotnet-app-images",
    "Region": "ap-southeast-2"
  }
}
```

## Kiến trúc

- **Client-Server Architecture**: Blazor WASM client consuming REST API
- **Service Layer Pattern**: Dedicated service classes cho từng domain
- **DTO Pattern**: Data transfer objects cho API communication
- **Dependency Injection**: Tất cả services đăng ký trong DI container
- **State Management**: CartStateService singleton cho cross-component state

## Chạy ứng dụng

```bash
# Restore dependencies
dotnet restore

# Run development server
dotnet run

# Build for production
dotnet build -c Release
```

## API Endpoints chính

| Endpoint | Mô tả |
|----------|-------|
| `api/customer/auth/*` | Xác thực khách hàng |
| `api/cart/*` | Giỏ hàng |
| `api/customer/ai/chat` | Chat AI |
| `api/upload/presigned-url` | S3 image URLs |
| `api/customer/checkout` | Thanh toán |
| `api/customer/vnpay/*` | Thanh toán VNPay |
