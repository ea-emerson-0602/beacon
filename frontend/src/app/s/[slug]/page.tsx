import type { Metadata } from "next"
import Link from "next/link"
import { IconExternal } from "@/components/Icons"
import { ThemeToggle } from "@/components/ThemeToggle"
import { IncidentTimeline } from "@/components/IncidentTimeline"
import { Logo } from "@/components/Logo"
import { UptimeStrip } from "@/components/UptimeStrip"
import { Badge } from "@/components/ui/Badge"
import { ButtonLink } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { StatusDot } from "@/components/ui/StatusDot"
import { API_URL } from "@/lib/api"
import { formatDateTime, formatDuration, formatUptime } from "@/lib/format"
import {
  headlineFor,
  incidentTone,
  INCIDENT_STATUS_LABEL,
  SERVICE_STATUS_LABEL,
  serviceTone,
  SEVERITY_LABEL,
  severityTone,
} from "@/lib/status"
import type { StatusPage } from "@/lib/types"

const loadStatusPage = async (slug: string): Promise<StatusPage | null> => {
  try {
    const response = await fetch(`${API_URL}/public/${slug}`, {
      cache: "no-store",
    })
    if (!response.ok) return null
    return (await response.json()) as StatusPage
  } catch {
    return null
  }
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const page = await loadStatusPage(slug)

  if (!page) return { title: "Status page not found" }

  return {
    title: `${page.name} status`,
    description: `Current status and incident history for ${page.name}.`,
  }
}

const PublicStatusPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const page = await loadStatusPage(slug)

  if (!page) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <Logo />
        <h1 className="mt-10 text-2xl font-semibold tracking-tight">
          No status page for “{slug}”
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Either the slug is wrong, or the API is not running. Start the backend
          on <span className="font-[family-name:var(--font-mono)]">{API_URL}</span>{" "}
          and run the seed script to create the demo page.
        </p>
        <ButtonLink href="/" variant="secondary" className="mt-8">
          Back to Beacon
        </ButtonLink>
      </main>
    )
  }

  const tone = serviceTone(page.status)
  const banners = {
    ok: "border-ok/25 bg-ok/10",
    warn: "border-warn/25 bg-warn/10",
    danger: "border-danger/25 bg-danger/10",
    info: "border-info/25 bg-info/10",
    neutral: "border-line bg-surface",
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-faint">
            Status page
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {page.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-fg"
          >
            Powered by Beacon
            <IconExternal />
          </Link>
        </div>
      </header>

      <main className="animate-fade-up space-y-10">
        <section
          className={`rounded-2xl border px-6 py-5 ${banners[tone]}`}
          aria-live="polite"
        >
          <p className="flex items-center gap-2.5 text-lg font-medium">
            <StatusDot tone={tone} pulse={tone !== "ok"} />
            {headlineFor(page.status)}
          </p>
          <p className="mt-1.5 text-sm text-muted">
            Last checked {formatDateTime(page.updatedAt)}
          </p>
        </section>

        {page.activeIncidents.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Active incidents
            </h2>
            <div className="mt-4 space-y-4">
              {page.activeIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={incidentTone(incident.status)}>
                        {INCIDENT_STATUS_LABEL[incident.status]}
                      </Badge>
                      <Badge tone={severityTone(incident.severity)}>
                        {SEVERITY_LABEL[incident.severity]}
                      </Badge>
                      {incident.service ? (
                        <Badge>{incident.service.name}</Badge>
                      ) : null}
                      <span className="text-xs text-faint">
                        Open for{" "}
                        {formatDuration(incident.startedAt, incident.resolvedAt)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-medium tracking-tight">
                      {incident.title}
                    </h3>
                    <div className="mt-5">
                      <IncidentTimeline updates={incident.updates} />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Services
            </h2>
            <p className="text-xs text-faint">
              Uptime over the last {page.historyDays} days
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {page.services.map((service) => (
              <Card key={service.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <StatusDot tone={serviceTone(service.status)} />
                        {service.name}
                      </p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-muted">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-[family-name:var(--font-mono)] text-sm">
                        {formatUptime(service.uptime)}
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        {SERVICE_STATUS_LABEL[service.status]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <UptimeStrip
                      history={service.history}
                      days={page.historyDays}
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Incident history
          </h2>
          {page.pastIncidents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No incidents in the last {page.historyDays} days.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {page.pastIncidents.map((incident) => (
                <li
                  key={incident.id}
                  className="rounded-2xl border border-line bg-surface/60 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{incident.title}</p>
                    <Badge tone="ok">Resolved</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-faint">
                    {formatDateTime(incident.startedAt)} · lasted{" "}
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                    {incident.service ? ` · ${incident.service.name}` : ""}
                  </p>
                  {incident.updates.length > 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {incident.updates[0].body}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default PublicStatusPage
