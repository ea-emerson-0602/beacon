const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "WEB_ORIGIN",
] as const;

const PLACEHOLDER_SECRETS = new Set([
  "dev-only-change-me",
  "change-me-to-a-long-random-string",
]);

export const readEnv = (key: string): string => (process.env[key] ?? "").trim();

export const webOrigin = (): string =>
  readEnv("WEB_ORIGIN").replace(/\/$/, "") || "http://localhost:3000";

export const assertProductionEnv = (): void => {
  if (readEnv("NODE_ENV") !== "production") {
    return;
  }

  const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !readEnv(key));
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }

  if (PLACEHOLDER_SECRETS.has(readEnv("JWT_SECRET"))) {
    throw new Error(
      "JWT_SECRET must be a long random value in production, not the example placeholder",
    );
  }
};
