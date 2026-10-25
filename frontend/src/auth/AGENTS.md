<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# auth

## Purpose

Admin session state: token exchange, the React context, and the permission checks.

## Key Files

| File | Description |
|---|---|
| `session.ts` | Network layer — `login()`, `getCurrentUser()`, `logout()`, plus `toTokenPair`, `stripPassword`, `normalizeAuthUser`. |
| `AuthContext.tsx` | `AuthProvider` + `useAuth()`. Holds `user`, `loading`, `isAuthenticated`, `login`, `refreshUser`, `logout`, `can`, `canAny`, `canAll`. |
| `permissions.ts` | `can` / `canAny` / `canAll` plus the `permissions` map of permission-name constants (`dashboard_view`, `order_manage`, `agent_tool_manage`, …). |
| `index.ts` | Barrel re-exporting the three modules. |

## For AI Agents

### Working In This Directory

- Tokens live in `sessionStorage` under `store_admin_access_token` / `store_admin_refresh_token`, with an in-memory fallback when storage is unavailable (`../lib/api-client.ts` → `BrowserTokenStore`).
- `normalizeAuthUser` defensively accepts both PascalCase and camelCase, but the backend only ever sends PascalCase. Do not generalise the camelCase branch.
- `stripPassword` removes `Password` / `password` from any user object before it reaches state. Keep that — the backend also projects an empty password, but the client must not rely on it.
- `AuthProvider` starts `loading` as `true` whenever a token exists, so the route guard never sees "unauthenticated" during the `/api/auth/me` rehydration round-trip. **Do not** initialise `loading` to `false` — child effects fire before the parent's and the guard would bounce the user to `/login` on a hard refresh.
- `permissions.ts` is a **UX filter only**. The backend enforces permissions on the agent and AI endpoints alone; hiding a button is not authorization.
- `can()` treats the wildcard `"*"` as full access.

### Testing Requirements

- `npm run build --prefix frontend`.
- `npm test --prefix frontend -- --run`.
- Manual: hard-refresh an authenticated session and confirm the shell renders (not the login page) once `/api/auth/me` resolves.

### Common Patterns

- `useAuth()` throws if called outside the provider — keep that, it fails loudly.
- Permission checks are always `auth.can('order_manage')`, never a raw string comparison in a component.

## Dependencies

### Internal

- `../lib/api-client.ts` — `apiClient`, `BrowserTokenStore`, `TokenStore`
- `../types/api.ts` — `ApiTokenPair`
- `../router.tsx` — `AuthenticatedShell` consumes `useAuth()`
- `../layouts/AppShell.tsx` — receives `permissions` and `user`

### External

- React 19 (`createContext`, `useMemo`, `useCallback`)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
