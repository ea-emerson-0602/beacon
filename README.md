# Beacon

**Status pages and incident communication, with a real backend behind it.**

Beacon is a full-stack application: a public status page customers can read during
an outage, an operator console for posting incident updates, and signed outbound
webhooks so integrators can react to events.

It is deliberately not a CRUD demo. The parts worth reviewing are the incident
state machine, organisation-scoped authorisation, and reliable webhook delivery
through a Postgres outbox with a retrying worker.

---

## Contents

| File | What it covers |
| --- | --- |
| [`SETUP.md`](./SETUP.md) | **Start here.** Step-by-step instructions to get it running, plus troubleshooting. |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Data model, request flow, webhook delivery design, and the reasoning behind each choice. |
| [`docs/API.md`](./docs/API.md) | Every endpoint with example requests and responses. |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | What is built, what to build next, and interview talking points. |
| [`docs/TESTING.md`](./docs/TESTING.md) | How to run the backend test suite, and what it locks. |

---

## Repository layout

Two independent applications, each with its own `package.json`, dependencies,
and environment file. They communicate over HTTP and deploy separately.

```
beacon/
├── backend/            NestJS API + Prisma + webhook worker
│   ├── prisma/
│   │   ├── schema.prisma        Data model
│   │   ├── migrations/          Committed SQL migration
│   │   └── seed.ts              Demo org with 90 days of incident history
│   └── src/
│       ├── auth/                Register, login, cookie sessions, route guard
│       ├── services/            Services CRUD, status changes
│       ├── incidents/           Incidents and the update timeline
│       ├── webhooks/            Endpoints, signing, outbox, BullMQ worker
│       ├── public/              Unauthenticated status page endpoint
│       ├── orgs/                Organisation scoping helper
│       └── prisma/              Prisma client as a Nest provider
│
├── frontend/           Next.js 15 App Router + Tailwind v4
│   └── src/
│       ├── app/
│       │   ├── page.tsx             Marketing landing page
│       │   ├── login/, register/    Auth screens
│       │   ├── dashboard/           Operator console
│       │   └── s/[slug]/            Public status page
│       ├── components/              UI primitives and dashboard panels
│       └── lib/                     API client, formatting, status helpers
│
├── docker-compose.yml  Optional Postgres + Redis for local development
└── SETUP.md
```

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Web | Next.js 15, Tailwind v4 | Server components render the public page; the console is a client app |
| API | NestJS 11 | Modules, guards, and validation pipes give the API real structure |
| Data | Postgres + Prisma | Relational model, committed migrations, typed queries |
| Jobs | Postgres outbox + BullMQ | Deliveries survive a Redis outage; Redis only accelerates them |
| Auth | httpOnly cookie + JWT | No tokens exposed to client-side JavaScript |

---

## Features

- **Public status page** at `/s/{slug}` with overall state, per-service status,
  a 90-day uptime strip, and the incident history.
- **Uptime calculated from real incident data**, not a stored number. Degraded
  performance shows in the strip without inflating the outage percentage.
- **Incident timeline** moving through Investigating → Identified → Monitoring →
  Resolved, with `resolvedAt` set by the API rather than the client.
- **Operator console** with overview, services, incidents, and webhook panels.
- **Signed webhooks** carrying an `X-Beacon-Signature` HMAC-SHA256 header.
- **Delivery outbox** so events are recorded before any HTTP call is attempted,
  then retried with exponential backoff.

---

## Quick start

Full detail and troubleshooting live in [`SETUP.md`](./SETUP.md). The short version,
assuming Node 20+ and a Postgres database:

```bash
# 1. Backend
cd backend
cp .env.example .env          # then set DATABASE_URL
npm install
npm run setup                 # generate client, run migration, seed demo data
npm run dev                   # http://localhost:4000

# 2. Frontend, in a second terminal
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Then open:

- Landing page — <http://localhost:3000>
- Demo status page — <http://localhost:3000/s/acme>
- Operator console — <http://localhost:3000/dashboard>
- API health check — <http://localhost:4000/health>

Run the demo console at <http://localhost:3000/demo> (seeded as **demo@beacon.dev** / **beacon1234**). Sign in at `/login` is for your own account.

Backend tests (no database required):

```bash
cd backend
npm test
```

See [`docs/TESTING.md`](./docs/TESTING.md) for what they cover and how to add one.
