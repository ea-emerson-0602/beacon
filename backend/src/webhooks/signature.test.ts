import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  signatureHeader,
  signWebhookBody,
  verifySignature,
} from "./signature";

const SECRET = "endpoint-secret";
const BODY = JSON.stringify({
  event: "incident.updated",
  deliveredAt: "2026-09-03T20:41:00.000Z",
  data: { title: "Partial dashboard timeouts" },
});

describe("signWebhookBody", () => {
  it("matches an independent HMAC-SHA256 of the raw body", () => {
    const independent = createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(signWebhookBody(SECRET, BODY)).toBe(independent);
  });

  it("matches a known test vector", () => {
    // RFC 4231-style: HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
    expect(
      signWebhookBody("key", "The quick brown fox jumps over the lazy dog"),
    ).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });
});

describe("signatureHeader", () => {
  it("prefixes the digest the way receivers should parse it", () => {
    const digest = signWebhookBody(SECRET, BODY);
    expect(signatureHeader(SECRET, BODY)).toBe(`sha256=${digest}`);
  });
});

describe("verifySignature", () => {
  it("accepts a header produced from the same secret and body", () => {
    const header = signatureHeader(SECRET, BODY);
    expect(verifySignature(SECRET, BODY, header)).toBe(true);
  });

  it("rejects a tampered body or the wrong secret", () => {
    const header = signatureHeader(SECRET, BODY);
    expect(verifySignature(SECRET, BODY.replace("Partial", "Full"), header)).toBe(
      false,
    );
    expect(verifySignature("other-secret", BODY, header)).toBe(false);
  });
});
