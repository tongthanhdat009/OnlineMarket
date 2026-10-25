<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# lib

## Purpose

Shared helpers. Everything here is re-exported by `index.ts`.

## Key Files

| File | Description |
|---|---|
| `index.ts` | Barrel — re-exports `errors`, `format`, `sse`, `storage`, `unwrap`. |
| `errors.ts` | 49 lines. `NormalizedError`, `ApiError`, `normalizeError(error, fallback?)`, `errorMessage(error, fallback?)`. |
| `format.ts` | 32 lines — price, date and number formatting (VND). |
| `sse.ts` | 58 lines. `SseParseOptions` and `parseSseStream<T>(response, options)` — an async generator over an SSE response body. |
| `storage.ts` | 50 lines. `customer_access_token` and `currentUser` in `localStorage`, with a guarded accessor for environments without `window`. |
| `translator.ts` | 521 lines. `TranslatorKey` (a large literal union) and `translator(key, vars?)` — the Vietnamese UI copy catalogue. |
| `unwrap.ts` | 16 lines. `unwrapData<T>` (handles `{ data }` / `{ Data }` wrappers) and `getResponseMessage(payload)`. |
| `foundation.test.ts` | 104 lines — the app's shared helper test, with a `@vitest-environment jsdom` pragma on line 1. |

## For AI Agents

### Working In This Directory

- `unwrapData` and `normalizeError` are the two functions every response goes through. Use them instead of touching `response.json()` directly.
- `unwrapData` only unwraps a `data` / `Data` key — it does not touch the casing of the payload inside. The DTO contract stays PascalCase.
- `storage.ts` reads `localStorage`, but the admin app uses `sessionStorage`. Do not copy that pattern here.
- This app has **no refresh token**: `setStoredToken(token)` takes a single string, and `clearStoredSession()` removes both the token and the cached user.
- `getStorage()` returns `null` when `window` is undefined and swallows storage access errors — every call site must tolerate a null storage.
- `parseSseStream` is an async generator: the caller must break out of the `for await` loop or abort the underlying request, otherwise the connection stays open.
- `translator.ts` holds the Vietnamese copy in one place. Add new strings there rather than inlining Vietnamese text in a component — the `TranslatorKey` union must be extended with the new key.

### Testing Requirements

```bash
npm test --prefix frontend-customer -- --run
```

- The suite opts into jsdom with the file-level `@vitest-environment jsdom` pragma — required because `vite.config.ts` sets no `test` block.
- `npm run build --prefix frontend-customer`.

### Common Patterns

- Every function is a pure export; there is no default export and no class.
- Fallback strings for `normalizeError` and `errorMessage` are Vietnamese and are passed in by the caller.
- `format.ts` returns display-ready strings — no raw `toLocaleString` in pages.

## Dependencies

### Internal

- `../api/client.ts` — consumes `unwrapData`, `normalizeError`, `getStoredToken`
- `../app/providers.tsx` — consumes the storage helpers
- `../components/ai/AiAssistant.tsx` — consumes `parseSseStream`

### External

- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
