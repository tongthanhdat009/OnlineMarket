<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-08-20 -->

# Models

EF Core entity domain — relational store-management core.

## Key Files

| File | Description |
|---|---|
| `Product.cs`, `Category.cs`, `Supplier.cs` | Catalog entities |
| `Order.cs`, `OrderItem.cs`, `CartItem.cs` | Order/cart entities |
| `Customer.cs`, `User.cs` | Actors |
| `Role.cs`, `Permission.cs`, `RolePermission.cs` | RBAC join |
| `Inventory.cs`, `Promotion.cs` | Stock & discounts |
| `Bill.cs`, `Payment.cs`, `RefundRequest.cs` | Billing/payments |

## For AI Agents

- Preserve `partial` class, nullable FKs (`int?`/`Guid?`), and `virtual` navigation props — generation/mapping depends on them.
- Every entity change → `Database/ApplicationDbContext.cs` + `Migrations/` + `Dtos/` + `Services/` together.
- Don't rename columns/tables without a migration; don't hand-edit the snapshot.

## Testing Requirements

- `dotnet build dotnet_backend.sln`; for schema change run `dotnet ef migrations add <Name>` + verify against disposable DB (`make db-reset`).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
