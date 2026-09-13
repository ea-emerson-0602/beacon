# Architecture

How Beacon is put together, and why each choice was made. This is the document
to read before changing anything structural — and the one to skim before talking
about the project in an interview.

---

## Two applications, not a monolith

`frontend/` and `backend/` are separate npm projects with separate dependency
trees and environment files. They talk over HTTP and deploy independently.

The cost is that types are not shared automatically across the boundary, so
`frontend/src/lib/types.ts` mirrors the API responses by hand. The benefit is
that either side can be deployed, scaled, or replaced without touching the
other, and the API is usable by anything — a CLI, a mobile client, a status
badge embed.

---

## Request flow

```
                         ┌──────────────────────────────┐
   Public visitor ──────▶│  Next.js server component    │
                         │  /s/[slug]                   │
                         └──────────────┬───────────────┘
                                        │  fetch (no cache)
                                        ▼
                         ┌──────────────────────────────┐
                         │  GET /public/:slug           │  ← no auth
                         └──────────────┬───────────────┘
                                        │
   Operator ────▶ Next.js client ──────▶│  Nest AuthGuard (global)
                  /dashboard            │  cookie → JWT → user
                                        ▼
                         ┌──────────────────────────────┐
                         │  Services / Incidents /      │
                         │  Webhooks controllers        │
                         └──────────────┬───────────────┘
                                        ▼
                              Prisma ──▶ Postgres
                                        │
                            incident write also inserts
                                        ▼
                            WebhookDelivery (outbox row)
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
              BullMQ worker (if Redis)        Interval outbox drain
                        └───────────────┬───────────────┘
                                        ▼
                            POST to customer endpoint
                            X-Beacon-Signature: sha256=…
```

The public page is a **server component** that fetches with `cache: "no-store"`.
Nobody wants a cached status page during an outage. The console is a **client
component** because it is interactive and behind auth, so there is no SEO or
first-paint benefit to rendering it on the server.

---

## Data model

```
User ──┬── Membership ──┬── Organization ──┬── Service ──┐
       │                │                  │             │
       │                │                  ├── Incident ─┘ (optional serviceId)
       │                │                  │      │
       └── IncidentUpdate ◀────────────────┼──────┘
                                           │
                                           └── WebhookEndpoint ── WebhookDelivery
```

Notes on specific decisions:

- **`Membership` is a join table with a role**, not a `userId` column on
  `Organization`. Multi-user teams are the normal case for a status page, so the
  schema allows it from the start even though the UI currently shows one
  organisation per user.
- **`Incident.serviceId` is nullable.** Some incidents affect everything, or the
  affected component is not known when the incident opens.
- **`IncidentUpdate.status` is stored per update.** The incident's current status
  is denormalised onto `Incident.status` for cheap list queries, but the timeline
  keeps the full history, so you can always reconstruct how an incident
  progressed.
- **`authorId` is `SetNull` on delete.** Losing an employee should not delete the
  incident history customers can see.
- **`WebhookDelivery` stores the payload as JSON.** A delivery must be replayable
  exactly as it was generated, even if the incident has changed since.

The migration in `backend/prisma/migrations/` is committed, so production
deploys run `prisma migrate deploy` rather than generating SQL on the fly.

---

## Authentication and authorisation

Registration creates three rows in one transaction: a `User`, an `Organization`,
and an `OWNER` `Membership` linking them. The slug is derived from the
organisation name, with a short random suffix if it is taken.

Sessions use a **JWT in an httpOnly cookie**:

- `httpOnly` means client-side JavaScript cannot read it, which removes the most
  common token-theft path in an XSS incident.
- `sameSite` is `"lax"` on local HTTP, and `"none"` when `COOKIE_SECURE=true`,
  so a Vercel frontend can keep a session against a Render API.
- `secure` is driven by `COOKIE_SECURE`, so local HTTP works while production
  requires HTTPS.
- The guard also accepts `Authorization: Bearer <token>`, which keeps the API
  testable with `curl` without a cookie jar.

`AuthGuard` is registered globally via `APP_GUARD`, so **routes are private by
default**. Public routes opt out explicitly with the `@Public()` decorator. This
is the safer direction: forgetting a decorator locks a route down rather than
exposing it.

Authorisation is organisation scoping. Every service call resolves the caller's
organisation through `OrgsService.forUser`, and every query filters on
`organizationId`. Updates use a "find scoped, then update" pattern:

```ts
const existing = await this.prisma.service.findFirst({
  where: { id, organizationId },
})
if (!existing) throw new NotFoundException("Service not found")
```

A record belonging to another organisation returns 404, not 403 — that leaks no
information about whether the ID exists.

Passwords are hashed with **bcryptjs** at cost 10. The pure-JavaScript build was
chosen over native `bcrypt` deliberately: `bcrypt` needs node-gyp and prebuilt
binaries, which is a frequent install failure on Windows and in slim CI images.

---

## Webhook delivery

This is the most interesting part of the system, and the part most portfolio
projects skip.

**The problem.** When an incident changes, subscribers must be notified. A naive
implementation calls `fetch` inside the request handler. That couples your API's
latency to a stranger's server, and if the process restarts mid-call the event
is lost with no record it ever existed.

**The approach — a transactional outbox.**

1. The incident write happens in Postgres.
2. For each matching subscribed endpoint, a `WebhookDelivery` row is inserted
   with status `PENDING`. The event now durably exists.
3. If Redis is configured, a BullMQ job is enqueued referencing that row's ID.
4. A worker claims the row, POSTs it, and records `SUCCESS` or `FAILED`.

**Claiming is atomic.** The worker does not read-then-write; it issues a
conditional update:

```ts
const claimed = await this.prisma.webhookDelivery.updateMany({
  where: { id: deliveryId, status: { in: ["PENDING", "FAILED"] } },
  data: { status: "PROCESSING", attempts: { increment: 1 } },
})
if (claimed.count === 0) return
```

Only one worker can move a row out of `PENDING`, so a delivery is not sent twice
when the queue and the timer race.

**The timer is a safety net.** An `@Interval` drains the outbox every four
seconds. When Redis is present it only picks up rows older than 15 seconds —
deliveries the queue should have handled but did not, because Redis was
restarted or a job was dropped. With no Redis it processes everything, which is
why the feature degrades rather than breaks.

**Signing.** The body is serialised once, then signed:

```
X-Beacon-Event: incident.updated
X-Beacon-Signature: sha256=<hmac-sha256(secret, rawBody)>
```

Receivers recompute the digest over the **raw** body and compare in constant
time. Signing the serialised string rather than the object matters: re-serialising
JSON can reorder keys and invalidate the signature.

**Known limitation.** The outbox insert is not in the same transaction as the
incident write. If the process died between the two, the incident would exist
without its deliveries. Wrapping both in `prisma.$transaction` is the correct
fix and is listed in the roadmap.

---

## Uptime calculation

Uptime is **derived from incident records**, never stored as a number. A stored
percentage drifts from reality and cannot be recomputed when an incident is
corrected.

`PublicService` builds two things per service over a 90-day window:

- **A daily strip.** One bucket per day, each holding the worst thing that
  happened that day. Severity maps to a day status: `MINOR` → degraded,
  `MAJOR` → partial outage, `CRITICAL` → major outage.
- **A percentage.** Downtime is the summed duration of overlapping incidents,
  counting only `MAJOR` and `CRITICAL`. Minor incidents appear in the strip but
  do not inflate the outage figure — claiming a full outage for slightly slow
  exports would be dishonest in the other direction.

Both are computed in a single query's worth of data, then bucketed in memory.
At larger scale this becomes a daily rollup table; at portfolio scale, computing
it on read keeps it honest and simple.

---

## Frontend structure

- `lib/api.ts` — one `fetch` wrapper. Always sends credentials, unwraps Nest's
  validation error shape (`message` can be a string or an array), and turns a
  network failure into a readable "is the backend running?" message instead of a
  raw `TypeError`.
- `lib/status.ts` — the single source of truth mapping enums to labels and
  tones. No component invents its own colour logic, so status colours stay
  consistent between the public page and the console.
- `components/ui/` — small primitives (`Button`, `Card`, `Field`, `Badge`,
  `StatusDot`) so page files describe layout rather than repeating class strings.
- `components/dashboard/` — one panel per console tab. Each owns its own forms,
  submit state, and error message, and calls a shared `onRefresh` after a
  successful write.

The console refetches everything after each mutation rather than patching local
state. It is a deliberate trade: slightly more network traffic in exchange for
the UI never disagreeing with the database. Optimistic updates would be the next
refinement.

**Colour semantics.** The brand colour is violet, not green. Green, amber, and
red are reserved for status meaning, so a brand accent can never be misread as
"everything is fine".
