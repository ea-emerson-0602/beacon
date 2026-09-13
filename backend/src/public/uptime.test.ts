import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  HISTORY_DAYS,
  buildHistory,
  overallStatus,
  startOfUtcDay,
  uptimePercentage,
} from "./uptime";

const NOW = new Date("2026-09-06T12:00:00.000Z");

describe("buildHistory", () => {
  it("returns 90 operational days when nothing happened", () => {
    const history = buildHistory([], NOW);

    expect(history).toHaveLength(HISTORY_DAYS);
    expect(history.every((bucket) => bucket.status === "OPERATIONAL")).toBe(
      true,
    );
    expect(history[0].date).toBe(
      new Date(startOfUtcDay(NOW) - (HISTORY_DAYS - 1) * DAY_MS).toISOString(),
    );
    expect(history[history.length - 1].date).toBe(
      new Date(startOfUtcDay(NOW)).toISOString(),
    );
  });

  it("marks both UTC days when an incident spans midnight", () => {
    const history = buildHistory(
      [
        {
          startedAt: new Date("2026-09-04T22:15:00.000Z"),
          resolvedAt: new Date("2026-09-05T02:40:00.000Z"),
          severity: "MAJOR",
        },
      ],
      NOW,
    );

    const fourth = history.find((bucket) =>
      bucket.date.startsWith("2026-09-04"),
    );
    const fifth = history.find((bucket) => bucket.date.startsWith("2026-09-05"));
    const sixth = history.find((bucket) => bucket.date.startsWith("2026-09-06"));

    expect(fourth?.status).toBe("PARTIAL_OUTAGE");
    expect(fifth?.status).toBe("PARTIAL_OUTAGE");
    expect(sixth?.status).toBe("OPERATIONAL");
  });

  it("treats an open incident as still running through today", () => {
    const history = buildHistory(
      [
        {
          startedAt: new Date("2026-09-06T08:00:00.000Z"),
          resolvedAt: null,
          severity: "CRITICAL",
        },
      ],
      NOW,
    );
    const today = history.find((bucket) => bucket.date.startsWith("2026-09-06"));
    const yesterday = history.find((bucket) =>
      bucket.date.startsWith("2026-09-05"),
    );

    expect(today?.status).toBe("MAJOR_OUTAGE");
    expect(yesterday?.status).toBe("OPERATIONAL");
  });

  it("shows MINOR as degraded in the strip", () => {
    const history = buildHistory(
      [
        {
          startedAt: new Date("2026-09-05T10:00:00.000Z"),
          resolvedAt: new Date("2026-09-05T11:00:00.000Z"),
          severity: "MINOR",
        },
      ],
      NOW,
    );
    const fifth = history.find((bucket) => bucket.date.startsWith("2026-09-05"));
    expect(fifth?.status).toBe("DEGRADED");
  });

  it("keeps the worst status when two incidents overlap a day", () => {
    const history = buildHistory(
      [
        {
          startedAt: new Date("2026-09-05T08:00:00.000Z"),
          resolvedAt: new Date("2026-09-05T09:00:00.000Z"),
          severity: "MINOR",
        },
        {
          startedAt: new Date("2026-09-05T18:00:00.000Z"),
          resolvedAt: new Date("2026-09-05T19:00:00.000Z"),
          severity: "CRITICAL",
        },
      ],
      NOW,
    );
    const fifth = history.find((bucket) => bucket.date.startsWith("2026-09-05"));
    expect(fifth?.status).toBe("MAJOR_OUTAGE");
  });
});

describe("uptimePercentage", () => {
  it("is 100 when there are no incidents", () => {
    expect(uptimePercentage([], NOW)).toBe(100);
  });

  it("does not count MINOR incidents as downtime", () => {
    expect(
      uptimePercentage(
        [
          {
            startedAt: new Date("2026-09-05T10:00:00.000Z"),
            resolvedAt: new Date("2026-09-05T16:00:00.000Z"),
            severity: "MINOR",
          },
        ],
        NOW,
      ),
    ).toBe(100);
  });

  it("subtracts MAJOR duration from the 90-day window", () => {
    const hour = 60 * 60 * 1000;
    const windowMs = HISTORY_DAYS * DAY_MS;
    const expected =
      Math.round((100 - (hour / windowMs) * 100) * 1000) / 1000;

    expect(
      uptimePercentage(
        [
          {
            startedAt: new Date("2026-09-05T10:00:00.000Z"),
            resolvedAt: new Date("2026-09-05T11:00:00.000Z"),
            severity: "MAJOR",
          },
        ],
        NOW,
      ),
    ).toBe(expected);
  });

  it("counts an open outage from startedAt through now", () => {
    const startedAt = new Date("2026-09-06T10:00:00.000Z");
    const openMs = NOW.getTime() - startedAt.getTime();
    const expected =
      Math.round((100 - (openMs / (HISTORY_DAYS * DAY_MS)) * 100) * 1000) /
      1000;

    expect(
      uptimePercentage(
        [{ startedAt, resolvedAt: null, severity: "CRITICAL" }],
        NOW,
      ),
    ).toBe(expected);
  });
});

describe("overallStatus", () => {
  it("returns OPERATIONAL when there are no services", () => {
    expect(overallStatus([])).toBe("OPERATIONAL");
  });

  it("is the worst service status", () => {
    expect(overallStatus(["OPERATIONAL", "DEGRADED", "MAINTENANCE"])).toBe(
      "DEGRADED",
    );
  });
});
