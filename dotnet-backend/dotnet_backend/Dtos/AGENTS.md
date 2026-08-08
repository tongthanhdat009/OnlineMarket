<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Dtos

## Purpose
Request and response shapes for authentication, catalog, carts, orders, payments, refunds, analytics, and VNPay.

## Key Files
| File | Description |
|---|---|
| `ProductDto.cs` | Product API representation. |
| `CheckoutDto.cs` | Checkout request shape. |
| `LoginRequestDto.cs` | Login credentials request. |
| `VNPayRequestDto.cs` | VNPay payment request. |

## For AI Agents

### Working In This Directory
- Keep DTOs independent from EF entity classes.
- Preserve PascalCase properties because API JSON configuration preserves CLR casing.

### Testing Requirements
- Build `../dotnet_backend.sln` after contract changes.

## Dependencies

### Internal
- Used by `../Controllers/` and `../Services/`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
