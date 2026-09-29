# Admin API reference

Tài liệu này là inventory theo mã nguồn hiện tại trong `dotnet-backend/dotnet_backend/Controllers`, `Dtos`, `Services` và `Program.cs`. Mục tiêu: mô tả các API mà màn hình/quy trình quản trị có thể dùng, payload, response, quyền và quy tắc nghiệp vụ đang thực thi.

> **Trạng thái:** tài liệu theo implementation hiện tại, không phải OpenAPI được generate. Route không phân biệt hoa thường; tài liệu dùng chữ thường. API mặc định chạy tại `http://localhost:7000`.

## 1. Quy ước chung

### 1.1 Request và response

- JSON giữ nguyên tên property CLR PascalCase vì `PropertyNamingPolicy = null`: dùng `UserId`, `PromoCode`, `OrderStatus`, không dùng camelCase nếu client không tự map.
- Header cho API bảo vệ:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

- `DateTime` nhận theo format mà .NET model binding hỗ trợ; `DateOnly` nên gửi `yyyy-MM-dd`.
- `decimal` dùng số JSON, không gửi chuỗi định dạng tiền.
- `PagedResultDto<T>`:

```json
{
  "Items": [],
  "TotalCount": 0,
  "Page": 1,
  "PageSize": 20
}
```

- Các endpoint list có `page` và `pageSize` chỉ trả paged result khi **cả hai query parameter cùng có mặt**. Thiếu một trong hai → trả toàn bộ mảng. Các filter chung: `search`, `searchField`.
- `searchField` được nhận ở nhiều controller nhưng service hiện chỉ áp dụng một phần; với users/categories/suppliers/products và một số list khác, đừng giả định field này đã giới hạn tìm kiếm. Customer có lọc theo name/phone/email/address/id; order chủ yếu áp dụng tìm kiếm tổng hợp.
- `page` được service chuẩn hóa tối thiểu là `1`; `pageSize` thường được giới hạn `1..50`.
- `ReferenceHandler.IgnoreCycles` được bật để tránh vòng lặp navigation property; response DTO vẫn có thể chứa object lồng nhau.

### 1.2 JWT và phiên admin

| Thuộc tính | Giá trị đang triển khai |
|---|---|
| Đăng nhập | `POST /api/auth/login` |
| Access token | JWT, hết hạn sau 60 phút |
| Refresh token | JWT, hết hạn sau 7 ngày |
| Refresh rotation | Không rotate; trả lại refresh token cũ |
| Claim user ID | `ClaimTypes.NameIdentifier` |
| Claim username | `ClaimTypes.Name` |
| Claim full name | `ClaimTypes.GivenName` |
| Claim role | `ClaimTypes.Role`, giá trị số (`1`, `2`) |
| Claim quyền | Nhiều claim `permission` |
| Validation | issuer, audience, signing key, lifetime; `ClockSkew = 0` |

Refresh token được kiểm tra chữ ký và user tồn tại. Code chưa kiểm tra claim `type=refresh`, dù token refresh được tạo với claim đó.

### 1.3 Mã lỗi thường gặp

| HTTP | Ý nghĩa |
|---:|---|
| `200` | Thành công |
| `201` | Tạo resource thành công |
| `204` | Thành công, không có body |
| `400` | Payload/ID/trạng thái không hợp lệ hoặc lỗi nghiệp vụ được map thành bad request |
| `401` | Chưa xác thực, credential sai, token hết hạn/không hợp lệ |
| `403` | Đã xác thực nhưng bị từ chối quyền hoặc là customer token gọi API staff |
| `404` | Không tìm thấy resource |
| `409` | Xung đột nghiệp vụ, thường là duplicate hoặc resource đã tồn tại |
| `500` | Lỗi server; một số controller trả cả `error` chi tiết |

## 2. Đăng nhập và thông tin tài khoản admin

Base route: `/api/auth`. `login` và `refresh` không yêu cầu Bearer token; `me` yêu cầu `[Authorize]`.

| Method | Endpoint | Body/query | Response và lỗi |
|---|---|---|---|
| `POST` | `/api/auth/login` | `LoginRequestDto` | `200 LoginResponseDto`; body rỗng username/password → `400`; sai credential → `401` |
| `POST` | `/api/auth/refresh` | `RefreshRequestDto` | `200 RefreshResponseDto`; thiếu token → `400`; token sai/hết hạn/user không tồn tại → `401` |
| `GET` | `/api/auth/me` | Không có | `200` object gồm `UserId`, `Username`, `FullName`, `Role`, `Permissions`, `Message`; JWT lỗi → `401` |

### 2.1 Payload auth

```json
// LoginRequestDto
{
  "Username": "admin",
  "Password": "123456"
}
```

```json
// LoginResponseDto
{
  "AccessToken": "<jwt>",
  "RefreshToken": "<jwt>",
  "UserId": 1,
  "Username": "admin",
  "FullName": "Administrator",
  "Role": 1,
  "Permissions": ["dashboard_view", "product_manage"]
}
```

```json
// RefreshRequestDto / RefreshResponseDto
{ "RefreshToken": "<jwt>" }
```

## 3. Người dùng admin

Base route: `/api/users`. Controller chỉ có `[Authorize]`; chưa gắn policy/action key ở từng action. Comment trong code nói create/update dành cho Admin hoặc Manager, nhưng enforcement thực tế hiện chỉ là token hợp lệ.

| Method | Endpoint | Body/query | Response và ghi chú |
|---|---|---|---|
| `GET` | `/api/users` | `page`, `pageSize`, `search`, `searchField` tùy chọn | Có đủ page/pageSize → `PagedResultDto<UserDto>`; thiếu → `UserDto[]` |
| `GET` | `/api/users/total` | Không có | `200` số nguyên tổng user |
| `GET` | `/api/users/{id}` | Path `id:int` | `200 UserDto`; không tồn tại → `404` |
| `POST` | `/api/users` | `UserDto` | `201 UserDto`; validation/duplicate username → `400` |
| `PUT` | `/api/users/{id}` | `UserDto` | Path ID phải bằng `body.UserId`; lệch → `400`; không tồn tại → `404`; validation → `400`; thành công `200` |
| `DELETE` | `/api/users/{id}` | Path `id` | `200 { message }`; không tồn tại → `404` |

Validation create/update: `Username`, `Password`, `FullName`, `Role` bắt buộc; role chỉ `1` hoặc `2`; username không trùng. Password được hash BCrypt khi lưu.

> **Cảnh báo bảo mật:** `UserDto` có property `Password`, và `UserService` hiện map password hash vào kết quả list/detail/update. Client quản trị không nên hiển thị hoặc ghi log property này; backend nên redaction trước khi public API.

## 4. Khách hàng do admin quản lý

Base route: `/api/customer`. Đây là customer master data dành cho staff/admin, khác với các route `/api/customer/auth`, `/api/customer/orders` dành cho customer self-service.

| Method | Endpoint | Body/query | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/customer` | `page`, `pageSize`, `search`, `searchField` | Paged khi có đủ page/pageSize, ngược lại `CustomerDto[]` |
| `GET` | `/api/customer/top-buyers` | `top` mặc định `3` | `TopCustomerDto[]` gồm `Name`, `TotalOrders` |
| `GET` | `/api/customer/spending` | Không có | `CustomerSpendingDto[]` |
| `GET` | `/api/customer/{id}` | Path `id:int` | `CustomerDto`; không tồn tại → `404` |
| `POST` | `/api/customer` | `CustomerDto` | `201 { message: "Success", data: CustomerDto }`; validation → `400` |
| `PUT` | `/api/customer/{id}` | `CustomerDto` | `200 { message: "Success", data: CustomerDto }`; validation → `400` |
| `DELETE` | `/api/customer/{id}` | Path `id` | `204`; không tồn tại → `404`; customer có lỗi nghiệp vụ khác → `400` |

Validation chính: `Name` bắt buộc, tối đa 100 ký tự; `Phone` bắt buộc, regex Việt Nam `^(0(3|5|7|8|9))[0-9]{8}$`, unique; email nếu có phải hợp lệ và ngắn hơn 100 ký tự; không xóa customer đang có order.

## 5. Danh mục, nhà cung cấp và sản phẩm

### 5.1 Danh mục

Base route: `/api/categories` (`CategoriesController`). Tất cả action yêu cầu `[Authorize]`.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `GET` | `/api/categories` | `page`, `pageSize`, `search`, `searchField` | `PagedResultDto<CategoryDto>` hoặc `CategoryDto[]` |
| `GET` | `/api/categories/total` | Không có | `200` số lượng |
| `GET` | `/api/categories/{id}` | Path `id` | `200 CategoryDto`; thiếu → `404` |
| `POST` | `/api/categories` | `CategoryDto` | `201 CategoryDto` |
| `PUT` | `/api/categories/{id}` | `CategoryDto` | `200 CategoryDto`; thiếu → `404` |
| `DELETE` | `/api/categories/{id}` | Path `id` | `204`; thiếu → `404` |

### 5.2 Nhà cung cấp

Base route: `/api/suppliers` (`SuppliersController`). Tất cả action yêu cầu `[Authorize]`.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `GET` | `/api/suppliers` | Query phân trang/tìm kiếm chung | `PagedResultDto<SupplierDto>` hoặc `SupplierDto[]` |
| `GET` | `/api/suppliers/{id}` | Path `id` | `SupplierDto`; thiếu → `404` |
| `POST` | `/api/suppliers` | `SupplierDto` | `201 SupplierDto` |
| `PUT` | `/api/suppliers/{id}` | `SupplierDto` | `200 SupplierDto`; thiếu → `404` |
| `DELETE` | `/api/suppliers/{id}` | Path `id` | `204`; thiếu → `404` |

### 5.3 Sản phẩm

Base route: `/api/products`. Tất cả action yêu cầu `[Authorize]`; upload ảnh còn yêu cầu role claim `1` (Admin).

| Method | Endpoint | Request/query | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/products` | Query phân trang/tìm kiếm chung | `PagedResultDto<ProductDto>` hoặc `ProductDto[]` |
| `GET` | `/api/products/pos` | Không có | Danh sách `ProductDto` phục vụ POS |
| `GET` | `/api/products/total` | Không có | `200` số lượng sản phẩm; implementation hiện tính cả bản ghi soft-delete |
| `GET` | `/api/products/top-products` | `top` mặc định `3` | `TopProductDto[]` gồm `ProductName`, `TotalOrders` |
| `GET` | `/api/products/{id}` | Path `id` | `ProductDto`; thiếu → `404` |
| `POST` | `/api/products` | `ProductDto` | `201 ProductDto`; validation/duplicate → `400` |
| `PUT` | `/api/products/{id}` | `ProductDto` | URL ID phải bằng `body.ProductId`; lệch → `400`; thiếu → `404`; validation → `400` |
| `DELETE` | `/api/products/{id}` | Path `id` | `200 { message }`; thiếu → `404`; service xóa mềm |
| `POST` | `/api/products/{id}/upload-image` | `multipart/form-data`, field `image` | `200 { imageUrl, message }`; lỗi file → `400`; product thiếu → `404`; lỗi khác → `500` |

Upload ảnh: MIME cho phép `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`; kích thước tối đa 5 MiB; service còn kiểm tra binary signature và extension/MIME. Product create tự tạo inventory quantity `0`. `ProductName` và `Barcode` phải unique; `Price > 0`; Category/Supplier nếu có phải tồn tại.

### 5.4 DTO catalog

| DTO | Property chính |
|---|---|
| `CategoryDto` | `CategoryId:int`, `CategoryName:string`, `Products:Product[]?` |
| `SupplierDto` | `SupplierId:int`, `Name:string`, `Phone?`, `Email?`, `Address?`, `Products[]` |
| `ProductDto` | `ProductId`, `ProductName`, `Price`, `Barcode?`, `Unit?`, `ImageUrl?`, `CreatedAt?`, `Category?`, `Supplier?`, `CategoryId?`, `SupplierId?`, `Quantity?`, `Deleted` |

## 6. Tồn kho

Base route: `/api/inventory`. Controller yêu cầu `[Authorize]`, trừ endpoint validate cart stock được `[AllowAnonymous]`.

| Method | Endpoint | Request/query | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/inventory` | Query phân trang/tìm kiếm chung | `PagedResultDto<InventoryDto>` hoặc `InventoryDto[]`; lỗi service → `500` |
| `GET` | `/api/inventory/{id}` | Path inventory ID | `InventoryDto`; thiếu → `404`; lỗi → `500` |
| `GET` | `/api/inventory/product/{productId}` | Path product ID | `InventoryDto`; thiếu → `404`; lỗi → `500` |
| `PUT` | `/api/inventory/{id}` | `InventoryDto` | `200 InventoryDto`; ModelState → `400`; thiếu → `404`; lỗi → `500` |
| `PATCH` | `/api/inventory/product/{productId}/quantity` | Body là **raw JSON integer**, ví dụ `12` | Âm → `400`; inventory thiếu → `404`; thành công `200 { message }` |
| `POST` | `/api/inventory/customer/validate-cart-stock` | `ValidateCartStockRequest` | Public; `200 ValidateCartStockResponse`; ModelState → `400`; lỗi → `500` |

`InventoryDto`: `InventoryId`, `ProductId`, `Quantity?`, `UpdatedAt?`, `Product?`. PATCH chặn quantity âm tại controller; PUT không có cùng kiểm tra rõ ràng ở controller.

## 7. Khuyến mãi và voucher

Base route: `/api/promotion`. Tất cả action yêu cầu `[Authorize]`.

| Method | Endpoint | Request/query | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/promotion` | Query phân trang/tìm kiếm chung | `PagedResultDto<PromotionDto>` hoặc `PromotionDto[]` |
| `GET` | `/api/promotion/{id}` | Path `id:int` | `PromotionDto`; thiếu → `404` |
| `POST` | `/api/promotion` | `PromotionDto` | `201`; validation → `400`; xung đột → `409` |
| `PUT` | `/api/promotion/{id}` | `PromotionDto` | `200`; validation → `400`; thiếu → `404`; xung đột → `409` |
| `DELETE` | `/api/promotion/{id}` | Path `id:int` | `204`; thiếu → `404`; bị cấm theo nghiệp vụ → `400` |
| `POST` | `/api/promotion/apply` | `ApplyPromoRequestDto` | `200 ApplyPromoResponseDto`; input/business → `400`; promo không tồn tại → `404` |
| `POST` | `/api/promotion/gift` | `GiftVoucherDto` | `200 { message }`; thiếu → `404`; invalid → `400`; lỗi khác → `500` |

Quy tắc service: `DiscountType` chỉ `percent`/`fixed`; `Status` thường `active`/`inactive`; `EndDate >= StartDate`; `DiscountValue > 0`; percent trong `1..100`; min order/usage limit không âm; `PromoCode` unique. Promo đã dùng không được đổi type/value và không được giảm UsageLimit dưới UsedCount; không xóa promo đã dùng. Apply kiểm tra active, date, usage limit, min order; percent discount làm tròn 2 chữ số. Gift chỉ gửi khi promo active, chưa hết hạn và còn lượt.

## 8. Đơn hàng, POS và dashboard

Base route: `/api/order`. Tất cả action yêu cầu `[Authorize]`.

### 8.1 Danh sách và chi tiết

| Method | Endpoint | Request/query | Response |
|---|---|---|---|
| `GET` | `/api/order/offline` | Query phân trang/tìm kiếm chung | `PagedResultDto<OrderDto>` hoặc `OrderDto[]` đơn offline |
| `GET` | `/api/order/online` | Query phân trang/tìm kiếm chung | `PagedResultDto<OrderDto>` hoặc `OrderDto[]` đơn online |
| `GET` | `/api/order/promotions` | Không có | `PromotionDto[]` |
| `GET` | `/api/order/customer/{customerId}` | Path customer ID | `OrderDto[]` |
| `GET` | `/api/order/{id}` | Path order ID | `OrderDto`; thiếu → `404` |
| `GET` | `/api/order/refund-requests` | Query phân trang/tìm kiếm chung | Danh sách hoặc paged refund requests |

### 8.2 Tạo/cập nhật/hủy

| Method | Endpoint | Body | Response và lỗi |
|---|---|---|---|
| `POST` | `/api/order` | `OrderDto` | `200 { message, Order }`; ArgumentException → `400`; lỗi khác → `500` |
| `PUT` | `/api/order/{id}/cancel` | Không có | `200 { message }`; không thể hủy → `400`; lỗi khác → `500` |
| `PUT` | `/api/order/{orderId}/status` | `{ "Status": "processing" }` | `200 { message }`; thiếu → `404`; status/business invalid → `400`; lỗi khác → `500` |
| `PUT` | `/api/order/{orderId}/cancel-admin` | Không có | `200 { message }`; exception → `400` |
| `PUT` | `/api/order/refund-requests/{id}/confirm` | Không có | `200 { message }`; exception → `400` |

Flow status service hỗ trợ tiến lên `pending → approved → processing → shipping → delivered → completed`; order đã `canceled` không đi tiếp. Approved cash có thể trừ tồn; completed đánh dấu cash paid/bill paid. Admin cancel không cho completed, yêu cầu `PayStatus = pending`, hoàn tồn cho order không còn pending và cập nhật bill/payment.

Tạo order offline kiểm tra customer, order items không rỗng, giá product chính xác; tạo order completed/paid và cập nhật promo usage khi áp dụng.

### 8.3 Thống kê dashboard

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/api/order/total` | `int` tổng order |
| `GET` | `/api/order/peak-time` | `PeakTimeDto[]` (`TimeRange`, `Percentage`) |
| `GET` | `/api/order/orders-by-year/{year}` | `OrderByMonthDto[]` (`Month`, `TotalOrders`) |
| `GET` | `/api/order/sales-by-year/{year}` | `SalesByMonthDto[]` (`Month`, `TotalSales`) |
| `GET` | `/api/order/daily-stats/{year}/{month}` | `DailyOrderStatsDto[]` |
| `GET` | `/api/order/dashboard-stats` | `DashboardStatsDto` |
| `GET` | `/api/order/completed-orders-by-year/{year}` | `OrderByMonthDto[]` |
| `GET` | `/api/order/completed-sales-by-year/{year}` | `SalesByMonthDto[]` |

`DashboardStatsDto` gồm tổng order online/offline, completed online/offline và doanh thu total/online/offline. `DailyOrderStatsDto` gồm tổng order/amount, top customer, breakdown online/offline.

> Không có controller route `/api/reports/sales` trong source hiện tại. Client gọi route đó sẽ nhận `404`; dùng các endpoint dashboard/order ở trên hoặc `/api/admin/agent-reports` khi cần report AI.

### 8.4 DTO order chính

`OrderDto` gồm: `OrderId`, `CustomerId?`, `UserId?`, `PromoId?`, `OrderDate?`, `PayStatus?`, `OrderStatus?`, `TotalAmount?`, `DiscountAmount?`, `OrderType?`, `PaymentMethod?`, `Name?`, `Address?`, `Phone?`, `Email?`, `Customer?`, `OrderItems[]`, `Payments[]`, `Promo?`, `User?`.

`OrderItemDto`: `OrderItemId`, `OrderId`, `ProductId`, `Quantity?`, `Price`, `Subtotal`, `Order?`, `Product?`.

## 9. Refund / hoàn tiền

Base route: `/api/refundrequest`. Mỗi action đều có `[Authorize]`, nhưng chưa có action-key policy riêng.

| Method | Endpoint | Request/query | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/refundrequest` | Query phân trang/tìm kiếm chung | `PagedResultDto<RefundRequestDto>` hoặc `RefundRequestDto[]` |
| `GET` | `/api/refundrequest/{id}` | Path refund ID | DTO; thiếu → `404` |
| `GET` | `/api/refundrequest/order/{orderId}` | Path order ID | `RefundRequestDto[]` |
| `GET` | `/api/refundrequest/status/{status}` | Path status | `RefundRequestDto[]` |
| `GET` | `/api/refundrequest/pending-count` | Không có | `{ "count": 0 }` |
| `POST` | `/api/refundrequest` | `CreateRefundRequestDto` | `201 RefundRequestDto`; argument → `400`; duplicate/pending conflict → `409` |
| `PUT` | `/api/refundrequest/{id}/process` | `ProcessRefundRequestDto` | `200 RefundRequestDto`; thiếu identity → `401`; không tồn tại → `404`; invalid operation → `400` |
| `DELETE` | `/api/refundrequest/{id}` | Path ID | `200 { message }`; thiếu → `404`; trạng thái không cho xóa → `400` |

Create chỉ kiểm tra order tồn tại và không có pending duplicate; service tạo status `pending`. Process chỉ xử lý request đang `pending` hoặc `approved`; khi completed sẽ cập nhật order/bill pay status thành refunded. Delete chỉ cho request pending.

## 10. Bill và doanh thu

Base route: `/api/bill`. **Controller hiện không có `[Authorize]`; tất cả endpoint bên dưới đang có thể gọi không cần JWT.** Đây là lỗ hổng cần khóa trước production.

| Method | Endpoint | Body/query | Response và lỗi |
|---|---|---|---|
| `POST` | `/api/bill/create-from-order/{orderId}` | Không có | `200 { message, data: BillDto }`; argument → `400`; duplicate/conflict → `409`; lỗi khác → `500` |
| `GET` | `/api/bill` | Không có | `BillDto[]` |
| `GET` | `/api/bill/{billId}` | Path ID | `BillDto`; thiếu → `404` |
| `GET` | `/api/bill/customer/{customerId}` | Path customer ID | `BillDto[]` |
| `GET` | `/api/bill/order/{orderId}` | Path order ID | `BillDto`; thiếu → `404` |
| `PUT` | `/api/bill/{billId}/status` | `{ "Status": "paid" }` | `200 { message, data }`; thiếu → `404`; status invalid → `400` |
| `POST` | `/api/bill/{billId}/pay` | `{ "PaymentMethod": "cash" }` | `200 { message, data }`; thiếu → `404` |
| `POST` | `/api/bill/{billId}/cancel` | Không có | `200 { message, data }`; thiếu → `404`; invalid transition → `400` |
| `DELETE` | `/api/bill/{billId}` | Path ID | `200 { message }`; thiếu → `404`; business rule → `400` |
| `GET` | `/api/bill/status/{status}` | Path status | `BillDto[]` |
| `GET` | `/api/bill/date-range` | `startDate`, `endDate` | `BillDto[]` |
| `GET` | `/api/bill/revenue/total` | Không có | `{ "totalRevenue": decimal }` |
| `GET` | `/api/bill/revenue/date-range` | `startDate`, `endDate` | `{ "revenue", "startDate", "endDate" }` |

Status bill service chấp nhận chính: `unpaid`, `paid`, `cancelled`; bill đã paid không được cancel/delete theo nghiệp vụ. `BillDto` gồm `BillId`, `OrderId`, `CustomerId`, `CustomerName`, `TotalAmount`, `DiscountAmount`, `FinalAmount`, `PaymentMethod`, `Status`, `CreatedAt`, `PaidAt`, `Name`, `Address`, `Phone`, `Email`.

## 11. Cart legacy dành cho admin/POS

Base route: `/api/cart`. **Controller hiện không có `[Authorize]`; ID customer trong URL là đủ để đọc/sửa giỏ.** Customer self-service có route khác `/api/customer/cart` và được bảo vệ bằng JWT customer.

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/cart/{customerId}/items` | Không có | `CartItemDto[]` |
| `POST` | `/api/cart/{customerId}/items` | `{ "ProductId": 1, "Quantity": 2 }` (`Quantity` mặc định 1) | `200 { message, data }`; exception → `400` |
| `PUT` | `/api/cart/{customerId}/items/{productId}` | `{ "Quantity": 5 }` | `200 { message, data }`; item thiếu → `404`; exception → `400` |
| `DELETE` | `/api/cart/{customerId}/items/{productId}` | Không có | `200 { message }`; item thiếu → `404` |
| `DELETE` | `/api/cart/{customerId}` | Không có | `200 { message }`; cart thiếu → `404` |
| `GET` | `/api/cart/{customerId}/total` | Không có | `{ "total": decimal }` |

`CartItemDto`: `ProductId`, `ProductName`, `Quantity`, `Price`, `Subtotal`, `CategoryName`.

## 12. Role, permission và gán quyền

### 12.1 Role

Base route: `/api/role`, `[Authorize]`.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `GET` | `/api/role` | Query phân trang/tìm kiếm chung | `PagedResultDto<RoleDto>` hoặc `RoleDto[]` |
| `POST` | `/api/role` | `RoleDto` | `201 RoleDto` |
| `PUT` | `/api/role/{id}` | `RoleDto` | `200 RoleDto`; thiếu → `404` |
| `DELETE` | `/api/role/{id}` | Path ID | `204`; thiếu → `404` |

### 12.2 Permission

Base route: `/api/permissions`, `[Authorize]`.

| Method | Endpoint | Request | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/permissions` | Query phân trang/tìm kiếm chung | `PagedResultDto<PermissionDto>` hoặc `PermissionDto[]` |
| `GET` | `/api/permissions/{id}` | Path ID | `PermissionDto`; thiếu → `404 { message }` |
| `POST` | `/api/permissions` | `PermissionDto` | `201 PermissionDto` |
| `PUT` | `/api/permissions/{id}` | `PermissionDto` | URL ID phải bằng body ID; lệch → `400`; thiếu → `404` |
| `DELETE` | `/api/permissions/{id}` | Path ID | `204`; thiếu → `404` |

### 12.3 Role-permission mapping

Base route: `/api/rolepermission`, `[Authorize]`. Các action catch `Exception` và trả `500` có `error` chi tiết.

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/rolepermission` | Không có | `RolePermissionDto[]` gồm mapping và thông tin join |
| `POST` | `/api/rolepermission/assign` | `{ "RoleId": 1, "PermissionId": 2 }` | `200 { message: "Gán quyền thành công" }` |
| `DELETE` | `/api/rolepermission/remove` | `{ "RoleId": 1, "PermissionId": 2 }` | `200 { message: "Xóa quyền thành công" }` |
| `GET` | `/api/rolepermission/role/{roleId}` | Path role ID | `PermissionDto[]` |

`RoleDto`: `RoleId`, `RoleName`, `Description?`, `Users[]`, `Permissions[]`.

`PermissionDto`: `PermissionId`, `PermissionName`, `ActionKey`, `Description?`, `Roles[]`.

`RolePermissionDto`: `RoleId`, `PermissionId`, và các property join tùy response: `RoleName?`, `RoleDescription?`, `PermissionName?`, `ActionKey?`, `PermissionDescription?`.

## 13. Admin AI và Operations Console

Đây là nhóm duy nhất ngoài upload ảnh có enforcement permission rõ ở controller. Customer JWT bị từ chối bằng cách kiểm tra absence của claim `customer_id`.

### 13.1 Admin AI chat

Base route: `/api/admin/ai`, `[Authorize]`. User phải là staff role `1` hoặc `2` và có `agent_chat` hoặc permission legacy `admin_ai_chat`.

| Method | Endpoint | Request | Response và lỗi |
|---|---|---|---|
| `GET` | `/api/admin/ai/sessions` | Không có | `AdminChatSessionDto[]` của user hiện tại |
| `GET` | `/api/admin/ai/sessions/{sessionId}` | Path ID | Session của user; thiếu → `404` |
| `DELETE` | `/api/admin/ai/sessions/{sessionId}` | Path ID | `204`; thiếu/không thuộc user → `404` |
| `POST` | `/api/admin/ai/chat/stream` | `AdminChatStreamRequestDto` | `200 text/event-stream`; unauthorized permission → `403`; request/session lỗi → `400/404` |

Body chat:

```json
{
  "SessionId": 12,
  "Message": "Tồn kho sản phẩm mì gói hiện tại thế nào?"
}
```

SSE trả từng dòng `data: <JSON>`, schema `AiChatStreamEventDto`: `Type`, `Text?`, `ToolName?`, `ToolArguments?`, `Summary?`, `SummaryMessageCount`, `HasProductSuggestion`, `SuggestedProducts?`, `ContextSources?`, `Error?`, `SessionId?`, `RunId?`. Khi event `done`, hội thoại được lưu.

Tool read-only hiện có:

| Tool | Chức năng |
|---|---|
| `search_products` | Tìm product, giá, tồn; query/category/max_results 1..20/only_in_stock |
| `get_stock` | Tồn theo product/category/supplier; low stock threshold mặc định 5 |
| `search_inventory` | Tìm inventory với bộ lọc tồn |
| `search_orders` | Tìm theo mã/trạng thái/customer/date/payment/order type; tối đa 20 |
| `get_order` | Chi tiết vận hành một order; ẩn PII |
| `sales_summary` | Doanh thu từ order completed + paid, discount; date range mặc định 30 ngày |

Tool registry đánh dấu `READ_ONLY`, enabled, timeout 30 giây; không có arbitrary SQL hoặc destructive tool.

### 13.2 Agents

Base route: `/api/admin/agents`, `[Authorize]` + permission tương ứng.

| Method | Endpoint | Permission | Request/response |
|---|---|---|---|
| `GET` | `/api/admin/agents` | `agent_view` | Query `page=1`, `pageSize=20`; paged agents |
| `GET` | `/api/admin/agents/{id}` | `agent_view` | `AgentDto`; thiếu → `404` |
| `POST` | `/api/admin/agents` | `agent_manage` | `SaveAgentDto`; `201 AgentDto`; argument → `400` |
| `PUT` | `/api/admin/agents/{id}` | `agent_manage` | `SaveAgentDto`; `200/404/400` |
| `PATCH` | `/api/admin/agents/{id}/enabled` | `agent_manage` | `{ "Enabled": true }`; `AgentDto` hoặc `404` |
| `PUT` | `/api/admin/agents/{id}/tools` | `agent_tool_manage` | `{ "ToolNames": ["search_products"] }`; `AgentDto`; invalid → `400` |

Validation trong `AgentOperationsService`: `Name` không rỗng, tối đa 100 ký tự; `SystemInstructions` không rỗng, tối đa 8.000 ký tự; `Model` tối đa 150 ký tự; `Temperature` trong `0..2`; `MaxToolRounds` trong `1..10`; tool phải tồn tại và đang enabled trong registry. Tool lạ hoặc disabled → `400`.

### 13.3 Runs, activity, tools, analytics

| Method | Endpoint | Permission | Query/response |
|---|---|---|---|
| `GET` | `/api/admin/agent-runs` | `agent_run_view` | `page`, `pageSize`, `agentId`, `status`, `trigger`, `userId`, `from`, `to`; run list |
| `GET` | `/api/admin/agent-runs/{id}` | `agent_run_view` | `AgentRunDetailDto`; thiếu → `404` |
| `GET` | `/api/admin/agent-activity` | `agent_logs_view` | page + `runId`, `agentId`, `type`, `level`, `tool`, `runStatus`, `from`, `to`; activity list |
| `GET` | `/api/admin/agent-activity/stream` | `agent_logs_view` | SSE activity stream; thiếu quyền → `403` |
| `GET` | `/api/admin/agent-tools` | `agent_tool_view` | `AgentToolDto[]` |
| `GET` | `/api/admin/agent-tools/{name}` | `agent_tool_view` | `AgentToolDto`; thiếu → `404` |
| `GET` | `/api/admin/agent-analytics` | `agent_analytics_view` | `from`, `to`; `AgentAnalyticsDto` |
| `GET` | `/api/admin/agent-analytics/overview` | `agent_analytics_view` | Alias của route analytics; `from`, `to` |

### 13.4 Reports

Base route: `/api/admin/agent-reports`.

| Method | Endpoint | Permission | Request/response |
|---|---|---|---|
| `GET` | `/api/admin/agent-reports` | `agent_report_view` | `page`, `pageSize`, `reportType`, `from`, `to`; report list |
| `GET` | `/api/admin/agent-reports/{id}` | `agent_report_view` | `AgentReportDto`; thiếu → `404` |
| `POST` | `/api/admin/agent-reports/sales` | `agent_report_generate` | `GenerateAgentReportDto`; `200 SalesReportDto`; argument → `400` |
| `POST` | `/api/admin/agent-reports/generate` | `agent_report_generate` | Alias của `/sales` |
| `GET` | `/api/admin/agent-reports/{id}/pdf` | `agent_report_view` | `application/pdf`, filename `agent-report-{id}.pdf`; thiếu → `404` |

`GenerateAgentReportDto`: `From: DateOnly`, `To: DateOnly`, `OrderType?`. `SalesReportDto`: `From`, `To`, `CompletedPaidOrderCount`, `Revenue`, `DiscountAmount`, `RefundAmount`, `Series[]` (`Date`, `OrderCount`, `Revenue`).

Agent run status trong backend: `QUEUED`, `RUNNING`, `WAITING_TOOL`, `COMPLETED`, `FAILED`, `CANCELLED`.

## 14. Permission seed và enforcement thực tế

Permission action key được seed:

```text
dashboard_view
user_manage
supplier_manage
category_manage
inventory_manage
promotion_manage
role_manage
permission_manage
customer_manage
product_manage
order_manage
admin_ai_chat       # legacy
agent_view
agent_chat
agent_run_view
agent_logs_view
agent_report_view
agent_report_generate
agent_tool_view
agent_tool_manage
agent_manage
agent_analytics_view
```

Role seed:

| Role ID | Vai trò | Mapping mặc định |
|---:|---|---|
| `1` | Admin | Nhận toàn bộ permission seed |
| `2` | Staff | Mặc định có `customer_manage`, `product_manage`, `order_manage` |

Điểm cần hiểu khi tích hợp:

1. `[Authorize]` chỉ kiểm tra JWT authenticated. Các controller CRUD thông thường (users, customer, category, supplier, product, inventory, promotion, order, role, permission, role-permission, refund) **không** gọi `HasClaim("permission", ...)`.
2. `POST /api/products/{id}/upload-image` là ngoại lệ: yêu cầu `Authorize(Roles = "1")`.
3. Admin AI yêu cầu role `1/2` + `agent_chat` hoặc `admin_ai_chat`.
4. Agent Operations yêu cầu action key cụ thể ở bảng trên.
5. `/api/bill` và `/api/cart` không có `[Authorize]`, cần khóa bằng auth/permission trước khi expose production.

## 15. API hỗ trợ nhưng không phải admin business API

Các controller sau không thuộc danh mục admin API chính:

- `/api/customer/auth/*`: đăng ký/login/profile customer.
- `/api/customer/products/*`: catalog public.
- `/api/customer/cart/*`, `/api/customer/bills/*`, `/api/customer/refundrequest` và `/api/customer/vnpay/*`: self-service customer.
- `/api/customer/orders/*`: phần lớn là self-service, có ownership check qua claim `customer_id`.
- `POST /api/customer/orders/update-order-and-bill-status` và `GET /api/customer/orders/online-orders-by-customer/{customerId}` là endpoint legacy nằm trong customer controller nhưng không có kiểm tra role/ownership riêng; cần review nếu còn dùng cho admin.

Chi tiết hai endpoint mixed:

| Method | Endpoint | Body/response |
|---|---|---|
| `GET` | `/api/customer/orders/online-orders-by-customer/{customerId}` | Trả `OrderDto[]`; chỉ có `[Authorize]`, không đối chiếu `customer_id` với path |
| `POST` | `/api/customer/orders/update-order-and-bill-status` | Body `UpdateOrderAndBillStatusDto` gồm `OrderId`, `StatusOrder`, `StatusBill`; trả kết quả service, không kiểm tra role/permission |
- `/api/test`, `/api/test/mysql`, `/api/test/mysql/info`, `/api/test/s3`, `/api/test/s3/presign`: diagnostic `[AllowAnonymous]`, không dùng làm admin API.

## 16. DTO tham chiếu nhanh

### Promotion, refund, role

```text
PromotionDto:
  PromoId, PromoCode, Description?, DiscountType, DiscountValue,
  StartDate, EndDate, MinOrderAmount?, UsageLimit?, UsedCount?, Status?, Orders[]

ApplyPromoRequestDto: PromoCode, TotalAmount
GiftVoucherDto: CustomerIds[], PromoId

CreateRefundRequestDto:
  OrderId, RefundAmount, Reason?, CustomerBankName?,
  CustomerBankAccount?, CustomerAccountHolder?
ProcessRefundRequestDto: Status, AdminNote?, GatewayRefundId?

RoleDto: RoleId, RoleName, Description?, Users[], Permissions[]
PermissionDto: PermissionId, PermissionName, ActionKey, Description?, Roles[]
RolePermissionDto: RoleId, PermissionId, join fields optional
```

### Agent Operations

```text
SaveAgentDto:
  Name, Description?, SystemInstructions, Model?, Temperature=0.2,
  MaxToolRounds=3, Tools?
AssignAgentToolsDto: ToolNames[]
SetAgentEnabledDto: Enabled
AgentDto: AgentId, Name, Description, SystemInstructions, Enabled, Model,
  Temperature, MaxToolRounds, Tools[], CreatedAt, UpdatedAt
AgentToolDto: Name, Description, Category, Version, Risk, TimeoutSeconds,
  Enabled, Schema, UsageCount, FailureCount
AgentRunListItemDto: AgentRunId, AgentId, AgentName, SessionId?, UserId?,
  Trigger, Status, CreatedAt, StartedAt?, CompletedAt?, ToolCallCount, ErrorMessage?
AgentRunDetailDto: AgentRunListItemDto + Input?, Output?, Model?, Events[], ToolCalls[]
AgentReportDto: AgentReportId, AgentRunId, AgentToolCallId?, ReportType, Title,
  Severity, From, To, StructuredContent, Markdown, CreatedAt
```

Nguồn implementation chính: `Controllers/*.cs`, `Dtos/*.cs`, `Services/*Service.cs`, `Services/AdminAiToolRegistry.cs`, `Database/ModelSeedData.cs`, `Program.cs`.

## 17. Các điểm cần xử lý trước production

1. Tách admin authorization khỏi customer authorization. Hiện customer JWT có `customer_id` nhưng các controller CRUD thông thường chỉ dùng `[Authorize]`, nên token customer có thể vượt qua lớp authentication để gọi users/catalog/order/RBAC/refund.
2. Bổ sung policy/action-key cho các controller quản trị; permission seed hiện chỉ thực sự được kiểm tra ở Admin AI, Agent Operations và upload ảnh product.
3. Thêm `[Authorize]` và role/permission policy cho toàn bộ `/api/bill` và `/api/cart`; hiện hai controller này public.
4. Không trả `Password`/password hash trong `UserDto`; tách `UserCreateDto`, `UserUpdateDto`, `UserResponseDto`.
5. Giới hạn ownership cho refund endpoints; hiện bearer hợp lệ có thể đọc toàn bộ refund và tạo refund cho `OrderId` bất kỳ.
6. Chuẩn hóa lỗi JSON, tránh trả `error = ex.Message` ra client ở các controller hiện tại.
7. Bổ sung OpenAPI/Swagger hoặc contract test để phát hiện route client gọi sai như `/api/reports/sales`.
