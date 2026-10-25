<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Dtos

## Purpose

43 request/response shapes — intentionally decoupled from `Models/` entities.

## Key Files

| File | Description |
|---|---|
| `ProductDto.cs`, `CategoryDto.cs`, `SupplierDto.cs` | Catalog |
| `OrderDto.cs`, `OrderItemDto.cs`, `OrderItemWithProductDto.cs` | Orders |
| `CartItemDto.cs`, `CheckoutDto.cs`, `ValidateCheckoutDto.cs`, `ValidateCartStockRequest.cs`, `ValidateCartStockResponse.cs` | Cart & checkout |
| `LoginRequestDto.cs`, `LoginResponseDto.cs`, `RefreshRequestDto.cs`, `RefreshResponseDto.cs` | Auth |
| `PaymentDto.cs`, `VNPayRequestDto.cs`, `VNPayResponseDto.cs`, `VNPayCallbackDto.cs` | Payments/VNPay |
| `BillDto.cs`, `RefundRequestDto.cs`, `PromotionDto.cs`, `InventoryDto.cs`, `GiftVoucherDto.cs` | Operations |
| `DashboardStatsDto.cs`, `DailyOrderStatsDto.cs`, `TopProductDto.cs`, `TopCustomerDto.cs`, `OrderByMonthDto.cs`, `SaleByMonthDto.cs`, `PeakTimeDto.cs`, `CustomerSpendingDto.cs` | Analytics |
| `UserDto.cs`, `RoleDto.cs`, `PermissionDto.cs`, `RolePermissionDto.cs` | Identity/RBAC |
| `CustomerDto.cs` | Customer projection |
| `AiChatDto.cs` | Customer AI chat request/response |
| `AgentOperationsDto.cs` | Agent, run, event, tool-call, report and admin-chat-session shapes for the admin AI console |
| `ApplyPromoDto.cs`, `CancelOrderDto.cs`, `UpdateOrderStatusDto.cs`, `UpdateOrderAndBillStatusDto.cs` | Command DTOs for order/bill state changes |

## For AI Agents

### Working In This Directory

- Keep DTOs independent from EF entities; map explicitly — never expose entities directly.
- PascalCase properties are wire-contract (`Program.cs` `PropertyNamingPolicy=null`); don't camelCase.
- Additions here require updates in `Services/` mapping + `Controllers/` + callers (`frontend-customer/src/types`).
- `UserDto.cs` projects `Password = ""` — the BCrypt hash must never reach the wire. Keep that projection when you touch it.
- Command DTOs that drive the audit trail (`CancelOrderDto`, `UpdateOrderStatusDto`, `UpdateOrderAndBillStatusDto`) are read by `../Middleware/AuditLogMiddleware.cs` to distinguish an approve from a reject. Renaming their fields changes what gets logged.

### Testing Requirements

- `dotnet build dotnet_backend.sln` from parent; verify JSON round-trip against the storefront.
- `dotnet test ../dotnet_backend.Tests/dotnet_backend.Tests.csproj`.

### Common Patterns

- One file per domain, named `<Entity>Dto.cs`.
- Command DTOs carry only the fields the action needs — no entity references.

## Dependencies

### Internal

- `../Models/` — the entities the services map from
- `../Controllers/` — the actions that bind these shapes
- `../../frontend/`, `../../frontend-customer/` — the clients that parse them

### External

- None. DTOs are plain C# classes with no attributes.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
