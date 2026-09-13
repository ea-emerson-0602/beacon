import { IncidentStatus } from "@prisma/client";

/**
 * The API owns the resolve timestamp. The first RESOLVED update stamps it;
 * later updates, including a second resolve, leave the original time alone.
 */
export function nextResolvedAt(
  nextStatus: IncidentStatus,
  existingResolvedAt: Date | null,
  now = new Date(),
) {
  if (nextStatus !== IncidentStatus.RESOLVED) {
    return existingResolvedAt;
  }
  return existingResolvedAt ?? now;
}

export function webhookEventForStatus(status: IncidentStatus) {
  return status === IncidentStatus.RESOLVED
    ? "incident.resolved"
    : "incident.updated";
}
