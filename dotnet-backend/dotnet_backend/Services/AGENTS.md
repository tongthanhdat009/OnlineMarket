<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Services

## Purpose

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
| `AiService.cs` | Customer AI chat over the OpenAI-compatible gateway |
| `AdminAiService.cs`, `AdminAiToolRegistry.cs`, `AdminChatSessionService.cs` | Admin AI chat, the code-owned read-only tool registry, persisted admin chat sessions |
| `AgentRuntime.cs`, `AgentOperationsService.cs`, `AgentReportService.cs`, `AgentAutoAnalysisService.cs` | Agent execution loop, run/activity persistence, report generation, background auto-analysis worker (`AgentAutoAnalysisWorker`) |
| `AuditLogService.cs` | Writes `audit_logs` rows (called from `../Middleware/AuditLogMiddleware.cs`) |
| `SalesReportService.cs` | Sales reporting queries (namespace `dotnet_backend.Services`) |
| `EmailService.cs`, `InvoicePdfService.cs` | SMTP send + QuestPDF invoice render |
| `RefundRequestService.cs`, `RoleService.cs`, `PermissionService.cs`, `RolePermissionService.cs` | Refunds + RBAC |
| `OdooHookService.cs` | Fire-and-forget outbound webhook to the Odoo connector on a paid order (`/ingest/market`, HMAC-SHA256 `X-Signature` header) |

## Subdirectories

| Directory | Purpose |
|---|---|
| `Interface/` | `I*Service` contracts (see `Interface/AGENTS.md`) |
| `Reporting/` | **Empty.** `ISalesReportService.cs` lives in `Interface/` but uses the namespace `dotnet_backend.Services.Reporting`; `SalesReportService.cs` uses `dotnet_backend.Services`. Moving files must move namespaces too. |

## For AI Agents

### Working In This Directory

- Expose every controller-facing operation through `Interface/I*Service`; keep DI binding names in sync with `Program.cs`.
- Use DI for `ApplicationDbContext` + external clients (`IAmazonS3`, `HttpClient`); never `new` them.
- Preserve domain invariants & payment signature checks; add validation before mutating `Models/`.
- `S3Service` requires `AWS_BUCKET` + creds; missing config must still build via `UnavailableS3Service`.
- `AdminAiToolRegistry` is **read-only** by design — every tool is `Risk = "READ_ONLY"` and arbitrary SQL / `execute_sql` is rejected. Keep that when adding a tool.
- `OdooHookService` is registered as a concrete type (`AddScoped<OdooHookService>()`), not behind an interface. It swallows all exceptions — a failed webhook must never fail the order. It reads `ODOO_CONNECTOR_URL` and `ODOO_WEBHOOK_SECRET` from the environment; there is no `.env` entry for them yet.
- `AgentRuntime` broadcasts activity in-process through `IAgentActivityBroadcaster` (a singleton). SSE delivery is in-process only — there is no broker.

### Testing Requirements

- `dotnet build ../../dotnet_backend.sln` from `Interface/` or `make build-backend` from root.
- `dotnet test ../../dotnet_backend.Tests/dotnet_backend.Tests.csproj` — the suite covers `AgentPayloadSanitizer`, `AgentRunStatus` terminal states and the tool registry.

### Common Patterns

- One service per domain, implementing the matching `Interface/I*Service`.
- External clients come from DI (`IAmazonS3`, `IHttpClientFactory`), never `new`.

## Dependencies

### Internal

- `Interface/` — the contracts (see `Interface/AGENTS.md`)
- `../Database/ApplicationDbContext.cs` — the data access
- `../Dtos/` and `../Models/` — the shapes read and written
- `../Program.cs` — the DI registrations

### External

- BCrypt.Net-Next 4.0.3 — password hashing
- AWSSDK.S3 4.0.14.3 — object storage
- QuestPDF 2025.7.4 — invoice rendering
- System.Net.Http (`HttpClientFactory`) — the OpenAI-compatible gateway and the Odoo connector

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
