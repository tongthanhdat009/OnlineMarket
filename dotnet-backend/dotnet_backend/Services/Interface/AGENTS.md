<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Interface

## Purpose

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
| `IAdminAiService.cs` | Admin AI chat contract |
| `IAgentOperationsServices.cs` | Six agent contracts in one file: `IAdminChatSessionService`, `IAgentRuntime`, `IAgentActivityBroadcaster`, `IAgentOperationsService`, `IAgentReportService`, `IAgentAutoAnalysisService` |
| `IAuditLogService.cs` | Audit trail write contract |
| `ISalesReportService.cs` | Sales reporting contract — namespace `dotnet_backend.Services.Reporting` while the file sits in `Interface/` |

## For AI Agents

### Working In This Directory

- Change an interface only with its implementation, DI registration in `../../Program.cs`, and callers (`Controllers/`).
- Keep methods `async` (`Task<T>`) and DTO-typed; don't leak EF entities across the boundary.
- Don't add sync overloads or concrete-type coupling.
- `IAgentActivityBroadcaster` is registered as a **singleton**; every other contract here is scoped. Keep that lifetime split.
- `ISalesReportService` uses a different namespace from the rest of this folder. Match the namespace of the file, not of the folder.

### Testing Requirements

- `dotnet build ../../dotnet_backend.sln` after signature change.
- `dotnet test ../../dotnet_backend.Tests/dotnet_backend.Tests.csproj`.

### Common Patterns

- One interface per domain, in the same file as its siblings of that domain.
- Methods are `async` and return DTOs, never entities.

## Dependencies

### Internal

- `..` — the implementations of these contracts
- `../../Controllers/` — the callers
- `../../Program.cs` — the DI registrations
- `../../Dtos/` — the types on the method signatures

### External

- None. These are plain interfaces with no attributes.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
