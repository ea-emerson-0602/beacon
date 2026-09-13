"use client"

import { useState, type FormEvent } from "react"
import { IconPlus, IconTrash } from "@/components/Icons"
import { Alert } from "@/components/ui/Alert"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { CopyButton } from "@/components/ui/CopyButton"
import { Field, Input } from "@/components/ui/Field"
import { api } from "@/lib/api"
import { formatRelative } from "@/lib/format"
import type { Tone } from "@/lib/status"
import type { Webhook } from "@/lib/types"

const DELIVERY_TONE: Record<string, Tone> = {
  SUCCESS: "ok",
  PENDING: "warn",
  PROCESSING: "info",
  FAILED: "danger",
}

const EVENTS = ["incident.created", "incident.updated", "incident.resolved"]

type WebhooksPanelProps = {
  webhooks: Webhook[]
  onRefresh: () => Promise<void>
}

export const WebhooksPanel = ({ webhooks, onRefresh }: WebhooksPanelProps) => {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")
    setPending(true)

    try {
      await api("/webhooks", {
        method: "POST",
        body: JSON.stringify({ url: data.get("url"), events: EVENTS }),
      })
      form.reset()
      await onRefresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add endpoint")
    } finally {
      setPending(false)
    }
  }

  const handleRemove = async (id: string) => {
    setError("")
    try {
      await api(`/webhooks/${id}`, { method: "DELETE" })
      await onRefresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove")
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Add an endpoint"
          description="Try it with a throwaway URL from webhook.site to watch deliveries and signatures arrive."
        />
        <CardBody>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <Field
              label="Endpoint URL"
              htmlFor="webhook-url"
              hint={`Subscribed to ${EVENTS.join(", ")}`}
            >
              <Input
                id="webhook-url"
                name="url"
                type="url"
                required
                maxLength={2048}
                placeholder="https://webhook.site/your-unique-id"
              />
            </Field>
            <Button type="submit" disabled={pending}>
              <IconPlus />
              {pending ? "Adding…" : "Add endpoint"}
            </Button>
          </form>
          <Alert message={error} className="mt-4" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Endpoints and deliveries"
          description="Payloads are signed with HMAC-SHA256 in the X-Beacon-Signature header. Failed attempts retry with backoff."
        />
        <CardBody className="space-y-4">
          {webhooks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No endpoints yet. Add one, then open an incident to see a delivery.
            </p>
          ) : (
            webhooks.map((hook) => (
              <div
                key={hook.id}
                className="rounded-xl border border-line bg-surface-2/40 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-[family-name:var(--font-mono)] text-sm">
                      {hook.url}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-[family-name:var(--font-mono)] text-xs text-faint">
                        secret {hook.secret.slice(0, 10)}…
                      </span>
                      <CopyButton value={hook.secret} label="Copy secret" />
                      {hook.active ? (
                        <Badge tone="ok">Active</Badge>
                      ) : (
                        <Badge>Paused</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(hook.id)}
                    aria-label={`Remove endpoint ${hook.url}`}
                  >
                    <IconTrash />
                    Remove
                  </Button>
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-xs uppercase tracking-wider text-faint">
                    Recent deliveries
                  </p>
                  {hook.deliveries.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">
                      Nothing delivered yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {hook.deliveries.map((delivery) => (
                        <li
                          key={delivery.id}
                          className="flex flex-wrap items-center gap-2 text-xs"
                        >
                          <Badge tone={DELIVERY_TONE[delivery.status]}>
                            {delivery.status}
                          </Badge>
                          <span className="font-[family-name:var(--font-mono)] text-muted">
                            {delivery.event}
                          </span>
                          <span className="text-faint">
                            {formatRelative(delivery.createdAt)}
                            {delivery.attempts > 1
                              ? ` · ${delivery.attempts} attempts`
                              : ""}
                          </span>
                          {delivery.lastError ? (
                            <span className="text-danger">
                              {delivery.lastError}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  )
}
