"use client"

import { useState, type FormEvent } from "react"
import { IconPlus } from "@/components/Icons"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { Field, Input, Select } from "@/components/ui/Field"
import { StatusDot } from "@/components/ui/StatusDot"
import { api } from "@/lib/api"
import { PATTERNS } from "@/lib/validation"
import {
  SERVICE_STATUS_LABEL,
  SERVICE_STATUSES,
  serviceTone,
} from "@/lib/status"
import type { Service, ServiceStatus } from "@/lib/types"

type ServicesPanelProps = {
  services: Service[]
  onRefresh: () => Promise<void>
}

export const ServicesPanel = ({ services, onRefresh }: ServicesPanelProps) => {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")
    setPending(true)

    try {
      await api("/services", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          description: data.get("description") || undefined,
        }),
      })
      form.reset()
      await onRefresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add service")
    } finally {
      setPending(false)
    }
  }

  const handleStatusChange = async (id: string, status: ServiceStatus) => {
    setError("")
    try {
      await api(`/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      await onRefresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update")
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Services"
          description="Each service appears on your public page with its own uptime history."
        />
        <CardBody className="space-y-3">
          {services.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No services yet. Add your first one below.
            </p>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <StatusDot tone={serviceTone(service.status)} />
                    {service.name}
                  </p>
                  {service.description ? (
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <Select
                  aria-label={`Status for ${service.name}`}
                  value={service.status}
                  onChange={(event) =>
                    handleStatusChange(
                      service.id,
                      event.target.value as ServiceStatus,
                    )
                  }
                  className="w-auto"
                >
                  {SERVICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {SERVICE_STATUS_LABEL[status]}
                    </option>
                  ))}
                </Select>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Add a service" />
        <CardBody>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <Field label="Name" htmlFor="service-name">
              <Input
                id="service-name"
                name="name"
                required
                minLength={2}
                maxLength={80}
                pattern={PATTERNS.serviceName}
                title="Start with a letter or number"
                placeholder="Public API"
              />
            </Field>
            <Field label="Description" htmlFor="service-description">
              <Input
                id="service-description"
                name="description"
                maxLength={240}
                placeholder="REST endpoints"
              />
            </Field>
            <Button type="submit" disabled={pending}>
              <IconPlus />
              {pending ? "Adding…" : "Add"}
            </Button>
          </form>
          <Alert message={error} className="mt-4" />
        </CardBody>
      </Card>
    </div>
  )
}
