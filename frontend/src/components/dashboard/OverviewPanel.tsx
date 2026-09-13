"use client"

import Link from "next/link"
import { IconArrowRight } from "@/components/Icons"
import { IncidentTimeline } from "@/components/IncidentTimeline"
import { StatCard } from "@/components/dashboard/StatCard"
import { Badge } from "@/components/ui/Badge"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { StatusDot } from "@/components/ui/StatusDot"
import { formatDuration } from "@/lib/format"
import {
  headlineFor,
  INCIDENT_STATUS_LABEL,
  incidentTone,
  SERVICE_STATUS_LABEL,
  serviceTone,
  SEVERITY_LABEL,
  severityTone,
} from "@/lib/status"
import type { Incident, Service, ServiceStatus, Webhook } from "@/lib/types"

const RANK: Record<ServiceStatus, number> = {
  OPERATIONAL: 0,
  MAINTENANCE: 1,
  DEGRADED: 2,
  PARTIAL_OUTAGE: 3,
  MAJOR_OUTAGE: 4,
}

type OverviewPanelProps = {
  services: Service[]
  incidents: Incident[]
  webhooks: Webhook[]
  slug: string
}

export const OverviewPanel = ({
  services,
  incidents,
  webhooks,
  slug,
}: OverviewPanelProps) => {
  const worst = services.reduce<ServiceStatus>(
    (acc, service) =>
      RANK[service.status] > RANK[acc] ? service.status : acc,
    "OPERATIONAL",
  )

  const active = incidents.filter((incident) => incident.status !== "RESOLVED")
  const failedDeliveries = webhooks
    .flatMap((hook) => hook.deliveries)
    .filter((delivery) => delivery.status === "FAILED").length

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2.5 text-lg font-medium">
                <StatusDot
                  tone={serviceTone(worst)}
                  pulse={worst !== "OPERATIONAL"}
                />
                {headlineFor(worst)}
              </p>
              <p className="mt-1 text-sm text-muted">
                This is what visitors see at the top of your public page.
              </p>
            </div>
            <Link
              href={`/s/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-2 hover:underline"
            >
              Open public page
              <IconArrowRight />
            </Link>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Services" value={services.length} />
        <StatCard
          label="Active incidents"
          value={active.length}
          tone={active.length === 0 ? "ok" : "danger"}
        />
        <StatCard
          label="Incidents logged"
          value={incidents.length}
          hint="All time"
        />
        <StatCard
          label="Failed deliveries"
          value={failedDeliveries}
          tone={failedDeliveries === 0 ? "ok" : "warn"}
          hint={`${webhooks.length} endpoint${webhooks.length === 1 ? "" : "s"}`}
        />
      </div>

      <Card>
        <CardHeader
          title="Active incidents"
          description="Anything not yet resolved, with its most recent updates."
        />
        <CardBody className="space-y-5">
          {active.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Nothing open right now.
            </p>
          ) : (
            active.map((incident) => (
              <article key={incident.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={incidentTone(incident.status)}>
                    {INCIDENT_STATUS_LABEL[incident.status]}
                  </Badge>
                  <Badge tone={severityTone(incident.severity)}>
                    {SEVERITY_LABEL[incident.severity]}
                  </Badge>
                  <span className="text-xs text-faint">
                    Open for{" "}
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                  </span>
                </div>
                <h3 className="mt-2 font-medium">{incident.title}</h3>
                <div className="mt-3">
                  <IncidentTimeline updates={incident.updates} limit={2} />
                </div>
              </article>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Service status" />
        <CardBody className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm"
            >
              <span className="flex items-center gap-2">
                <StatusDot tone={serviceTone(service.status)} />
                {service.name}
              </span>
              <span className="text-muted">
                {SERVICE_STATUS_LABEL[service.status]}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
