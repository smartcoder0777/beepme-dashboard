# TrackerDashboard

Admin dashboard for **BeepMe (Car Tracker)**, built with React, Vite, and Tailwind CSS. Uses [TrackerBackend](../TrackerBackend/) (`role: 'admin'` required). Mobile app: [TrackerFrontend](../TrackerFrontend/).

## Project documentation

Ops and architecture docs are in **TrackerFrontend**:

| Document | Description |
|----------|-------------|
| [APP_OPERATIONS.md](../TrackerFrontend/APP_OPERATIONS.md) | Deploy, env vars, credentials, maintenance (including first admin user) |
| [APP_FLOWS.md](../TrackerFrontend/APP_FLOWS.md) | Architecture and flow diagrams (Mermaid) |
| [docs/flows/](../TrackerFrontend/docs/flows/) | Exported HTML — `npm run docs:flows` from **TrackerFrontend** |

## Setup

```bash
npm install
```

## Run

1. Start **TrackerBackend** (e.g. `npm run dev` on port 3000).
2. From this folder run:

```bash
npm run dev
```

Dashboard runs at **http://localhost:5174**. API requests are proxied to the backend (see `vite.config.js`).

## Deploy to Railway

1. Create a new Railway service from this repo / folder.
2. Set **build-time** variables (Vite bakes these into the bundle):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://trackerbackend-production-875d.up.railway.app/api` |
| `VITE_ASSET_BASE_URL` (optional) | `https://trackerbackend-production-875d.up.railway.app` |

3. Build / start are already in `railway.toml`:
   - Build: `npm ci && npm run build`
   - Start: `npm start` (serves `dist/` on `$PORT`)
4. On **TrackerBackend**, add the dashboard public URL to `CORS_ORIGIN` (comma-separated), e.g.  
   `https://your-dashboard.up.railway.app`
5. Log in with an account that has `role: 'admin'`.

## Features

- **Login** — `POST /api/auth/login`; only users with `role === 'admin'` can access.
- **Dashboard** — Stats: total users, active alerts, pending KYC, blocked users (from `/api/admin/statistics`).
- **Users** — List, search, filter by KYC status and blocked; block/unblock; link to user detail.
- **User detail** — Profile, KYC status update, block/unblock/delete, view KYC documents.
- **KYC Pending** — List pending verifications; approve/reject per document (`/api/kyc/admin/verify/:documentId`).
- **Settings** — Edit system settings (e.g. `ALERT_RADIUS_KM`, `LOCATION_UPDATE_FREQUENCY_MINUTES`) via `/api/admin/settings`.