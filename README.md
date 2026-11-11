# Billing System

Web application for managing and generating billing and statement-of-account (SOA) workflows across multiple client programs (e.g. OFBank, UNACOM, BTR, DOF, DEPDEV).

## Tech Stack

- **Backend:** Node.js, Express 5 (ESM), Mongoose/MongoDB, JWT authentication, Winston logging
- **Frontend:** Angular 22 (standalone components, SSR-capable), Angular Material, Tailwind CSS, RxJS
- **Database (local dev):** MongoDB 7 via Docker Compose
- **Integrations (feature-dependent):** Cloudinary, Microsoft Graph/SharePoint (Azure), document/PDF tooling (LibreOffice installed in the backend Docker image)

## Repository Structure

- `backend/` — Express API (`index.js` entry point), `routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `utils/`, `config/`, `tests/`, `Dockerfile`
- `frontend/` — Angular app (`src/app/core`, `src/app/features`, `src/app/shared`), environment configs, SSR entry files
- `docs/` — project documentation
  - `audit-findings.md` — codebase audit findings (security, correctness, maintainability)
  - `dev-tooling.md` — optional developer tooling notes
- `docker-compose.yml` — local MongoDB service for development
- `AGENTS.md` — workspace coding guidance

## Prerequisites

- **Node.js and npm** (frontend declares `npm@11.6.2`; backend Docker image uses `node:22-trixie-slim`)
- **MongoDB** — required for backend startup (local install or Docker)
- **Optional, for specific features**
  - Cloudinary credentials (`CLOUDINARY_*`) for upload-related flows
  - Azure/Microsoft Graph/SharePoint credentials (`AZURE_*`, `SHAREPOINT_SITE_ID`) for editor/SharePoint/manpower integrations
  - LibreOffice for PDF/document generation workflows (installed in `backend/Dockerfile`; local non-container runs may need it installed separately)

## Local Development Setup

### 1. Start MongoDB (Docker)

From the repository root:

```bash
docker compose up -d
```

This starts a `mongo:7` container (`billing-mongo`) on `localhost:27017` with a persistent `mongo_data` volume (see `docker-compose.yml`).

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from `.env.example` and configure values:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

#### Required environment variables

The backend exits on startup if these are missing:

- `MONGO_URI` — MongoDB connection string  
  Local Docker example: `mongodb://localhost:27017/billing-system`
- `JWT_SECRET` — strong random secret (minimum 32 characters recommended)

#### Common/local settings

- `PORT=3000` (default)
- `NODE_ENV=development`
- `CORS_ORIGINS` — comma-separated allowed origins  
  If unset, backend defaults include: `http://localhost:4200,https://lbrdc-billing-system.netlify.app,https://billing-system-v3jo.onrender.com`
- `LOG_LEVEL=info`

#### Bootstrap / integrations (as needed)

- `ADMIN_BOOTSTRAP_KEY` — one-time strong key for the initial signup/bootstrap flow (see `backend/.env.example`)
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Azure/Microsoft Graph/SharePoint: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `SHAREPOINT_SITE_ID`
- Optional: `OMNIROUTE_BASE_URL`

#### Run the backend

```bash
npm start        # Runs: node index.js
```

Development/watch mode:

```bash
npm test         # Runs: nodemon index.js (watcher, not a test suite)
```

Unit tests:

```bash
npm run test:unit
```

- API base URL (default): `http://localhost:3000/api`
- Startup flow: validates required env vars, connects to MongoDB, then starts the HTTP server

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

- `npm start` runs `ng serve --no-hmr` (development configuration by default, typically `http://localhost:4200/`)
- Development API target is set in `frontend/src/environments/environment.ts`:
  - `apiUrl: 'http://localhost:3000/api'`
- No frontend dev proxy configuration is detected; the app calls the backend using the configured `apiUrl`

#### Other frontend commands

```bash
npm run build                 # Production build (uses environment.prod.ts replacement)
npm run watch                 # Development build in watch mode
npm test                      # Unit tests (ng test, Vitest/jsdom)
npm run serve:ssr:frontend    # Serve built SSR app: node dist/frontend/server/server.mjs
```

## Environment & Configuration

### Backend (`backend/.env.example`)

| Area | Variables |
| --- | --- |
| Core | `MONGO_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `LOG_LEVEL` |
| CORS | `CORS_ORIGINS` (used in `backend/index.js`) |
| Bootstrap | `ADMIN_BOOTSTRAP_KEY` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Azure / Graph / SharePoint | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `SHAREPOINT_SITE_ID` |
| Optional | `OMNIROUTE_BASE_URL` |

### Frontend environments

- `frontend/src/environments/environment.ts` (development): `production: false`, `apiUrl: 'http://localhost:3000/api'`
- `frontend/src/environments/environment.prod.ts` (production): `production: true`, deployed backend `apiUrl`
- Production builds apply file replacement via `frontend/angular.json`

## Backend Overview

- **Entrypoint:** `backend/index.js`
  - Loads environment variables, enforces required config (`MONGO_URI`, `JWT_SECRET`), connects to MongoDB, and starts Express
  - Middleware includes CORS, JSON/urlencoded parsing (10 MB), cookies, HTTP logging, and `/api` rate limiting
  - Mounts API routes under `/api` with not-found and global error handlers
- **Key folders:** `routes/`, `controllers/`, `models/`, `services/`, `middleware/`, `utils/`, `config/`, `tests/`, `logs/`, `uploads/`
- **Main API domains:** authentication/signup, users, clients, pay frequencies, billing (preview/generate/download/list/CRUD/uploads), Microsoft Graph/editor/SharePoint and manpower-related routes, audit logs, backup export/import
- **Data models (Mongoose):** users, clients, billing, billing rates, employees, logs, pay frequencies
- **Notable capabilities:** JWT auth with role/client-access controls, Zod validation, rate limiting, Cloudinary and Azure/MS Graph integrations, document/PDF-related utilities, Winston-based logging
- **Container image:** `backend/Dockerfile` (Node 22 slim, installs LibreOffice, runs `npm ci --omit=dev`, exposes `3000`, starts with `node index.js`)

## Frontend Overview

- **App structure:** `frontend/src/app/core` (guards, interceptors, models, services), `features` (pages, admin, billing, manpower, rates), `shared`
- **Routing:** lazy-loaded feature areas in `frontend/src/app/app.routes.ts`
  - **Pages:** home, login, signup, dashboard (guarded)
  - **Admin** (auth + role guard): users, clients, audit logs, pay frequencies, backup/restore
  - **Billing:** letter editor, SOA, operations (`/:code` generate/list/view), client-specific billing modules
  - **Manpower & Rates:** client-code based routes (`/:code/...`)
- **Client-specific billing modules:** OFBank, UNACOM, BTR (e.g. janitorial/MISS/supplies), DOF, DEPDEV (e.g. CO/IVA)
- **Auth flow (frontend):** JWT stored in `localStorage` (`app_token`), HTTP interceptor attaches Bearer token and sets `withCredentials`, route guards enforce authentication/roles, expired or unauthorized sessions trigger logout handling

## Existing Documentation

- `docs/audit-findings.md` — audit findings and recommendations (security, correctness, maintainability)
- `docs/dev-tooling.md` — optional developer tooling notes (OmniRoute, engram, agent skills in `.commandcode/skills/`)

## Docker & Deployment Notes

- `docker-compose.yml` provides **MongoDB only** for local development (no backend/frontend application services).
- `backend/Dockerfile` can be used for containerized backend runs and includes LibreOffice for document/PDF workflows.
- Frontend production API URL is configured in `frontend/src/environments/environment.prod.ts`. Ensure backend CORS configuration allows the deployed frontend origin.

## Troubleshooting / Notes

- Backend startup fails immediately if `MONGO_URI` or `JWT_SECRET` is missing.
- In `backend/package.json`, `npm test` runs `nodemon index.js` (development watcher), **not** the unit test suite. Use `npm run test:unit` for backend tests.
- Features depending on Cloudinary, Azure/Microsoft Graph/SharePoint, or document tooling require valid credentials/services and may not function fully without them.
- Ensure the backend is running and reachable at the frontend’s configured `apiUrl`, and that CORS allows your frontend origin.
