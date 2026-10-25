<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# layouts

## Purpose

The admin shell.

## Key Files

| File | Description |
|---|---|
| `AppShell.tsx` | 152 lines. Exports `AppShell`, `navGroups` and the `AppShellProps` / `PermissionValue` types. Renders the fixed 240–260px sidebar, the topbar with the user menu, and the page container. Also mounts `../components/ai/AdminAssistantWidget.tsx`. |

## For AI Agents

### Working In This Directory

- `AppShell` is rendered by `AuthenticatedShell` in `../router.tsx`, which passes `permissions`, `user` and `onSignOut`. It is not used anywhere else.
- `permissions` is `string[] | Set<string>`. `canSee(item, permissions)` decides whether a nav entry is rendered. An empty or missing list must not throw.
- `navGroups` is exported — the quick-navigation strip at the bottom of the sidebar derives from it. Add a nav item to the group array, not inline in the JSX.
- The role label is computed in `../router.tsx` (`Role === 1 ? 'Quản trị viện' : …`), not here. Keep role → label mapping in one place.
- The store name is hardcoded as `GREEN BASKET` in `../router.tsx` and passed as `storeName`.

### Testing Requirements

- `npm run build --prefix frontend`.
- `npm test --prefix frontend -- --run`.
- No test covers the shell. Verify manually: sign in as an admin with limited permissions and confirm the nav hides the entries it should.

### Common Patterns

- Icons come from `lucide-react` and are held on the nav item objects in `navGroups`, not imported in the render body.
- The sidebar is fixed-width and the main area scrolls; do not make the sidebar collapse without a design decision.

## Dependencies

### Internal

- `../router.tsx` — mounts the shell, supplies `permissions` and `user`
- `../auth/permissions.ts` — the permission names used by `canSee`
- `../components/primitives.tsx` — buttons, icons, badges
- `../components/ai/AdminAssistantWidget.tsx` — the floating assistant

### External

- lucide-react 0.548.0 — nav icons
- react-router-dom 7.18.4 — `NavLink`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
