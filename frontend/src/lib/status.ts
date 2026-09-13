import type {
  DayStatus,
  IncidentSeverity,
  IncidentStatus,
  ServiceStatus,
} from "./types"

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral"

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  OPERATIONAL: "Operational",
  DEGRADED: "Degraded performance",
  PARTIAL_OUTAGE: "Partial outage",
  MAJOR_OUTAGE: "Major outage",
  MAINTENANCE: "Under maintenance",
}

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  INVESTIGATING: "Investigating",
  IDENTIFIED: "Identified",
  MONITORING: "Monitoring",
  RESOLVED: "Resolved",
}

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  MINOR: "Minor",
  MAJOR: "Major",
  CRITICAL: "Critical",
}

export const SERVICE_STATUSES: ServiceStatus[] = [
  "OPERATIONAL",
  "DEGRADED",
  "PARTIAL_OUTAGE",
  "MAJOR_OUTAGE",
  "MAINTENANCE",
]

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "INVESTIGATING",
  "IDENTIFIED",
  "MONITORING",
  "RESOLVED",
]

export const SEVERITIES: IncidentSeverity[] = ["MINOR", "MAJOR", "CRITICAL"]

export const serviceTone = (status: ServiceStatus): Tone => {
  if (status === "OPERATIONAL") return "ok"
  if (status === "MAINTENANCE") return "info"
  if (status === "DEGRADED") return "warn"
  return "danger"
}

export const incidentTone = (status: IncidentStatus): Tone => {
  if (status === "RESOLVED") return "ok"
  if (status === "MONITORING") return "info"
  if (status === "IDENTIFIED") return "warn"
  return "danger"
}

export const severityTone = (severity: IncidentSeverity): Tone => {
  if (severity === "MINOR") return "warn"
  if (severity === "MAJOR") return "danger"
  return "danger"
}

export const dayTone = (status: DayStatus): Tone => {
  if (status === "OPERATIONAL") return "ok"
  if (status === "DEGRADED") return "warn"
  return "danger"
}

export const headlineFor = (status: ServiceStatus) => {
  if (status === "OPERATIONAL") return "All systems operational"
  if (status === "MAINTENANCE") return "Maintenance in progress"
  if (status === "DEGRADED") return "Degraded performance"
  if (status === "PARTIAL_OUTAGE") return "Partial service outage"
  return "Major service outage"
}
