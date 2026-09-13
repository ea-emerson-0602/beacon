"use client"

import { useState, type FormEvent } from "react"
import { IncidentTimeline } from "@/components/IncidentTimeline"
import { Alert } from "@/components/ui/Alert"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Field, Input, Select, Textarea } from "@/components/ui/Field"
import { api } from "@/lib/api"
import { formatDateTime, formatDuration } from "@/lib/format"
import {
  INCIDENT_STATUS_LABEL,
  INCIDENT_STATUSES,
  incidentTone,
  SEVERITIES,
  SEVERITY_LABEL,
  severityTone,
} from "@/lib/status"
import type { Incident, Service } from "@/lib/types"

type IncidentsPanelProps = {
  incidents: Incident[]
  services: Service[]
  onRefresh: () => Promise<void>
}

export const IncidentsPanel = ({
  incidents,
  services,
  onRefresh,
}: IncidentsPanelProps) => {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleOpen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")
    setPending(true)

    try {
      await api("/incidents", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          body: data.get("body") || undefined,
          severity: data.get("severity"),
          serviceId: data.get("serviceId") || undefined,
        }),
      })
      form.reset()
      await onRefresh()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not open incident",
      )
    } finally {
      setPending(false)
    }
  }

  const handleUpdate = async (
    incidentId: string,
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")

    try {
      await api(`/incidents/${incidentId}/updates`, {
        method: "POST",
        body: JSON.stringify({
          body: data.get("body"),
          status: data.get("status"),
        }),
      })
      form.reset()
      await onRefresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not post update")
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Open an incident"
          description="The first update is published to your public timeline immediately, and webhooks fire on incident.created."
        />
        <CardBody>
          <form onSubmit={handleOpen} className="space-y-4">
            <Field label="Title" htmlFor="incident-title">
              <Input
                id="incident-title"
                name="title"
                required
                minLength={4}
                maxLength={160}
                placeholder="Elevated API latency in eu-west"
              />
            </Field>

            <Field
              label="First update"
              htmlFor="incident-body"
              hint="Say what you know now. You can post more updates as you learn."
            >
              <Textarea
                id="incident-body"
                name="body"
                rows={3}
                maxLength={2000}
                placeholder="We are investigating increased error rates on the API."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
              <Field label="Severity" htmlFor="incident-severity">
                <Select
                  id="incident-severity"
                  name="severity"
                  defaultValue="MAJOR"
                >
                  {SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {SEVERITY_LABEL[severity]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Affected service" htmlFor="incident-service">
                <Select id="incident-service" name="serviceId" defaultValue="">
                  <option value="">No specific service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button type="submit" disabled={pending}>
                {pending ? "Opening…" : "Open incident"}
              </Button>
            </div>
          </form>
          <Alert message={error} className="mt-4" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Timeline" description="Newest incidents first." />
        <CardBody className="space-y-6">
          {incidents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No incidents recorded. That is the goal.
            </p>
          ) : (
            incidents.map((incident) => (
              <article
                key={incident.id}
                className="rounded-xl border border-line bg-surface-2/40 p-5"
              >
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
                    {formatDateTime(incident.startedAt)} ·{" "}
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-medium tracking-tight">
                  {incident.title}
                </h3>

                <div className="mt-4">
                  <IncidentTimeline updates={incident.updates} />
                </div>

                {incident.status === "RESOLVED" ? null : (
                  <form
                    onSubmit={(event) => handleUpdate(incident.id, event)}
                    className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                  >
                    <Input
                      name="body"
                      required
                      minLength={4}
                      placeholder="Post an update…"
                      aria-label={`Update for ${incident.title}`}
                    />
                    <Select
                      name="status"
                      defaultValue="IDENTIFIED"
                      aria-label="New status"
                      className="w-auto"
                    >
                      {INCIDENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {INCIDENT_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="secondary">
                      Post
                    </Button>
                  </form>
                )}
              </article>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  )
}
