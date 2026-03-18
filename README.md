# E-Bike Admin Dashboard

Next.js (App Router) admin dashboard for the e-bike platform backend.

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- TanStack Query for server state
- Axios API client
- Recharts for dashboard charts

## Setup

1. Create environment file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment

- `BACKEND_API_BASE_URL`: Hosted backend base URL.
	- Default: `https://ebike-api.onrender.com`

## Implemented MVP Routes

- `/login`
- `/dashboard`
- `/riders`
- `/users`
- `/rides`
- `/charging-stations`

## API Integration Notes

- Client calls go to same-origin Next route handlers under `/api/admin/*`.
- Proxy route forwards to backend `/v1/admin/*`.
- Admin JWT is stored in browser localStorage (`ebike_admin_token`) for phase 1.
- Protected pages use a client auth guard and redirect to `/login` on missing/expired token.

## Known Backend Contract Gaps

- Rider stats endpoint is shown in docs but not currently active in backend route registration.
- UI includes a placeholder panel for rider stats until backend route is added.
