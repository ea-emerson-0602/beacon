import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  IconArrowRight,
  IconBolt,
  IconDatabase,
  IconPulse,
  IconShield,
  IconTimeline,
  IconWebhook,
} from "@/components/Icons"
import { Badge } from "@/components/ui/Badge"
import { ButtonLink } from "@/components/ui/Button"
import { StatusDot } from "@/components/ui/StatusDot"

const features = [
  {
    icon: IconPulse,
    title: "Public status page",
    body: "A page customers can read during an outage: overall state, per-service uptime history, and the incident timeline.",
  },
  {
    icon: IconTimeline,
    title: "Incident timeline",
    body: "Post updates as Investigating, Identified, Monitoring, or Resolved. The state machine lives in the API, not the UI.",
  },
  {
    icon: IconWebhook,
    title: "Signed webhooks",
    body: "Every event is delivered with an HMAC-SHA256 signature so receivers can verify the payload came from you.",
  },
  {
    icon: IconShield,
    title: "Session auth",
    body: "httpOnly cookie sessions, hashed passwords, and organisation-scoped queries on every read and write.",
  },
  {
    icon: IconDatabase,
    title: "Postgres outbox",
    body: "Deliveries are written to the database first, then retried by a worker. Nothing is lost if Redis is unavailable.",
  },
  {
    icon: IconBolt,
    title: "Queue when you want it",
    body: "Set REDIS_URL and delivery runs through BullMQ with exponential backoff. Leave it empty and the outbox still drains.",
  },
]

const stack = [
  {
    label: "Frontend",
    value: "Next.js 15",
    detail: "App Router, server components for the public page, Tailwind v4",
  },
  {
    label: "Backend",
    value: "NestJS 11",
    detail: "Modules, guards, validation pipes, scheduled worker",
  },
  {
    label: "Data",
    value: "Postgres + Prisma",
    detail: "Relational model with an outbox table for deliveries",
  },
]

const demoServices = [
  { name: "Public API", tone: "ok" as const, uptime: "99.982%" },
  { name: "Dashboard", tone: "warn" as const, uptime: "99.412%" },
  { name: "Authentication", tone: "ok" as const, uptime: "99.998%" },
]

const HomePage = () => (
  <div className="mx-auto max-w-6xl px-6">
    <header className="flex items-center justify-between py-6">
      <Logo />
      <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <ButtonLink href="/s/acme" variant="ghost" size="sm">
          View demo page
        </ButtonLink>
        <ButtonLink href="/demo" variant="ghost" size="sm">
          Run demo
        </ButtonLink>
        <ButtonLink href="/login" variant="secondary" size="sm">
          Sign in
        </ButtonLink>
        <ThemeToggle />
      </nav>
    </header>

    <main>
      <section className="grid gap-14 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
        <div className="animate-fade-up">
          <Badge tone="info">
            <StatusDot tone="info" pulse />
            Status · Incidents · Webhooks
          </Badge>
          <h1 className="mt-6 text-balance font-[family-name:var(--font-display)] text-5xl leading-[1.03] tracking-tight md:text-6xl">
            Tell customers the truth,
            <span className="text-brand-2"> while the system is on fire.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Beacon is a status page with a real backend behind it. Operators
            open incidents and post updates; customers get an honest page and
            integrators get signed webhooks they can verify.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/register" size="lg">
              Create a status page
              <IconArrowRight />
            </ButtonLink>
            <ButtonLink href="/demo" variant="secondary" size="lg">
              Run the demo
            </ButtonLink>
          </div>
          <p className="mt-5 text-sm text-faint">
            Run the demo opens the seeded Acme console. Sign in is for your own
            account.
          </p>
        </div>

        <div className="animate-fade-in rounded-2xl border border-line bg-surface/90 p-6 shadow-[var(--shadow-hero)] backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Acme Cloud</p>
            <Badge tone="warn">Degraded</Badge>
          </div>
          <p className="mt-4 flex items-center gap-2 text-lg font-medium">
            <StatusDot tone="warn" pulse />
            Partial dashboard timeouts
          </p>
          <div className="mt-6 space-y-4">
            {demoServices.map((service) => (
              <div key={service.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <StatusDot tone={service.tone} />
                    {service.name}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
                    {service.uptime}
                  </span>
                </div>
                <div className="mt-2 flex gap-[2px]">
                  {Array.from({ length: 44 }).map((_, index) => {
                    const isBad =
                      service.tone === "warn" && index > 37 && index < 41
                    return (
                      <span
                        key={index}
                        className={`h-6 flex-1 rounded-[2px] ${
                          isBad ? "bg-warn/80" : "bg-ok/60"
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-line pt-4 text-xs text-faint">
            Rendered from the same API the public page uses.
          </p>
        </div>
      </section>

      <section className="border-t border-line py-16 md:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
          Everything an on-call team actually needs
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Not a CRUD demo. The interesting parts are the incident state
          machine, organisation scoping, and reliable outbound delivery.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group rounded-2xl border border-line bg-surface/70 p-6 transition-colors duration-200 hover:border-line-strong hover:bg-surface-2/70"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/12 text-brand-2 ring-1 ring-brand/20">
                <Icon />
              </span>
              <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
              How it is built
            </h2>
            <p className="mt-3 text-muted">
              Two deployable applications that talk over HTTP, so each side can
              scale and ship on its own.
            </p>
            <div className="mt-8 space-y-4">
              {stack.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-line bg-surface/60 px-5 py-4"
                >
                  <p className="text-xs uppercase tracking-wider text-faint">
                    {row.label}
                  </p>
                  <p className="mt-1 font-medium">{row.value}</p>
                  <p className="mt-1 text-sm text-muted">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2/60 p-6">
            <p className="text-xs uppercase tracking-wider text-faint">
              Outbound webhook payload
            </p>
            <pre className="mt-4 overflow-x-auto font-[family-name:var(--font-mono)] text-xs leading-relaxed text-muted">
              {`POST https://your-app.example/hooks/beacon
X-Beacon-Event: incident.updated
X-Beacon-Signature: sha256=9f2b...c41a

{
  "event": "incident.updated",
  "deliveredAt": "2026-09-03T20:41:00.000Z",
  "data": {
    "id": "clx91k2p0000",
    "title": "Partial dashboard timeouts",
    "status": "IDENTIFIED",
    "severity": "MINOR",
    "service": { "name": "Dashboard" }
  }
}`}
            </pre>
            <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
              Verify with an HMAC-SHA256 digest of the raw body using your
              endpoint secret, then compare in constant time.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
          Run it locally in a few minutes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Bring a Postgres database, run the migration and seed, and you have a
          working status page with 90 days of history.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" size="lg">
            Get started
            <IconArrowRight />
          </ButtonLink>
          <ButtonLink href="/demo" variant="secondary" size="lg">
            Run the demo
          </ButtonLink>
        </div>
      </section>
    </main>

    <footer className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-sm text-faint sm:flex-row">
      <Logo />
      <p>Next.js · NestJS · Postgres · Prisma · BullMQ</p>
    </footer>
  </div>
)

export default HomePage
