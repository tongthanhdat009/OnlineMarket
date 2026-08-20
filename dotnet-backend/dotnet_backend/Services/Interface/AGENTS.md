<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Interface

Controller-facing service contracts — one `I*Service` per domain; impls in `..`.

## Key Files

| File | Description |
|---|---|
| `IProductService.cs`, `ICategoryService.cs`, `ISupplierService.cs` | Catalog contracts |
| `IOrderService.cs`, `IOrderItemService.cs`, `ICartService.cs` | Order/cart contracts |
| `IBillService.cs`, `IInventoryService.cs`, `IPromotionService.cs` | Billing/stock/promo |
| `IAuthService.cs`, `ICustomerAuthService.cs`, `IUserService.cs` | Auth + user |
| `IPaymentService.cs`, `IVNPayService.cs` | Payment + gateway |
| `IRoleService.cs`, `IPermissionService.cs`, `IRolePermissionService.cs` | RBAC |
| `IAiService.cs`, `IRefundRequestService.cs`, `IS3Service.cs` | AI/refund/S3 |
| `IInvoicePdfService.cs`, `ICustomerService.cs` | Invoice/customer |

## For AI Agents

- Change an interface only with its implementation, DI registration in `../../Program.cs`, and callers (`Controllers/`).
- Keep methods `async` (`Task<T>`) and DTO-typed; don't leak EF entities across the boundary.
- Don't add sync overloads or concrete-type coupling.

## Testing Requirements

- `dotnet build ../../dotnet_backend.sln` after signature change.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
