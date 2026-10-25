<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# layouts

## Purpose

Storefront shells.

## Key Files

| File | Description |
|---|---|
| `StoreLayout.tsx` | 181 lines. Exports `StoreLayout` — the header, the category nav, the outlet, the AI assistant mount and the footer — plus `AuthLayout`. |
| `AccountLayout.tsx` | 48 lines. Exports `AccountLayout` — the `/account` side nav (profile, security, orders, bills, refunds) around the outlet. |

## For AI Agents

### Working In This Directory

- `StoreLayout` wraps every public page; `AuthLayout` wraps the login and register pages, which sit **outside** `StoreLayout` in `../app/router.tsx`.
- `AccountLayout` renders inside the `ProtectedRoute` branch — it may assume a signed-in customer.
- The AI assistant is mounted in `StoreLayout`, not in a page. Do not mount it a second time.
- The header reads the cart count from `useCart()` and the session from `useAuth()` — both come from `../app/providers.tsx`.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run`.
- No layout test. Verify manually: browse anonymously, sign in, open `/account`.

### Common Patterns

- The layouts use `useOutlet`/`Outlet` for the page slot — the route tree defines the child, the layout provides the chrome.
- Vietnamese copy and the storefront tokens from `../styles.css`.

## Dependencies

### Internal

- `../app/router.tsx` — where the layouts are placed in the route tree
- `../app/providers.tsx` — `useAuth`, `useCart`, `useToast`
- `../components/store-ui.tsx` — buttons and search
- `../components/StoreFooter.tsx` — the footer
- `../components/ai/AiAssistant.tsx` — the AI assistant mount

### External

- react-router-dom 7.18.4 — `Outlet`, `NavLink`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
