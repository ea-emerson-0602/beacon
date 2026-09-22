# Roadmap and talking points

## What is already built

- Registration that creates a user, organisation, and owner membership
- httpOnly cookie sessions with a globally applied guard and `@Public()` opt-out
- Services with status changes, scoped to the caller's organisation
- Incidents with an update timeline and server-stamped `resolvedAt`
- Public status page: overall state, per-service 90-day strip, incident history
- Uptime derived from incident data rather than stored
- Webhook endpoints with generated secrets and HMAC-SHA256 signing
- Delivery outbox in Postgres, atomic claiming, retry with backoff
- Optional BullMQ queue that accelerates delivery when Redis is available
- Committed Prisma migration and a seed script with 90 days of history
- Vitest suite for uptime maths, `resolvedAt` stamping, and webhook signatures

---

## Next, in the order worth doing

### 1. Deploy it

Nothing else on this list matters as much. A link a hiring manager can click is
worth more than another feature.

- Frontend on Vercel, root directory `frontend`
- Backend on Render or Fly.io, root directory `backend`
- Postgres on Aiven
- Serve both under one parent domain so the session cookie works cleanly

### 2. Wrap the incident write and outbox insert in one transaction

The known gap in `ARCHITECTURE.md`. Move the `prisma.incident.create` and the
`webhookDelivery.create` calls inside `prisma.$transaction` so an incident can
never exist without its deliveries.

### 3. Tests around the parts with actual logic

Done. See [`TESTING.md`](./TESTING.md). The remaining testing work, if you want
it, is HTTP-level: Supertest against a throwaway Postgres schema for auth and
org scoping.

### 4. Subscriber notifications

Let customers subscribe by email to a status page. This adds a second delivery
channel over the same outbox, which is a natural extension rather than a new
system: a `Subscriber` model, a `notification.sent` delivery type, and Resend or
Postmark for transport.

### 5. Uptime monitoring that opens incidents automatically

A scheduled check pings a customer-supplied URL. Three consecutive failures open
an incident automatically; a recovery posts a `MONITORING` update. This closes
the loop from "we detected it" to "customers were told".

### 6. Team members and roles

The schema already supports it. Add invitations by email and enforce
`OWNER`/`ADMIN`/`MEMBER` with a roles guard, so a `MEMBER` can post updates but
cannot delete webhook endpoints.

### 7. Rate limiting and audit trail

`@nestjs/throttler` on auth routes, and an `AuditLog` table recording who
changed a service status or resolved an incident. Both are things reviewers look
for and most portfolio projects lack.

---

## Interview talking points

**"Why NestJS when you normally reach for Supabase?"**

Supabase is genuinely good, and this project still uses Postgres underneath. But
the logic here is not row access — it is an incident state machine, a delivery
pipeline with retries and signatures, and derived uptime. That belongs in an
application layer I control. Nest gives me modules, guards, and validation
pipes, and it keeps one language across both applications. I would reach for
Supabase again when the requirement really is "authenticated CRUD, fast".

**"Walk me through the hardest part."**

Webhook delivery. The naive version calls `fetch` in the request handler, which
ties my response time to someone else's server and loses the event if the
process restarts. I write a delivery row first, so the event durably exists,
then a worker claims it with a conditional `updateMany` so two workers cannot
send the same delivery twice. Redis makes it faster but is not required — a
timer drains the same table, so losing Redis degrades throughput instead of
breaking the feature.

**"How do you prevent one organisation reading another's data?"**

Every service method resolves the caller's organisation from their session, and
every query filters on `organizationId`. Mutations use find-scoped-then-update,
and a record from another organisation returns 404 rather than 403 so I am not
confirming that the ID exists.

**"Why is uptime computed on read?"**

Because a stored percentage drifts and cannot be corrected. If I fix an
incident's timestamps, the number should change to match. I compute the daily
buckets and the percentage from incident records in the request. At real scale
this becomes a nightly rollup table, and that is a caching decision I would make
when read volume justified it — not before.

**"What would you do differently?"**

Three things. The outbox insert should share a transaction with the incident
write. The console refetches everything after each mutation, which is simple but
chatty — optimistic updates with rollback would be better. And the types are
duplicated across the HTTP boundary by hand; generating a client from an OpenAPI
schema would remove that drift.

---

## Portfolio presentation

- Record a 60–90 second walkthrough: change a service status, open an incident,
  post updates through to resolved, show the webhook delivery arriving. Put it
  at the top of the README.
- Keep the seeded demo data live so the public page is never empty.
- In the README, lead with the architecture decisions, not the feature list.
  Anyone can list CRUD features; explaining why the outbox exists is what
  separates this from a tutorial project.
