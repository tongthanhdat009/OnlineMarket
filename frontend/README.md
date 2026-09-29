# Store Admin Frontend

React + TypeScript admin console for OnlineMarket. The customer storefront lives in `../frontend-customer`.

## Stack

- React `19.3.0`, Vite `8.3.1`, TypeScript `7.0.2`
- Tailwind CSS `4.3.3` through `@tailwindcss/vite`
- React Router `7.18.4`, TanStack Query `5.104.0`, Recharts, Lucide React

## Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to `http://localhost:7000`, so the API client does not need a separate CORS origin during local development. Set `VITE_API_URL` to an absolute API origin for a deployed environment.

```bash
npm run test -- --run
npm run build
npm run preview
```

## Structure

```text
src/
  api/       PascalCase .NET endpoint adapters and SSE helpers
  auth/      token session, login/me, permission UX guards
  components/ shared tables, drawers, forms, states, badges
  layouts/   responsive AppShell, sidebar, topbar, AI assistant
  lib/       API client, list/pagination normalization
  hooks/     TanStack Query hooks for each domain adapter
  pages/     dashboard, operations, finance, AI, admin route surfaces
  types/     transport/domain types
```

`api/client.ts` injects bearer tokens, refreshes a 401 once, normalizes errors, and accepts array or `{ Items, TotalCount, Page, PageSize }` responses. List adapters always send both `page` and `pageSize`. Staff adapters drop `Password` immediately; the value is never rendered or logged.

The UI includes realistic empty/error/loading primitives and sample operational data so every route can be reviewed without a running backend. When the API is connected, replace page sample queries with the supplied domain adapters; menu permissions remain a UX guard and backend authorization remains authoritative.
