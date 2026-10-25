<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# ai

## Purpose

The admin AI assistant widget — a floating panel that streams chat responses and renders embedded chart payloads.

## Key Files

| File | Description |
|---|---|
| `AdminAssistantWidget.tsx` | 169 lines. Exports `AdminAssistantWidget({ open, onClose })`. Internals: `parseAiChart(text)` pulls a chart payload out of the assistant's answer, `widgetChartStats(chart)` summarises it, `widgetFullMoney(v)` formats VND, `WidgetChart` renders it with Recharts, and `renderWidgetInline` / `renderWidgetText` handle the markdown-ish body. |

## For AI Agents

### Working In This Directory

- The widget is mounted from `../layouts/AppShell.tsx` and controlled by an `open` / `onClose` pair — it renders nothing when closed.
- Chart data arrives **inside the assistant's text**, not as a separate endpoint. `parseAiChart` extracts it. If the backend changes the marker format, the parser and the backend serializer must change together.
- Markdown rendering is hand-rolled in `renderWidgetInline` / `renderWidgetText` — there is no markdown library in this app's dependencies. Do not add one without asking.
- Money is formatted by `widgetFullMoney` (VND, no decimals). Reuse it rather than `toLocaleString`.

### Testing Requirements

- `npm run build --prefix frontend`.
- `npm test --prefix frontend -- --run`.
- No test covers this component. Verify by opening the panel in a dev session and asking a question that returns a chart.

### Common Patterns

- Local helpers are module-level functions, not exported — the component is the only public surface.
- The widget talks to the API through `../../api/admin-ai.api.ts`; it must not call `apiClient` directly.

## Dependencies

### Internal

- `../../api/admin-ai.api.ts` — the chat endpoint
- `../../api/agents.api.ts` — SSE activity stream (same folder's sibling domain)
- `../../layouts/AppShell.tsx` — mounts the widget
- `../../components/primitives.tsx` — buttons and layout primitives

### External

- recharts 3.10.1 — chart rendering
- lucide-react 0.548.0 — icons

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
