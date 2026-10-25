<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# ai

## Purpose

The customer AI shopping assistant.

## Key Files

| File | Description |
|---|---|
| `AiAssistant.tsx` | 212 lines. Exports `AiAssistant`. Streams the assistant's answer from `api/customer/ai` and renders it in the storefront chrome. |

## For AI Agents

### Working In This Directory

- The assistant is mounted once in the storefront layout; `../store-ui.tsx` → `AiButton` toggles it.
- The response is an **SSE stream**, parsed with `parseSseStream` from `../../lib/sse.ts`. It is a long-lived connection — consumers need an explicit abort, and the component must close it when the panel closes.
- The assistant is a **customer** feature and uses the customer auth token. It must not call the admin endpoints (`api/admin/ai`).
- Types for the assistant payloads live in `../../types/ai.ts`.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run`.
- No test covers this component. Verify manually in a dev session: open the assistant, send a question, confirm the stream renders and the connection closes on close.

### Common Patterns

- Consume the stream with `for await (const event of stream)` and break out on unmount.
- Errors from the stream surface through `normalizeError` (`../../lib/errors.ts`), not through a raw `catch`.

## Dependencies

### Internal

- `../../api/client.ts` — `client.ai.stream`
- `../../lib/sse.ts` — the SSE frame parser
- `../../lib/errors.ts` — error normalisation
- `../../types/ai.ts` — payload types
- `../store-ui.tsx` — `Button`, `AiButton`

### External

- React 19.3.0, lucide-react 1.48.0

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
