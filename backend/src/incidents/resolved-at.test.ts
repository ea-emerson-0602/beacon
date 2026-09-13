import { IncidentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { nextResolvedAt, webhookEventForStatus } from "./resolved-at";

const FIRST = new Date("2026-09-06T09:00:00.000Z");
const LATER = new Date("2026-09-06T11:30:00.000Z");

describe("nextResolvedAt", () => {
  it("stamps the first RESOLVED update with the server clock", () => {
    expect(nextResolvedAt(IncidentStatus.RESOLVED, null, LATER)).toEqual(LATER);
  });

  it("does not overwrite the original timestamp on a second resolve", () => {
    expect(nextResolvedAt(IncidentStatus.RESOLVED, FIRST, LATER)).toEqual(FIRST);
  });

  it("leaves an existing stamp alone when the incident is reopened", () => {
    expect(
      nextResolvedAt(IncidentStatus.MONITORING, FIRST, LATER),
    ).toEqual(FIRST);
  });

  it("does not invent a stamp for a non-resolve update", () => {
    expect(
      nextResolvedAt(IncidentStatus.IDENTIFIED, null, LATER),
    ).toBeNull();
  });
});

describe("webhookEventForStatus", () => {
  it("emits incident.resolved only for RESOLVED", () => {
    expect(webhookEventForStatus(IncidentStatus.RESOLVED)).toBe(
      "incident.resolved",
    );
    expect(webhookEventForStatus(IncidentStatus.IDENTIFIED)).toBe(
      "incident.updated",
    );
  });
});
