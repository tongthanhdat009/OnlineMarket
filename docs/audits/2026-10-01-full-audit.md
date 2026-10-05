# Full audit — 2026-10-01

Phạm vi: API ASP.NET Core + MySQL 8.0, admin SPA, customer SPA, payment/checkout, auth/RBAC, AI/Agent và `9router:local`. Test trên DB local thật, không dùng mock cho các luồng HTTP/DB chính.

## Lỗi phát hiện và đã sửa

| Khu vực | Lỗi | Sửa |
|---|---|---|
| Admin auth | Customer JWT truy cập được admin API; anonymous gọi được một số endpoint admin | `AdminOnly` + policy permission; toàn bộ admin controller yêu cầu staff/admin phù hợp |
| JWT | Claim `ClaimTypes.Role` bị đọc sai sau khi tắt inbound mapping; admin `me`/role bị 403 | Giữ mapping chuẩn, đặt `NameClaimType`/`RoleClaimType` đúng |
| RBAC | Staff role 2 gọi được users, roles, permissions, inventory, promotion… dù không có quyền | Policy `Permission:<action>`; admin role 1 full access, staff chỉ action keys được cấp |
| User data | API trả BCrypt password hash | DTO projection trả `Password = ""`; test xác nhận không có hash |
| MySQL diagnostics | `/api/test/mysql/info` 500 khi connection string có password/format khác | Parse bằng `DbConnectionStringBuilder`, chỉ trả metadata, không trả secret |
| Checkout | Online checkout không reserve stock; approve/pay có thể trừ kho lần hai; raw SQL dùng tên bảng sai | Transaction + `SELECT … FOR UPDATE` trên `inventory`; online reservation idempotent; cancel release stock |
| Payment | Có thể trả sai amount, trả trùng, method không hợp lệ, body đổi `OrderId`; tính discount hai lần | Exact outstanding amount từ Bill, pending/success state, method allowlist, route order ID là nguồn tin cậy |
| Refund/cancel | Cancel paid online giữ reservation; confirm refund có nguy cơ release trùng | Cancel online release một lần; confirm refund nhận biết reservation đã release; cancel lần hai bị từ chối |
| POS order | Quantity âm/0 hoặc vượt kho có thể làm sai tồn | Validate product/quantity/deleted/price, lock và aggregate duplicate product trước khi reserve |
| Promotion | `UsageLimit = 0/null` bị chặn như hết quota; fixed discount có thể làm total âm | 0/null = unlimited; limit chỉ áp dụng khi >0; discount cap ở tổng đơn |
| Customer auth | Email/phone/password/name malformed vẫn qua; profile/change password thiếu giới hạn | Trim/normalize + email/phone/password/name validation; change password 6–128 ký tự |
| Customer catalog/cart | Chi tiết sản phẩm soft-deleted vẫn lộ; có thể thêm sản phẩm đã ngừng bán vào cart | Public detail trả 404; cart add từ chối product `Deleted`; test 10/10 mỗi case |
| Customer order boundary | Order-item detail và legacy order/status routes không kiểm tra ownership; customer có thể gọi status mutation | Ownership check; legacy status mutation trả 403; cross-customer order/item/online-list test 10/10 trả 403 |
| Customer legacy checkout | `create-from-cart` tạo order offline/paid trực tiếp, khác luồng checkout chính | Chuyển route legacy sang checkout transactional online, dùng giá/tồn kho hiện tại và payment state pending |
| Cart price/checkout | Preview/checkout dùng snapshot `CartItem.Price`, có thể tính giá cũ sau catalog update; preview bỏ qua tồn kho | Preview/checkout dùng giá catalog hiện tại, validate stock/deleted/payment method, reserve transactionally |
| VNPay customer flow | Client tự chọn amount/return URL; callback thiếu amount check, trừ kho online lần hai, failure không release reservation, retry không idempotent | Exact Bill amount + trusted return URL; signed callback amount check; online reservation idempotent; failed callback release + row lock |
| Customer refund | Có thể gửi amount 0/vượt bill; tạo thêm request khi request cũ đã approved/completed | Validate paid order/refundable amount; chỉ cho retry khi request cũ rejected |
| AI gateway | Timeout/429/5xx upstream làm request fail ngay | Retry có backoff 3 lần trong `AiService` và `AdminAiService` |
| Agent activity SSE | Stream không flush header khi channel idle, browser/EventSource bị treo | Flush response body ngay sau `StartAsync` |
| Admin SPA | Test phụ thuộc `.env` absolute URL; network lỗi làm logout; deep-link return URL không an toàn | Base URL test độc lập; chỉ clear session ở 401/403; validate return URL/auth redirect |
| Customer SPA | Stale cart refresh race; auth return URL; VNPay callback thiếu feedback | Đồng bộ refresh; guard/return URL; hiển thị callback message |

## Bằng chứng test

- API health: `GET /api/test`, `/api/test/mysql`, `/api/test/mysql/info`: **10/10 lần × 3 = 30/30 HTTP 200**.
- Auth/RBAC: admin matrix **10/10 × 14 endpoint**; staff matrix **10/10 × 6 endpoint được phép + 8 endpoint bị 403**; customer JWT bị chặn khỏi admin surface; object boundary customer order trả 403.
- Customer registration: **10/10 lần × 7 input invalid + 2 input valid**, duplicate email bị 400; dữ liệu test đã xóa.
- Customer API: **10/10 × 7 endpoint authenticated + 6 endpoint anonymous**; statuses đúng 200/401.
- Customer catalog: public product/category/search/detail **10/10**; soft-deleted detail/add-to-cart **10/10 HTTP 404/400**.
- Customer cart: invalid quantity/product, duplicate add, update/remove/clear, stock/promo validation; mỗi nhóm **10 case pass**, cart sạch sau test.
- Customer order boundary: cross-customer detail/item/online-list và legacy status mutation **10/10 HTTP 403**; own list **200**.
- Customer order lifecycle: preview selected/all/invalid selection, stale-price preview/checkout uses current catalog price, stock-zero preview/checkout **10/10 HTTP 400**, invalid payment method 400; online reserve/cancel/payment cleanup verified.
- VNPay: create-payment invalid/under/over amount **400**, exact amount **200** with configured return URL; signed success callback **2/2 idempotent** with stock unchanged after reservation; signed failure callback **2/2** releases stock once; wrong amount signature **10/10** leaves order pending.
- Customer payment/invoice/refund: wrong amount/method/duplicate payment; own invoice **3/3 HTTP 200 PDF**, cross-owner 403, unknown 404; refund invalid amount **3/3 400**, valid create/cancel 201/200, second cancel 404.
- Customer AI: empty chat **10/10 HTTP 400**; authenticated stream **3/3** has `done`; add-to-cart validates auth/empty/partial invalid products.
- Online checkout/payment: stock `198 → 197` đúng một lần; wrong route/body payment 400; exact payment 200; duplicate 400; paid online cancel trả stock `197 → 198`; cancel lần hai 400; order test đã xóa.
- Admin POS: **10/10 × zero/negative/oversell** trả 400; valid order trừ đúng 1 đơn vị; order test đã xóa và inventory trả baseline.
- DB integrity sau cleanup: users 3, customers 20, products 50, inventory 50, orders 33, order_items 95, bills 16, payments 33, promotions 5, refunds 4; orphan inventory/order-items 0; subtotal/bill mismatch 0; negative inventory 0.
- .NET tests: **10/10 consecutive**, mỗi lần `Passed 10, Failed 0`.
- Admin Vitest: **10/10 consecutive**, mỗi lần `4/4 passed`.
- Customer Vitest: **10/10 consecutive**, mỗi lần `2 files / 9 tests passed`.
- `make build`: backend + 2 SPA build pass; backend **0 warning / 0 error**.
- SPA dev smoke: `http://127.0.0.1:5173/` và `:5193/` đều HTTP 200 HTML.
- `9router` container: `running`, `/api/health` HTTP 200, port `20128`; authenticated `/v1/models` **10/10 HTTP 200**, configured model `onlinemarket` tồn tại; authenticated `/v1/chat/completions` **3/3 HTTP 200**; customer AI chat retry **3/3 HTTP 200**, customer/admin AI SSE đều có event `done`. `/v1/*` cần API key lưu trong local 9router DB và khớp `.env`; không ghi key vào report.
- Admin Agent Operations: `/api/admin/agents`, `agent-runs`, `agent-activity`, `agent-tools`, `agent-analytics`, `agent-reports` **10/10 lần × 6 endpoint**; admin 200, staff/customer 403, anonymous 401. Activity SSE được test admin **3/3 header 200**, staff **3/3 403**.

## Caveat còn lại

- `9router` hiện bind `0.0.0.0:20128`, `REQUIRE_API_KEY=false`, `AUTH_COOKIE_SECURE=false`. Phù hợp local container test; không đưa nguyên trạng ra mạng/prod.
- Một số upstream model free có thể trả 502/timeout nhất thời; `AiService` đã retry 3 lần, sau retry kiểm tra lại customer chat trả 200. Cần health check upstream trước khi dùng production.
- Seed DB có 1 dữ liệu lịch sử `orders.pay_status='paid'` nhưng payment tương ứng `pending`. Không tự sửa dữ liệu seed trong audit để tránh thay đổi nghiệp vụ lịch sử; cần migration/data-fix riêng nếu muốn chuẩn hóa.
- Vite báo chunk admin >500 kB sau minify. Build vẫn pass; nên code-split khi tối ưu performance.
