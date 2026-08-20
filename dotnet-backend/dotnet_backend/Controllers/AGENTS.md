<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Controllers

24 attribute-routed controllers — admin + customer (`Customer*`) surface over the same services.

## Key Files

| File | Description |
|---|---|
| `AuthController.cs` / `CustomerAuthController.cs` | Admin vs customer login/refresh/logout |
| `ProductController.cs` / `CustomerProductController.cs` | Admin CRUD+upload vs public catalog |
| `OrderController.cs` / `CustomerOrderController.cs` | Admin order mgmt vs customer order create/list |
| `CartController.cs` / `CustomerCartController.cs` | Admin cart vs customer cart |
| `BillController.cs` / `CustomerBillController.cs` | Billing (admin) vs customer bill view |
| `CustomerVNPayController.cs` | VNPay pay + callback bridge |
| `InventoryController.cs`, `CategoryController.cs`, `SupplierController.cs` | Catalog support |
| `RefundRequestController.cs` / `CustomerRefundController.cs` | Refund flows |
| `RoleController.cs`, `PermissionController.cs`, `RolePermissionController.cs` | RBAC admin |
| `AiController.cs`, `UserController.cs`, `CustomerController.cs` | AI chat / user & customer admin |

## For AI Agents

- Inject `I*Service` interfaces only; business logic stays in `Services/`.
- Keep `async` actions, consistent `IActionResult` / typed results, and existing `[Authorize]`/`[AllowAnonymous]` — auth changes need review.
- Customer controllers are public-scoped; don't leak admin DTOs/roles there.
- Verify moved/renamed endpoints against `dotnet-backend.http` and both frontends (`dotnet-frontend/src/api/*.js`, `BlazorApp/services/*`).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
