export type ServiceStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL_OUTAGE"
  | "MAJOR_OUTAGE"
  | "MAINTENANCE"

export type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED"

export type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL"

export type DayStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL_OUTAGE"
  | "MAJOR_OUTAGE"

export type Me = {
  id: string
  email: string
  name: string
  organization: {
    id: string
    name: string
    slug: string
    role: "OWNER" | "ADMIN" | "MEMBER"
  } | null
}

export type Service = {
  id: string
  name: string
  description: string
  status: ServiceStatus
}

export type IncidentUpdate = {
  id: string
  body: string
  status: IncidentStatus
  createdAt: string
  author: { id: string; name: string } | null
}

export type Incident = {
  id: string
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  startedAt: string
  resolvedAt: string | null
  service: { id: string; name: string } | null
  updates: IncidentUpdate[]
}

export type WebhookDelivery = {
  id: string
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
  attempts: number
  event: string
  lastError: string | null
  createdAt: string
  deliveredAt: string | null
}

export type Webhook = {
  id: string
  url: string
  secret: string
  events: string[]
  active: boolean
  deliveries: WebhookDelivery[]
}

export type StatusPageService = Service & {
  history: { date: string; status: DayStatus }[]
  uptime: number
}

export type StatusPage = {
  name: string
  slug: string
  status: ServiceStatus
  updatedAt: string
  historyDays: number
  services: StatusPageService[]
  activeIncidents: Incident[]
  pastIncidents: Incident[]
}
