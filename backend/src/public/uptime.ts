import type { ServiceStatus } from "@prisma/client";

export const HISTORY_DAYS = 90;
export const DAY_MS = 24 * 60 * 60 * 1000;

export type DayStatus = "OPERATIONAL" | "DEGRADED" | "PARTIAL_OUTAGE" | "MAJOR_OUTAGE";

export type IncidentWindow = {
  startedAt: Date;
  resolvedAt: Date | null;
  severity: string;
};

const STATUS_RANK: Record<ServiceStatus, number> = {
  OPERATIONAL: 0,
  MAINTENANCE: 1,
  DEGRADED: 2,
  PARTIAL_OUTAGE: 3,
  MAJOR_OUTAGE: 4,
};

const SEVERITY_TO_DAY: Record<string, DayStatus> = {
  MINOR: "DEGRADED",
  MAJOR: "PARTIAL_OUTAGE",
  CRITICAL: "MAJOR_OUTAGE",
};

const DAY_RANK: Record<DayStatus, number> = {
  OPERATIONAL: 0,
  DEGRADED: 1,
  PARTIAL_OUTAGE: 2,
  MAJOR_OUTAGE: 3,
};

export function overallStatus(statuses: ServiceStatus[]): ServiceStatus {
  if (statuses.length === 0) return "OPERATIONAL";
  return statuses.reduce((worst, status) =>
    STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst,
  );
}

export function startOfUtcDay(value: Date) {
  return Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
}

/** One bucket per day, oldest first, so the UI can render a status strip. */
export function buildHistory(incidents: IncidentWindow[], now = new Date()) {
  const today = startOfUtcDay(now);
  const buckets = new Map<number, DayStatus>();

  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    buckets.set(today - offset * DAY_MS, "OPERATIONAL");
  }

  for (const incident of incidents) {
    const from = Math.max(
      startOfUtcDay(incident.startedAt),
      today - (HISTORY_DAYS - 1) * DAY_MS,
    );
    const to = startOfUtcDay(incident.resolvedAt ?? now);
    const dayStatus = SEVERITY_TO_DAY[incident.severity] ?? "DEGRADED";

    for (let day = from; day <= to; day += DAY_MS) {
      const current = buckets.get(day);
      if (current && DAY_RANK[dayStatus] > DAY_RANK[current]) {
        buckets.set(day, dayStatus);
      }
    }
  }

  return [...buckets.entries()].map(([timestamp, status]) => ({
    date: new Date(timestamp).toISOString(),
    status,
  }));
}

/**
 * Downtime is measured from incident duration, counting only MAJOR and
 * CRITICAL. Degraded performance is visible in the strip but does not
 * inflate the outage number.
 */
export function uptimePercentage(incidents: IncidentWindow[], now = new Date()) {
  const nowMs = now.getTime();
  const windowStart = nowMs - HISTORY_DAYS * DAY_MS;
  const windowMs = nowMs - windowStart;

  const downtimeMs = incidents
    .filter((incident) => incident.severity !== "MINOR")
    .reduce((total, incident) => {
      const from = Math.max(incident.startedAt.getTime(), windowStart);
      const to = Math.min((incident.resolvedAt ?? now).getTime(), nowMs);
      return total + Math.max(0, to - from);
    }, 0);

  const value = 100 - (downtimeMs / windowMs) * 100;
  return Math.round(Math.min(100, Math.max(0, value)) * 1000) / 1000;
}
