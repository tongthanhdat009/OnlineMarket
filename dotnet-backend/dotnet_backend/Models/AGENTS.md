<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-10-22 -->

# Models

## Purpose

EF Core entity domain — relational store-management core. 18 files.

## Key Files

| File | Description |
|---|---|
| `Product.cs`, `Category.cs`, `Supplier.cs` | Catalog entities |
| `Order.cs`, `OrderItem.cs`, `CartItem.cs` | Order/cart entities |
| `Customer.cs`, `User.cs` | Actors |
| `Role.cs`, `Permission.cs`, `RolePermission.cs` | RBAC join |
| `Inventory.cs`, `Promotion.cs` | Stock & discounts |
| `Bill.cs`, `Payment.cs`, `RefundRequest.cs` | Billing/payments |
| `AgentOperations.cs` | `partial` classes for the AI agent console — `Agent`, `AgentTool`, `AgentRun`, `AgentEvent`, `AgentToolCall`, `AgentReport`, `AdminChatSession`, `AdminChatMessage` — plus the static `AgentRunStatus` (terminal-state helper) and `AgentEventType` |
| `AuditLog.cs` | The audit trail row written by `../Middleware/AuditLogMiddleware.cs` |

## For AI Agents

### Working In This Directory

- Preserve `partial` class, nullable FKs (`int?`/`Guid?`), and `virtual` navigation props — generation/mapping depends on them.
- Every entity change → `Database/ApplicationDbContext.cs` + `Migrations/` + `Dtos/` + `Services/` together.
- Don't rename columns/tables without a migration; don't hand-edit the snapshot.
- The agent entities live in one file on purpose (`AgentOperations.cs`) and their `DbSet`s are in the partial `../Database/ApplicationDbContext.AgentOperations.cs`. The audit entity is split the same way (`../Database/ApplicationDbContext.AuditLog.cs`).
- `AgentRunStatus.IsTerminal(status)` is the shared definition of a finished run — `Completed`, `Failed`, `Cancelled` are terminal; `Queued`, `Running`, `WaitingTool` are not. The unit test pins this list; changing it breaks the test.

### Testing Requirements

- `dotnet build dotnet_backend.sln`; for schema change run `dotnet ef migrations add <Name>` + verify against disposable DB (`make db-reset`).
- `dotnet test ../dotnet_backend.Tests/dotnet_backend.Tests.csproj` — covers `AgentRunStatus` terminal states.

### Common Patterns

- Navigation properties are `virtual` and the FK is nullable, so EF can create the relation in one direction.
- Static helper classes (`AgentRunStatus`, `AgentEventType`) live next to their entities but are not mapped.

## Dependencies

### Internal

- `../Database/ApplicationDbContext*.cs` — the `DbSet`s and the mappings
- `../Dtos/` — the wire shapes mapped from these entities
- `../Migrations/` — the schema history for these tables

### External

- Microsoft.EntityFrameworkCore — the entity base and the attributes used

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
