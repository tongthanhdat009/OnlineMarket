# GreenBasket customer storefront

Standalone React customer app for OnlineMarket. It is separate from `frontend/` (admin) and replaces the removed legacy customer SPA.

## Stack

- React `19.3.0`, TypeScript `7.0.2`, Vite `8.3.1`
- Tailwind CSS `4.3.3` through `@tailwindcss/vite`
- React Router `7.18.4`, TanStack Query `5.104.0`, Lucide React `1.48.0`

## Run

```bash
cd frontend-customer
npm install
npm run dev
```

Local Vite uses `/api` and proxies to `http://localhost:7000`. Set `VITE_API_URL` to an API origin for a deployed build; the client appends `/api` when needed.

```bash
npm run test -- --run
npm run build
npm run preview
```

## Routes

`/`, `/products`, `/products/:id`, `/category/:id`, `/search?q=`, `/cart`, `/checkout`, `/payment-result`, `/login`, `/register`, `/account/profile`, `/account/security`, `/account/orders`, `/account/orders/:id`, `/account/bills`, `/account/refunds`.

The client uses authenticated `/api/customer/cart/*` routes and the backend refund route `/api/customerrefund`. Search keywords are URL encoded by the API client. Customer session restoration calls `/api/customer/auth/me` instead of trusting cached profile data.
