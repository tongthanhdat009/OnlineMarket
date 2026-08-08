<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Models

## Purpose
EF Core entity models for the store-management relational domain.

## Key Files
| File | Description |
|---|---|
| `Product.cs` | Product entity and relations. |
| `Order.cs` | Order entity and lifecycle data. |
| `Customer.cs` | Customer entity. |
| `Inventory.cs` | Stock entity. |
| `RolePermission.cs` | Role-permission join entity. |

## For AI Agents

### Working In This Directory
- Preserve `partial` entities, nullable foreign keys, and virtual navigation properties.
- Coordinate entity changes with `../Database/ApplicationDbContext.cs`, SQL schema, DTOs, and services.

### Testing Requirements
- Build `../dotnet_backend.sln`; validate schema compatibility locally before data changes.

## Dependencies

### Internal
- `../Database/` configures entity mappings.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
