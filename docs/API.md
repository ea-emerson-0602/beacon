# API reference

Base URL in development: `http://localhost:4000`

All request and response bodies are JSON. Every route requires an authenticated
session **except** `GET /health`, `GET /public/:slug`, `POST /auth/register`,
`POST /auth/login`, `POST /auth/forgot-password`, and `POST /auth/reset-password`.

Authentication is a `beacon_token` httpOnly cookie set by the login and register
endpoints. For `curl`, either keep a cookie jar (`-c`/`-b`) or send
`Authorization: Bearer <token>`.

Validation is strict: unknown properties are rejected with `400`, and the
`message` field of an error response may be a string **or an array of strings**.

---

## Health

### `GET /health`

```bash
curl http://localhost:4000/health
```

```json
{ "ok": true, "service": "beacon-api" }
```

---

## Auth

### `POST /auth/register`

Creates a user, an organisation, and an `OWNER` membership, then sets the session
cookie.

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email, unique, max 254 |
| `name` | string | 2–80 letters; spaces, apostrophes, hyphens allowed |
| `password` | string | 8–128 chars with upper, lower, number, and symbol |
| `organizationName` | string | 2–80 chars, starts with a letter or number |

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "ada@acme.dev",
    "name": "Ada Okonkwo",
    "password": "Supersecret123!",
    "organizationName": "Acme Cloud"
  }'
```

```json
{
  "id": "clx8f2k9a0000",
  "email": "ada@acme.dev",
  "name": "Ada Okonkwo",
  "organization": {
    "id": "clx8f2k9b0001",
    "name": "Acme Cloud",
    "slug": "acme-cloud",
    "role": "OWNER"
  }
}
```

Returns `409` if the email is already registered.

### `POST /auth/forgot-password`

Always returns `{ "ok": true }`, whether or not the email exists, so the
endpoint does not reveal registered addresses. If a matching account exists,
Beacon stores a hashed one-hour token and emails the reset link.

When no mailer is configured and `NODE_ENV` is not `production`, the response
also includes `devResetUrl` so the local flow can be finished without SMTP.

```bash
curl -X POST http://localhost:4000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@acme.dev" }'
```

### `POST /auth/reset-password`

Consumes the raw token from the reset link and sets a new password. The token
is single-use.

```bash
curl -X POST http://localhost:4000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{ "token": "<64-char hex>", "password": "AnotherGood1!" }'
```

Returns `400` if the token is missing, spent, or expired.

### `POST /auth/change-password`

Authenticated. Requires the current password and a new password that meets the
same strength rules as registration.

```bash
curl -X POST http://localhost:4000/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "currentPassword": "supersecret123", "newPassword": "AnotherGood1!" }'
```

### `POST /auth/login`

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{ "email": "demo@beacon.dev", "password": "beacon1234" }'
```

Same response shape as register. Returns `401` for a bad email or password —
the message is identical either way, so the endpoint does not reveal which
emails exist.

### `GET /auth/me`

```bash
curl http://localhost:4000/auth/me -b cookies.txt
```

Returns the current user and organisation, or `401`.

### `POST /auth/logout`

Clears the cookie.

```json
{ "ok": true }
```

---

## Services

### `GET /services`

Lists the caller's organisation's services, alphabetically.

```bash
curl http://localhost:4000/services -b cookies.txt
```

```json
[
  {
    "id": "seed-service-api",
    "name": "Public API",
    "description": "REST endpoints and webhook ingestion",
    "status": "OPERATIONAL",
    "organizationId": "clx8f2k9b0001"
  }
]
```

### `POST /services`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | Min 2 characters |
| `description` | string | Optional |

```bash
curl -X POST http://localhost:4000/services \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{ "name": "Search", "description": "Full-text search cluster" }'
```

### `PATCH /services/:id`

All fields optional. `status` is the field the console uses.

| Field | Type | Allowed values |
| --- | --- | --- |
| `name` | string | Min 2 characters |
| `description` | string | Any |
| `status` | enum | `OPERATIONAL`, `DEGRADED`, `PARTIAL_OUTAGE`, `MAJOR_OUTAGE`, `MAINTENANCE` |

```bash
curl -X PATCH http://localhost:4000/services/seed-service-api \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{ "status": "MAJOR_OUTAGE" }'
```

Returns `404` if the service belongs to another organisation.

---

## Incidents

### `GET /incidents`

Newest first, each with its service and full update timeline.

```bash
curl http://localhost:4000/incidents -b cookies.txt
```

```json
[
  {
    "id": "clx91k2p0000",
    "title": "Partial dashboard timeouts on report exports",
    "status": "IDENTIFIED",
    "severity": "MINOR",
    "startedAt": "2026-09-03T17:41:00.000Z",
    "resolvedAt": null,
    "service": { "id": "seed-service-dashboard", "name": "Dashboard" },
    "updates": [
      {
        "id": "clx91k2p0001",
        "body": "Some customers cannot export CSV reports.",
        "status": "INVESTIGATING",
        "createdAt": "2026-09-03T17:41:00.000Z",
        "author": { "id": "clx8f2k9a0000", "name": "Ada Okonkwo" }
      }
    ]
  }
]
```

### `POST /incidents`

Creates the incident **and** its first update, then fires `incident.created`.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Min 4 characters |
| `body` | string | Optional. Defaults to "We are investigating this issue." |
| `severity` | enum | `MINOR`, `MAJOR`, `CRITICAL`. Defaults to `MAJOR` |
| `serviceId` | string | Optional |

```bash
curl -X POST http://localhost:4000/incidents \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{
    "title": "Elevated error rates on checkout",
    "body": "We are seeing increased 5xx responses on checkout.",
    "severity": "CRITICAL",
    "serviceId": "seed-service-api"
  }'
```

### `POST /incidents/:id/updates`

Appends an update and moves the incident's status.

| Field | Type | Rules |
| --- | --- | --- |
| `body` | string | Min 4 characters |
| `status` | enum | `INVESTIGATING`, `IDENTIFIED`, `MONITORING`, `RESOLVED` |

```bash
curl -X POST http://localhost:4000/incidents/clx91k2p0000/updates \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{ "body": "Rolled back the bad deploy.", "status": "RESOLVED" }'
```

Setting `RESOLVED` stamps `resolvedAt` **server-side** and fires
`incident.resolved`. Any other status fires `incident.updated`.

---

## Webhooks

### `GET /webhooks`

Endpoints with their eight most recent deliveries.

```json
[
  {
    "id": "clx93aa10000",
    "url": "https://webhook.site/2f1c-...",
    "secret": "6b1f9c2d8e7a4b3c5d6e7f80",
    "events": ["incident.created", "incident.updated", "incident.resolved"],
    "active": true,
    "deliveries": [
      {
        "id": "clx93ab20001",
        "status": "SUCCESS",
        "attempts": 1,
        "event": "incident.created",
        "lastError": null,
        "createdAt": "2026-09-03T18:02:11.000Z",
        "deliveredAt": "2026-09-03T18:02:12.000Z"
      }
    ]
  }
]
```

### `POST /webhooks`

The secret is generated server-side and returned once in the list response.

| Field | Type | Rules |
| --- | --- | --- |
| `url` | string | Valid URL |
| `events` | string[] | At least one of `incident.created`, `incident.updated`, `incident.resolved` |

```bash
curl -X POST http://localhost:4000/webhooks \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "events": ["incident.created", "incident.resolved"]
  }'
```

### `DELETE /webhooks/:id`

```json
{ "ok": true }
```

---

## Public status page

### `GET /public/:slug`

No authentication. This is what the Next.js page at `/s/[slug]` renders.

```bash
curl http://localhost:4000/public/acme
```

```json
{
  "name": "Acme Cloud",
  "slug": "acme",
  "status": "DEGRADED",
  "updatedAt": "2026-09-03T20:41:00.000Z",
  "historyDays": 90,
  "services": [
    {
      "id": "seed-service-api",
      "name": "Public API",
      "description": "REST endpoints and webhook ingestion",
      "status": "OPERATIONAL",
      "uptime": 99.861,
      "history": [
        { "date": "2026-06-05T00:00:00.000Z", "status": "OPERATIONAL" },
        { "date": "2026-06-06T00:00:00.000Z", "status": "PARTIAL_OUTAGE" }
      ]
    }
  ],
  "activeIncidents": [],
  "pastIncidents": []
}
```

`status` is the worst current service status. `history` has one entry per day,
oldest first. `uptime` counts only `MAJOR` and `CRITICAL` incidents as downtime.

---

## Receiving webhooks

Each delivery is a POST with these headers:

```
Content-Type: application/json
X-Beacon-Event: incident.updated
X-Beacon-Signature: sha256=9f2b…c41a
```

Body:

```json
{
  "event": "incident.updated",
  "deliveredAt": "2026-09-03T20:41:00.000Z",
  "data": { "id": "clx91k2p0000", "title": "…", "status": "IDENTIFIED" }
}
```

Verify the signature against the **raw** body, and compare in constant time:

```ts
import { createHmac, timingSafeEqual } from "crypto"

export const isValidSignature = (
  rawBody: string,
  header: string,
  secret: string,
) => {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const received = header.replace("sha256=", "")

  if (expected.length !== received.length) return false

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received))
}
```

Parsing the JSON and re-serialising it before hashing will fail — key order can
change. Always hash the bytes you received.

**Retries.** A non-2xx response or a network error is retried with exponential
backoff, up to five attempts, after which the delivery is marked `FAILED` and the
error is stored in `lastError`. Endpoints should be idempotent: use the delivery
`id` to discard duplicates.

---

## Error responses

Nest's standard shape:

```json
{ "statusCode": 400, "message": ["title must be longer than or equal to 4 characters"], "error": "Bad Request" }
```

| Status | Meaning |
| --- | --- |
| `400` | Validation failed, or an unknown property was sent |
| `401` | Missing, expired, or invalid session |
| `404` | Not found, or owned by another organisation |
| `409` | Email already registered |
