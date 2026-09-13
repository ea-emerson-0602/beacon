# Testing Beacon

The suite lives in the backend. It is a small Vitest project that locks the
three pieces of logic that are easy to break and hard to notice from the UI:
uptime maths, the incident resolve stamp, and webhook signatures.

There is no database, Redis, or running API involved. If `npm test` is green,
those invariants still hold.

---

## Who this is for

| Reader | What you need |
| --- | --- |
| You, locally | `cd backend && npm test` before you push |
| A reviewer / hiring manager | Read this page, then run the same command |
| CI | Run `npm test` in `backend/` after `npm install` |

You do **not** need Postgres, a `.env`, or the frontend.

---

## Setup

From the repository root:

```bash
cd backend
npm install
```

`vitest` is a backend devDependency. `npm install` in `frontend/` is unrelated.

---

## Commands

Run these from `backend/`:

| Command | What it does |
| --- | --- |
| `npm test` | Run the suite once and exit |
| `npm run test:watch` | Re-run files as you edit them |

Expected result: every file under `src/**/*.test.ts` passes. There is no
coverage threshold on purpose — the suite is scoped, not a vanity percentage.

---

## What is covered

| File | Invariant |
| --- | --- |
| [`backend/src/public/uptime.test.ts`](../backend/src/public/uptime.test.ts) | 90-day strip length; midnight-spanning incidents; open incidents; `MINOR` colours the strip but does not reduce the percentage |
| [`backend/src/incidents/resolved-at.test.ts`](../backend/src/incidents/resolved-at.test.ts) | The API stamps `resolvedAt` on the first resolve and never overwrites it |
| [`backend/src/webhooks/signature.test.ts`](../backend/src/webhooks/signature.test.ts) | `X-Beacon-Signature` matches an independent HMAC-SHA256 and a known test vector |

The production code those tests call is in the matching modules next to them
(`uptime.ts`, `resolved-at.ts`, `signature.ts`). The Nest services are thin
wrappers around those functions.

---

## What is not covered

- HTTP routes, cookies, or Prisma queries
- The Next.js UI
- End-to-end “open an incident and watch a webhook land”

Those need a running stack. Use [`SETUP.md`](../SETUP.md) for that walkthrough.

---

## Adding a test

1. Put `*.test.ts` next to the module it exercises, under `backend/src/`.
2. Import `describe` / `it` / `expect` from `vitest`.
3. Prefer a pure function with an injected `now` or a fixture over spinning up
   Nest.
4. Run `npm test`.

If the logic you want to lock is still buried inside a service constructor,
extract it first — that is how this suite started.

---

## CI sketch

A GitHub Actions job only needs Node 20+ and the backend folder:

```yaml
- run: npm ci
  working-directory: backend
- run: npm test
  working-directory: backend
```

No secrets and no services.
