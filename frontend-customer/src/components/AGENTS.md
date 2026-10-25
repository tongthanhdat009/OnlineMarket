<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-10-22 | Updated: 2026-10-22 -->

# components

## Purpose

Storefront UI. Tailwind utility classes inline, storefront design tokens from `../styles.css`.

## Key Files

| File | Description |
|---|---|
| `store-ui.tsx` | 495 lines, ~17 exports: `Button`, `Money`, `ProductImage`, `QuantityControl`, `ProductCard`, `ProductSkeleton`, `ProductGrid`, `SearchBar`, `CategoryPills`, `SectionHeading`, `EmptyState`, `ErrorState`, `CartLineRow`, `Toast`, `AiButton`, `LinkArrow`. |
| `StoreFooter.tsx` | 95 lines — the site footer. |
| `StoreFront.test.tsx` | 96 lines — renders storefront components in jsdom. |
| `ai/AiAssistant.tsx` | The AI shopping assistant (see `ai/AGENTS.md`). |

## Subdirectories

| Directory | Purpose |
|---|---|
| `ai/` | The customer AI shopping assistant (see `ai/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Reuse a primitive before writing a new one — `ProductCard`, `ProductGrid`, `QuantityControl` and `CartLineRow` already cover the catalog and cart patterns.
- `Money` is the VND formatter. Use it instead of `toLocaleString`.
- `ProductImage` handles the missing/placeholder image case. Do not hand-roll an `<img>` in a page.
- `EmptyState`, `ErrorState` and `ProductSkeleton` are the three states a data-driven block must render.
- `AiButton` opens the AI assistant — the assistant is mounted once, in the layout, and this button only toggles it.
- Styling is inline Tailwind with the storefront tokens. There is no CSS module and no component library.

### Testing Requirements

- `npm run build --prefix frontend-customer`.
- `npm test --prefix frontend-customer -- --run` — `StoreFront.test.tsx` needs the jsdom pragma on line 1.

### Common Patterns

- Props are declared inline in the parameter type.
- Components are stateless where possible; state lives in the page or in a provider.
- Vietnamese copy, matching the rest of the storefront.

## Dependencies

### Internal

- `../styles.css` — design tokens
- `../types/` — entity types used by the cards
- `./ai/AiAssistant.tsx` — the AI assistant

### External

- lucide-react 1.48.0 — icons

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
