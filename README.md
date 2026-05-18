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

## Features

- **Login** — `POST /api/auth/login`; only users with `role === 'admin'` can access.
- **Dashboard** — Stats: total users, active alerts, pending KYC, blocked users (from `/api/admin/statistics`).
- **Users** — List, search, filter by KYC status and blocked; block/unblock; link to user detail.
- **User detail** — Profile, KYC status update, block/unblock/delete, view KYC documents.
- **KYC Pending** — List pending verifications; approve/reject per document (`/api/kyc/admin/verify/:documentId`).
- **Settings** — Edit system settings (e.g. `ALERT_RADIUS_KM`, `LOCATION_UPDATE_FREQUENCY_MINUTES`) via `/api/admin/settings`.