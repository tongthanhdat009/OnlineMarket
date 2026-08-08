<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Services

## Purpose
Business logic for catalog, auth, carts, orders, payments, refunds, S3, AI, email, and invoices.

## Key Files
| File | Description |
|---|---|
| `ProductService.cs` | Product-domain operations. |
| `OrderService.cs` | Order workflow and checkout logic. |
| `AuthService.cs` | Admin JWT authentication. |
| `CustomerAuthService.cs` | Customer authentication. |
| `S3Service.cs` | AWS S3 upload and presigned URLs. |
| `VNPayService.cs` | VNPay payment integration. |

## Subdirectories
| Directory | Purpose |
|---|---|
| `Interface/` | Service contracts (see `Interface/AGENTS.md`). |

## For AI Agents

### Working In This Directory
- Keep controller-facing operations on matching `I*Service` contracts.
- Use DI for `ApplicationDbContext` and external clients.
- Preserve domain validation and payment/signature checks.

### Testing Requirements
- Build `../dotnet_backend.sln`; no automated tests exist.

## Dependencies

### Internal
- `../Database/` — EF Core data access.
- `../Models/` and `../Dtos/` — entities and transport shapes.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
