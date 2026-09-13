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

## 9. Deploying

The two applications deploy independently.

**Frontend → Vercel**

- Set the project root to `frontend`.
- Add `NEXT_PUBLIC_API_URL` pointing at your deployed API.

**Backend → Render, Railway, or Fly.io**

- Set the project root to `backend`.
- Build command: `npm install && npm run build`
- Start command: `npm run prisma:migrate && npm start`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` (your
  Vercel URL), `COOKIE_SECURE=true`, and optionally `REDIS_URL`.

When `COOKIE_SECURE=true`, the session cookie is `SameSite=None; Secure` so
**Run demo** and sign-in work across a Vercel frontend and a Render API
without a shared domain. Local HTTP still uses `SameSite=Lax`.

A parent domain (`app.example.com` + `api.example.com`) is nicer later, but
it is not required for the public demo. See
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

There is a Render Blueprint at [`render.yaml`](./render.yaml). After Neon and
GitHub are ready, you can create the API from that file in the Render
dashboard.
