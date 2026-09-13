import { createHmac, timingSafeEqual } from "crypto";

export function signWebhookBody(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function signatureHeader(secret: string, body: string) {
  return `sha256=${signWebhookBody(secret, body)}`;
}

/** Constant-time compare so a receiver can verify X-Beacon-Signature. */
export function verifySignature(secret: string, body: string, header: string) {
  const expected = signatureHeader(secret, body);
  const left = Buffer.from(expected);
  const right = Buffer.from(header);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
