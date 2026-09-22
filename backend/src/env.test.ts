import { afterEach, describe, expect, it } from "vitest";
import { assertProductionEnv, webOrigin } from "./env";

const keys = [
  "NODE_ENV",
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "WEB_ORIGIN",
] as const;

describe("production env", () => {
  afterEach(() => {
    for (const key of keys) {
      delete process.env[key];
    }
  });

  it("strips a trailing slash from WEB_ORIGIN", () => {
    process.env.WEB_ORIGIN = "https://beacon.vercel.app/";
    expect(webOrigin()).toBe("https://beacon.vercel.app");
  });

  it("rejects missing production variables with a clear message", () => {
    process.env.NODE_ENV = "production";
    expect(() => assertProductionEnv()).toThrow(
      /Missing required production environment variables/,
    );
  });

  it("rejects the example JWT placeholder in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://example";
    process.env.DIRECT_URL = "postgres://example";
    process.env.WEB_ORIGIN = "https://beacon.vercel.app";
    process.env.JWT_SECRET = "change-me-to-a-long-random-string";
    expect(() => assertProductionEnv()).toThrow(/JWT_SECRET/);
  });
});
