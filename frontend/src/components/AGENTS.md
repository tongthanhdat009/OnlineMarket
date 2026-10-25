<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# components

## Purpose

Shared, app-agnostic UI. Everything here is a plain function component with inline Tailwind classes — no CSS modules, no styled-components, no component library.

## Key Files

| File | Description |
|---|---|
| `primitives.tsx` | 298 lines, ~35 exports: `StatusBadge` + `statusTone`, `Money`, `ProductAvatar`, `PageHeader`, `PrimaryButton`, `SecondaryButton`, `IconButton`, `SearchInput`, `FilterSelect`, `DateRangePicker`, `TableToolbar`, `StatCard`, `DataTable` (+ `DataTableColumn`), `EmptyState`, `ErrorState`, `Skeleton`, `Drawer`, `Modal`, `ConfirmDialog`, `FormSection`, `Field`, `OrderTimeline`, `ActivityTimeline`, `AgentRunStatus`, `LoadingButton`, `RefreshButton`, `AddButton`, `MoreButton`, `ExportButton`, `FilterButton`, `SectionCard`, `PercentBar`, `ShortcutHint`, and the `inputClassName` constant. |
| `index.ts` | Barrel — `export * from './primitives'`. |
| `ai/AdminAssistantWidget.tsx` | The floating AI assistant (see `ai/AGENTS.md`). |

## Subdirectories

| Directory | Purpose |
|---|---|
| `ai/` | The floating admin AI assistant widget (see `ai/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Reuse a primitive before writing a new one. `DataTable`, `Drawer`, `Modal`, `ConfirmDialog`, `EmptyState` and `ErrorState` already cover the list/detail/dialog patterns used across the app.
- All styling is Tailwind utility classes inline. There is no `styled` variant and no CSS file per component. The palette comes from the CSS variables in `../styles.css` (`leaf`, `canvas`, …) — use those tokens rather than raw hex.
- Buttons take `size` (`sm` / `md`) and `className` for overrides. `LoadingButton` wraps `PrimaryButton` for the loading state.
- `DataTable` handles loading / empty / error / pagination internally — pass `loading`, `empty`, `error`, `page`, `pageSize`, `total`, `onPageChange`.
- `inputClassName` is the shared input style. Use it on new inputs rather than restating the classes.
- `StatusTone` is `'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple'`; `statusTone(value)` maps a raw status string to a tone.

### Testing Requirements

- `npm run build --prefix frontend` — TypeScript checks the prop types of every consumer.
- `npm test --prefix frontend -- --run`.
- No component test exists in this app. Coverage is `../lib/api-client.test.ts` only.

### Common Patterns

- Props are declared inline in the parameter type: `{ value?: number | null; currency?: string }`.
- Components that render a table row use `rowKey` to give React a stable identity.
- Icons come from `lucide-react` and are passed in as `icon`/`children` props, not imported inside a primitive.

## Dependencies

### Internal

- `../styles.css` — design tokens
- `../types/domain.ts` — entity types used by table columns
- `./ai/AdminAssistantWidget.tsx` — the AI widget (subdirectory)

### External

- react 19.3.0, lucide-react 0.548.0, recharts 3.10.1 (charts are rendered in pages, not here)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
