<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-28 | Updated: 2026-07-28 -->

# Controllers

## Purpose
Attribute-routed HTTP endpoints for admin and customer API domains.

## Key Files
| File | Description |
|---|---|
| `AuthController.cs` | Admin authentication endpoints. |
| `ProductController.cs` | Product CRUD and image-related endpoints. |
| `CustomerAuthController.cs` | Customer authentication endpoints. |
| `CustomerOrderController.cs` | Customer order endpoints. |

## For AI Agents

### Working In This Directory
- Inject service interfaces; keep business logic in `Services/`.
- Use async actions and return HTTP results consistent with neighboring endpoints.
- Preserve `[Authorize]` and `[AllowAnonymous]` attributes; auth changes need explicit review.

### Testing Requirements
- Build `../dotnet_backend.sln`; manually exercise changed requests from `../dotnet-backend.http` where applicable.

## Dependencies

### Internal
- `../Services/` — business-service contracts and implementations.
- `../Dtos/` — request and response types.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
