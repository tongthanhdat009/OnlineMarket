<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Services

Domain logic & integrations behind `Interface/I*Service` contracts; controllers depend on interfaces.

## Key Files

| File | Description |
|---|---|
| `ProductService.cs`, `CategoryService.cs`, `SupplierService.cs` | Catalog domain |
| `OrderService.cs`, `OrderItemService.cs`, `CartService.cs` | Order + cart workflow |
| `InventoryService.cs`, `BillService.cs`, `PromotionService.cs` | Stock, billing, promotions |
| `AuthService.cs` / `CustomerAuthService.cs` | JWT issue/refresh, BCrypt verify |
| `PaymentService.cs`, `VNPayService.cs` | Payment record + VNPay sign/verify |
| `S3Service.cs` / `UnavailableS3Service.cs` | S3 upload/presign vs no-op when `AWS_*` missing |
| `AiService.cs` | OpenRouter chat (via `HttpClientFactory` + `OpenRouter:ApiKey/Model`) |
| `EmailService.cs`, `InvoicePdfService.cs` | SMTP send + QuestPDF invoice render |
| `RefundRequestService.cs`, `RoleService.cs`, `PermissionService.cs`, `RolePermissionService.cs` | Refunds + RBAC |

## Subdirectories

| Directory | Purpose |
|---|---|
| `Interface/` | `I*Service` contracts (see `Interface/AGENTS.md`) |

## For AI Agents

- Expose every controller-facing operation through `Interface/I*Service`; keep DI binding names in sync with `Program.cs`.
- Use DI for `ApplicationDbContext` + external clients (`IAmazonS3`, `HttpClient`); never `new` them.
- Preserve domain invariants & payment signature checks; add validation before mutating `Models/`.
- `S3Service` requires `AWS_BUCKET` + creds; missing config must still build via `UnavailableS3Service`.

## Testing Requirements

- `dotnet build ../../dotnet_backend.sln` from `Interface/` or `make build-backend` from root.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
