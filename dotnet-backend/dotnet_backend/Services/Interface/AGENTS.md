<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Interface

## Purpose
Controller-facing contracts for application services.

## Key Files
| File | Description |
|---|---|
| `IProductService.cs` | Product service contract. |
| `IOrderService.cs` | Order service contract. |
| `IAuthService.cs` | Admin authentication contract. |
| `IVNPayService.cs` | VNPay integration contract. |

## For AI Agents

### Working In This Directory
- Change an interface only with its implementation, DI registration, and callers.
- Prefer explicit async operation names and DTO boundaries.

### Testing Requirements
- Build `../../dotnet_backend.sln` after signature changes.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
