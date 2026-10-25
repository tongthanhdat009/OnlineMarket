<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# Middleware

## Purpose

ASP.NET Core middleware. One file today: the audit trail writer.

## Key Files

| File | Description |
|---|---|
| `AuditLogMiddleware.cs` | Buffers the response body of every `POST`/`PUT`/`PATCH`/`DELETE`, and on a 2xx writes one `AuditLog` row: actor (admin / customer / system), action key, subject type + id, method, path, status code and a Vietnamese note. Registered in `../Program.cs` after `UseAuthorization()` and before `MapControllers()`. |

## For AI Agents

### Working In This Directory

- The middleware derives everything from the **route**, not from a hand-registered list of endpoints. `ResolveAction` maps route segments → action key (`order` + `cancel` → `OrderCancelled`, `bill` + `pay` → `BillPaid`, …) with a generic fallback of `{Entity}Created` / `{Entity}Updated` / `{Entity}Deleted`.
- New entity verbs need a case in `ResolveAction` and, if the wording is specific, in `Describe`. Without a case the row still gets written, just with a generic label.
- `ExcludedPrefixes` keeps auth, AI-stream and cart calls out of the trail: `/api/auth`, `/api/customer/auth`, `/api/admin/ai`, `/api/customer/ai`, `/api/cart`, `/api/customer/cart`.
- `ReadVerbs` (`preview`, `validate-checkout`, `validate-cart-stock`, `apply`) are treated as reads even though they are `POST`s.
- The response body is buffered into a `MemoryStream` and copied back to the original stream in every path, including the exception path. If you touch that code, keep the `finally` copy — a lost copy truncates the client response.
- `ExtractCreatedId` parses the buffered JSON to find the new entity id (nested up to depth 5). It only runs when the response is `application/json`.
- The request body is read only for paths ending in `/process` (`NeedsStatus`), which is how refund approve/reject is distinguished.

### Testing Requirements

- `dotnet build ../dotnet_backend.sln`.
- Manual: call a mutating endpoint as admin and as customer, then check the `audit_logs` table for the actor type, action and subject.
- The audit read API is `GET /api/admin/audit-log` (`../Controllers/AuditLogController.cs`).

### Common Patterns

- `sealed class` with a single `InvokeAsync(HttpContext, IServiceScopeFactory)` — the scoped `IAuditLogService` is resolved from a fresh scope so the audit write does not join the request's EF context.
- Audit failures are logged to the console and swallowed: a logging failure must never fail the business request.

## Dependencies

### Internal

- `../Models/AuditLog.cs` — the entity written
- `../Services/AuditLogService.cs` + `../Services/Interface/IAuditLogService.cs` — the write path
- `../Controllers/AuditLogController.cs` — the read API
- `../Program.cs` — registration order

### External

- `Microsoft.AspNetCore.Http` — `HttpContext`, `RequestDelegate`
- `System.Text.Json` — response body parsing
- EF Core — the `AuditLog` write happens in the service, not here

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
