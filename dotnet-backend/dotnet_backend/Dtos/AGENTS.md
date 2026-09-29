<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Dtos

~35 request/response shapes — intentionally decoupled from `Models/` entities.

## Key Files

| File | Description |
|---|---|
| `ProductDto.cs`, `CategoryDto.cs`, `SupplierDto.cs` | Catalog |
| `OrderDto.cs`, `OrderItemDto.cs`, `OrderItemWithProductDto.cs` | Orders |
| `CartItemDto.cs`, `CheckoutDto.cs`, `ValidateCheckoutDto.cs` | Cart & checkout |
| `LoginRequestDto.cs`, `LoginResponseDto.cs`, `RefreshRequestDto.cs` | Auth |
| `PaymentDto.cs`, `VNPayRequestDto.cs`, `BillDto.cs` | Payments/billing |
| `RefundRequestDto.cs`, `PromotionDto.cs`, `InventoryDto.cs` | Operations |
| `DashboardStatsDto.cs`, `DailyOrderStatsDto.cs`, `TopProductDto.cs` | Analytics |
| `UserDto.cs`, `RoleDto.cs`, `PermissionDto.cs` | Identity/RBAC |

## For AI Agents

- Keep DTOs independent from EF entities; map explicitly — never expose entities directly.
- PascalCase properties are wire-contract (`Program.cs` `PropertyNamingPolicy=null`); don't camelCase.
- Additions here require updates in `Services/` mapping + `Controllers/` + callers (`frontend-customer/src/types`).

## Testing Requirements

- `dotnet build dotnet_backend.sln` from parent; verify JSON round-trip against the storefront.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
