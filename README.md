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
	- Default: `https://46-101-193-155.sslip.io` (the droplet). In production the compose
	  stack overrides this with the internal `http://api:8080`.
	- **The default only applies when the variable is unset.** A value configured on a
	  hosting platform wins over the fallback in `src/lib/config.ts`, and fixing the code
	  does not fix the deployment. A Vercel project env var still holding the retired
	  Render URL is what took every admin call down with a `503` on 2026-08-21, long after
	  the code default had been corrected.

## Deployment

The droplet at `https://46-101-193-155.sslip.io` is the **only** host. It serves this dashboard
on `/` and the API on `/v1/` behind one nginx, so the proxy talks to the API over the
compose-internal `http://api:8080` and never leaves the box. Pushing to `main` deploys it via
`.github/workflows/deploy.yml`. Don't add a second frontend host — the last one drifted onto a
dead backend and nothing surfaced which host was at fault.

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
