# Setup guide

Everything you need to get Beacon running locally. Written for Windows
PowerShell, with macOS/Linux equivalents where the commands differ.

---

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js 20 or newer** | Check with `node -v`. Download from <https://nodejs.org>. |
| **A Postgres database** | Three options below — pick one. |
| **Redis** | Optional. Webhook delivery works without it. |

---

## 2. Get a Postgres database

Pick **one** of these. Option A needs no installation and is the fastest if your
network is slow.

### Option A — Hosted Postgres (recommended, no install)

1. Create a free database at <https://neon.com> (or Supabase, or Railway).
2. Copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Use that as your `DATABASE_URL` in step 3.

### Option B — Docker Desktop

If you have Docker installed, from the project root:

```powershell
docker compose up -d
```

This starts Postgres on port `5432` and Redis on port `6379` with the
credentials already in `backend/.env.example`. Check them with:

```powershell
docker compose ps
```

### Option C — Postgres installed locally

Install from <https://www.postgresql.org/download/windows/>, then create the
database:

```powershell
psql -U postgres -c "CREATE USER beacon WITH PASSWORD 'beacon';"
psql -U postgres -c "CREATE DATABASE beacon OWNER beacon;"
```

---

## 3. Configure and start the backend

```powershell
cd backend
Copy-Item .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Open `backend/.env` and set `DATABASE_URL` to the database from step 2. A
`.env` with local Docker defaults is already included, so if you chose Option B
or C you can leave it as is.

Also replace `JWT_SECRET` with a long random string. Generate one with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Install dependencies and prepare the database:

```powershell
npm install
npm run setup
```

`npm run setup` does three things: generates the Prisma client, applies the
migration, and seeds the demo organisation with 90 days of incident history.

Start the API:

```powershell
npm run dev
```

You should see `Beacon API listening on http://localhost:4000`. Verify it:

```powershell
curl http://localhost:4000/health
# {"ok":true,"service":"beacon-api"}
```

---

## 4. Start the frontend

Open a **second terminal** — leave the API running in the first.

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

---

## 5. Check that it works

| URL | What you should see |
| --- | --- |
| <http://localhost:3000> | Landing page |
| <http://localhost:3000/s/acme> | Demo status page with uptime strips and one active incident |
| <http://localhost:3000/login> | Sign in with your own account |
| <http://localhost:3000/demo> | Opens the seeded Acme operator console |
| <http://localhost:3000/dashboard> | Operator console |

Seeded account: **demo@beacon.dev** / **beacon1234** (used only by **Run demo**)

Try this end-to-end walkthrough:

1. Sign in and open the **Services** tab.
2. Change "Public API" to **Major outage**.
3. Open <http://localhost:3000/s/acme> — the banner is now red.
4. Go to **Incidents**, open a new incident, then post an update and set it to
   **Resolved**. `resolvedAt` is stamped by the API.
5. Go to **Webhooks**, paste a URL from <https://webhook.site>, then open
   another incident. Watch the delivery appear with its signature header.

---

## 6. Everyday commands

Run these from `backend/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API with hot reload |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run setup` | Generate client, migrate, and seed in one step |
| `npm run seed` | Re-seed demo data |
| `npm test` | Run the backend unit suite (no database) |
| `npm run test:watch` | Re-run tests as files change |
| `npm run prisma:studio` | Browse the database in a GUI |
| `npm run prisma:migrate:dev` | Create a new migration after editing `schema.prisma` |
| `npm run prisma:reset` | **Destructive.** Drop everything, re-migrate, re-seed |

How the suite is organised, and what a third party needs to run it: [`docs/TESTING.md`](./docs/TESTING.md).

Run these from `frontend/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start Next.js on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

---

## 7. Optional: enable the Redis queue

Webhook delivery works without Redis — the API drains a Postgres outbox on a
timer. Adding Redis moves delivery onto a BullMQ queue with exponential backoff
and concurrency.

Set this in `backend/.env` and restart the API:

```
REDIS_URL="redis://localhost:6379"
```

On startup you will see `BullMQ webhook worker connected`. If Redis is
unreachable, the API logs a warning and keeps using the outbox, so nothing
breaks.

---

## 8. Troubleshooting

### `npm install` is extremely slow or fails with `ECONNRESET`

This is a network problem, not a code problem. Options that help:

```powershell
npm config set fetch-retries 5
npm config set fetch-retry-maxtimeout 120000
npm install --no-audit --no-fund
```

Install `backend` and `frontend` **one at a time** rather than together, and
re-run `npm install` if it fails — npm resumes from its cache.

### `EPERM: operation not permitted, rmdir ...` on Windows

Something is holding a file open. Close any running dev server, stop stray Node
processes, then retry:

```powershell
Get-Process node | Stop-Process -Force
Remove-Item -Recurse -Force node_modules
npm install
```

Real-time antivirus scanning of `node_modules` is a common cause. Excluding the
project folder speeds installs up considerably.

### `Can't reach database server` / `P1001`

The `DATABASE_URL` is wrong or the database is not running. If you used Docker,
check `docker compose ps`. If you used a hosted database, confirm the string
ends with `?sslmode=require`.

### `@prisma/client did not initialize yet`

The generated client is missing. Run:

```powershell
cd backend
npm run prisma:generate
```

### Prisma asks for a migration name

You ran `prisma migrate dev` instead of `prisma migrate deploy`. The migration
is already committed in `backend/prisma/migrations`, so use:

```powershell
npm run prisma:migrate
```

### The dashboard says "Cannot reach the API"

The backend is not running, or `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
does not match the API port. Note that changes to `.env.local` require
restarting `npm run dev`.

### Login succeeds but the console redirects back to login

The session cookie is being dropped. Make sure you open the site at
`http://localhost:3000` (not `127.0.0.1`, which is a different origin), that
`WEB_ORIGIN` in `backend/.env` is `http://localhost:3000`, and that
`COOKIE_SECURE` is `false` for local HTTP.

### Port already in use

```powershell
# Find what is on port 4000
netstat -ano | Select-String ":4000"
Stop-Process -Id <PID> -Force
```

Or change `PORT` in `backend/.env` and `NEXT_PUBLIC_API_URL` in
`frontend/.env.local` to match.

---

## 9. Deploying to production

Beacon is three pieces. Deploy them in this order so CORS and cookies line up.

1. **Aiven** — Postgres
2. **Render** — API (`backend/`)
3. **Vercel** — web app (`frontend/`)
4. Point the API `WEB_ORIGIN` at the Vercel URL and redeploy the API

There is a Render Blueprint at [`render.yaml`](./render.yaml).

When `COOKIE_SECURE=true`, the session cookie is `SameSite=None; Secure` so
sign-in works across a Vercel frontend and a Render API without a shared
domain. A parent domain (`app.example.com` + `api.example.com`) is nicer
later, but it is not required. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

### 9.1 Aiven Postgres

1. Create a PostgreSQL service at <https://console.aiven.io>.
2. Open the service **Overview** and copy **Service URI**. It already includes
   `sslmode=require`. Use it as-is — do not rebuild it by hand (passwords often
   contain characters that must stay URL-encoded).
3. Under **Allowed IP addresses**, allow connections from Render. Render free
   instances do not have a static IP, so add `0.0.0.0/0` (or Aiven's "public
   internet" option) or the API will fail with `P1001` / timeout.
4. Connection pooling is optional and only available on Startup plans and
   above. Skip it unless you created a pool.

You need **both** Prisma URLs:

| Variable | What to paste |
| --- | --- |
| `DIRECT_URL` | Overview **Service URI** (always) |
| `DATABASE_URL` | The same Service URI, **or** the pool URI with `&pgbouncer=true` if you created a connection pool |

Do not put `pgbouncer=true` on `DIRECT_URL`. Migrations need a direct session.

### 9.2 Render (API)

Push `main` to GitHub first. Then either:

- Open <https://dashboard.render.com/blueprint/new?repo=https://github.com/ea-emerson-0602/beacon>, or
- New → Blueprint → this repo

If you already created a **Web Service** (not a Blueprint), open **Settings**
and set these — otherwise Render looks for `package.json` at the repo root
and fails with `ENOENT`:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev && npm run build` |
| Pre-Deploy Command | `npm run prisma:migrate` |
| Start Command | `npm start` |

Fill the Blueprint secrets:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Aiven URI from 9.1 |
| `DIRECT_URL` | Aiven Service URI (not the pooler) |
| `WEB_ORIGIN` | Your Vercel origin, **no trailing slash**. If Vercel is not live yet, use `https://placeholder.vercel.app` and update it in step 9.4 |
| `JWT_SECRET` | Leave generated |
| `REDIS_URL` | Leave empty unless you have Redis |

Do **not** set `PORT`. Render injects it.

`NODE_ENV=production`, `COOKIE_SECURE=true`, and Node 20 are already in
`render.yaml`. Build installs devDependencies (TypeScript) then compiles;
`preDeployCommand` runs `prisma migrate deploy` against `DIRECT_URL`.

When the deploy is **Live**, open `https://<your-service>.onrender.com/health`.
You should see `{"ok":true,"service":"beacon-api"}`. Free instances spin down
after ~15 minutes idle; the first request after that is a cold start.

### 9.3 Vercel (frontend)

1. Import the same GitHub repo at <https://vercel.com/new>.
2. Set **Root Directory** to `frontend`.
3. Framework: Next.js (auto-detected).
4. Add a Production env var, then deploy:

```
NEXT_PUBLIC_API_URL=https://<your-service>.onrender.com
```

No trailing slash. This value is inlined at **build** time — changing it later
requires a rebuild, not just a restart.

### 9.4 Wire the session cookie

1. Copy the Vercel origin (`https://something.vercel.app`).
2. On the Render service → Environment, set `WEB_ORIGIN` to that exact origin
   (https, no path, no trailing slash).
3. Manual Deploy → **Deploy latest commit** (or save env vars with a restart).
4. Register an account on the Vercel URL and open `/dashboard`.

If login succeeds then bounces back to `/login`, the cookie was dropped:
`COOKIE_SECURE` must be `true`, and `WEB_ORIGIN` must match the browser origin
exactly.

### 9.5 Optional: seed the demo org

Production starts empty (migrations only, no seed). To load the Acme demo
(`demo@beacon.dev` / `beacon1234`) from your machine:

```powershell
cd backend
$env:DATABASE_URL="<Aiven Service URI>"
$env:DIRECT_URL="<Aiven Service URI>"
npm run seed
```

### 9.6 If something fails

| Symptom | Likely cause |
| --- | --- |
| `ENOENT` … `/opt/render/project/src/package.json` | Root Directory is not `backend`. Set it in Render Settings (see 9.2). |
| Build: `prisma: not found` | `prisma` must be in `dependencies`. Re-deploy this repo as-is. |
| Pre-deploy: advisory lock / P1002 | `DIRECT_URL` is the pooler. Use the Overview Service URI. |
| Start: `P1001` / can't reach database | Aiven IP allow list, or `sslmode=require` missing from the URI |
| Health check timeout | First boot waiting on Aiven; confirm the URI and IP list, then redeploy |
| `Cannot reach the API` on Vercel | Wrong `NEXT_PUBLIC_API_URL`, or the Render service is spun down (wait and retry) |
| CORS / login cookie dropped | `WEB_ORIGIN` trailing slash or `http` vs `https` mismatch |
| Demo / login returns to `/login` | Cross-site cookie blocked. Redeploy the frontend so `/beacon-api` proxies the session. Also set Render `WEB_ORIGIN` to the exact Vercel origin. |

