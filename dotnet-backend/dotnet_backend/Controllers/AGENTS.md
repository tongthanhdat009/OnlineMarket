<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Controllers

## Purpose

27 controller files — admin + customer (`Customer*`) surface over the same services. `AgentOperationsControllers.cs` alone holds 7 controllers.

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
| `AiController.cs` (`api/customer/ai`), `AdminAiController.cs` (`api/admin/ai`) | Customer vs admin AI chat |
| `AgentOperationsControllers.cs` | Seven admin agent controllers: `api/admin/agents`, `api/admin/agent-runs`, `api/admin/agent-activity`, `api/admin/agent-tools`, `api/admin/agent-analytics`, `api/admin/agent-reports`, `api/admin/agent-auto-analysis` — all deriving from `AgentAdminControllerBase` |
| `AuditLogController.cs` (`api/admin/audit-log`) | Read access to the audit trail |
| `UserController.cs`, `CustomerController.cs` | User & customer admin |

## For AI Agents

### Working In This Directory

- Inject `I*Service` interfaces only; business logic stays in `Services/`.
- Keep `async` actions, consistent `IActionResult` / typed results, and existing `[Authorize]`/`[AllowAnonymous]` — auth changes need review.
- Customer controllers are public-scoped; don't leak admin DTOs/roles there.
- Routes are either `api/[controller]` (so `api/Order`, `api/Bill`, `api/Cart`, `api/Role`, `api/Permissions`, …) or an explicit literal (`api/products`, `api/admin/ai`, `api/admin/agents`). Adding a controller with `api/[controller]` changes the URL when the class is renamed.
- Every mutating route is picked up automatically by `../Middleware/AuditLogMiddleware.cs` — it derives the action from the route shape, so a new route shows up in the audit trail without any registration.
- Verify moved/renamed endpoints against `../dotnet-backend.http` and the customer storefront callers (`../../../frontend-customer/src/api/client.ts`).

### Testing Requirements

- `dotnet build ../dotnet_backend.sln`.
- `dotnet test ../dotnet_backend.Tests/dotnet_backend.Tests.csproj`.
- The Playwright suites in `../../../e2e/tests/admin/` and `../../../e2e/tests/customer/` cover the admin and customer surfaces against staging.

### Common Patterns

- Routes are declared on the controller class, not per action, except where the path is not the controller name.
- Return DTOs, never entities. `UserDto` is the model to copy — the password hash is projected away.

## Dependencies

### Internal

- `../Services/Interface/` — the contracts injected into the actions
- `../Dtos/` — the request/response shapes
- `../Middleware/AuditLogMiddleware.cs` — derives the audit action from the route
- `../../frontend/`, `../../frontend-customer/` — the callers of these endpoints

### External

- Microsoft.AspNetCore.Mvc — routing, model binding, authorization attributes

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
