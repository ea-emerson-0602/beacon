"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { IconExternal } from "@/components/Icons"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AccountPanel } from "@/components/dashboard/AccountPanel"
import { IncidentsPanel } from "@/components/dashboard/IncidentsPanel"
import { OverviewPanel } from "@/components/dashboard/OverviewPanel"
import { ServicesPanel } from "@/components/dashboard/ServicesPanel"
import { WebhooksPanel } from "@/components/dashboard/WebhooksPanel"
import { Alert } from "@/components/ui/Alert"
import { Button, ButtonLink } from "@/components/ui/Button"
import { api, ApiError } from "@/lib/api"
import { cn } from "@/lib/cn"
import type { Incident, Me, Service, Webhook } from "@/lib/types"

const TABS = ["Overview", "Services", "Incidents", "Webhooks", "Account"] as const

type Tab = (typeof TABS)[number]

const DashboardPage = () => {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("Overview")
  const [me, setMe] = useState<Me | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    const [nextMe, nextServices, nextIncidents, nextWebhooks] =
      await Promise.all([
        api<Me>("/auth/me"),
        api<Service[]>("/services"),
        api<Incident[]>("/incidents"),
        api<Webhook[]>("/webhooks"),
      ])

    setMe(nextMe)
    setServices(nextServices)
    setIncidents(nextIncidents)
    setWebhooks(nextWebhooks)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        await refresh()
        setStatus("ready")
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login")
          return
        }
        setError(
          caught instanceof Error ? caught.message : "Could not load the console",
        )
        setStatus("error")
      }
    }

    load()
  }, [refresh, router])

  const handleSignOut = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined)
    router.replace("/")
  }

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <p className="animate-fade-in text-sm text-muted">Loading console…</p>
      </main>
    )
  }

  if (status === "error") {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6">
        <div className="w-full text-center">
          <Logo />
          <h1 className="mt-8 text-xl font-semibold">Console unavailable</h1>
          <Alert message={error} className="mt-4 text-left" />
          <ButtonLink href="/login" variant="secondary" className="mt-6">
            Back to sign in
          </ButtonLink>
        </div>
      </main>
    )
  }

  const organization = me?.organization

  if (!organization) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
        <div>
          <Logo />
          <p className="mt-8 text-sm text-muted">
            This account has no organisation yet. Register again to create one.
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <Logo href="/dashboard" />
          <span className="hidden h-6 w-px bg-line sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{organization.name}</p>
            <p className="text-xs text-faint">
              {me?.email} · {organization.role.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/s/${organization.slug}`}
            variant="secondary"
            size="sm"
          >
            Public page
            <IconExternal />
          </ButtonLink>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <nav
        aria-label="Console sections"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-current={tab === item ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200",
              tab === item
                ? "border-brand text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      <main className="animate-fade-up pt-6">
        {tab === "Overview" ? (
          <OverviewPanel
            services={services}
            incidents={incidents}
            webhooks={webhooks}
            slug={organization.slug}
          />
        ) : null}

        {tab === "Services" ? (
          <ServicesPanel services={services} onRefresh={refresh} />
        ) : null}

        {tab === "Incidents" ? (
          <IncidentsPanel
            incidents={incidents}
            services={services}
            onRefresh={refresh}
          />
        ) : null}

        {tab === "Webhooks" ? (
          <WebhooksPanel webhooks={webhooks} onRefresh={refresh} />
        ) : null}

        {tab === "Account" && me ? <AccountPanel me={me} /> : null}
      </main>
    </div>
  )
}

export default DashboardPage
