import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const ago = (ms: number) => new Date(Date.now() - ms);

async function main() {
  const passwordHash = await bcrypt.hash("beacon1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@beacon.dev" },
    update: { passwordHash },
    create: {
      email: "demo@beacon.dev",
      name: "Ada Okonkwo",
      passwordHash,
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Cloud", slug: "acme" },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId: org.id },
    },
    update: { role: "OWNER" },
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });

  const serviceSeed = [
    {
      id: "seed-service-api",
      name: "Public API",
      description: "REST endpoints and webhook ingestion",
      status: "OPERATIONAL" as const,
    },
    {
      id: "seed-service-dashboard",
      name: "Dashboard",
      description: "Customer console and reporting",
      status: "DEGRADED" as const,
    },
    {
      id: "seed-service-auth",
      name: "Authentication",
      description: "Sign-in, sessions, and SSO",
      status: "OPERATIONAL" as const,
    },
    {
      id: "seed-service-webhooks",
      name: "Webhook delivery",
      description: "Outbound event delivery with retries",
      status: "OPERATIONAL" as const,
    },
  ];

  for (const service of serviceSeed) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { status: service.status, description: service.description },
      create: { ...service, organizationId: org.id },
    });
  }

  // Spread incidents across the 90-day window so the uptime strip has texture.
  const incidentSeed = [
    {
      id: "seed-incident-latency",
      title: "Elevated API latency in eu-west",
      severity: "MAJOR" as const,
      serviceId: "seed-service-api",
      startedAt: ago(DAY * 61 + HOUR * 3),
      resolvedAt: ago(DAY * 61),
      updates: [
        ["INVESTIGATING", "We are investigating increased p95 latency on list endpoints.", DAY * 61 + HOUR * 3],
        ["IDENTIFIED", "A noisy neighbour on the read replica was identified and isolated.", DAY * 61 + HOUR * 2],
        ["MONITORING", "Latency is back to baseline. Monitoring for 60 minutes.", DAY * 61 + HOUR],
        ["RESOLVED", "Resolved. Replica traffic has been rebalanced.", DAY * 61],
      ],
    },
    {
      id: "seed-incident-signin",
      title: "Sign-in failures for SSO customers",
      severity: "CRITICAL" as const,
      serviceId: "seed-service-auth",
      startedAt: ago(DAY * 34 + HOUR * 5),
      resolvedAt: ago(DAY * 34 + HOUR * 1),
      updates: [
        ["INVESTIGATING", "SAML sign-in is failing for a subset of customers.", DAY * 34 + HOUR * 5],
        ["IDENTIFIED", "An expired signing certificate was rotated incorrectly during a deploy.", DAY * 34 + HOUR * 4],
        ["MONITORING", "The correct certificate is live and sign-ins are succeeding.", DAY * 34 + HOUR * 2],
        ["RESOLVED", "Resolved. We have added an expiry check to the deploy pipeline.", DAY * 34 + HOUR],
      ],
    },
    {
      id: "seed-incident-webhooks",
      title: "Delayed webhook deliveries",
      severity: "MINOR" as const,
      serviceId: "seed-service-webhooks",
      startedAt: ago(DAY * 12 + HOUR * 6),
      resolvedAt: ago(DAY * 12 + HOUR * 2),
      updates: [
        ["INVESTIGATING", "Webhook deliveries are queuing behind a backlog.", DAY * 12 + HOUR * 6],
        ["IDENTIFIED", "A slow customer endpoint was holding worker concurrency.", DAY * 12 + HOUR * 5],
        ["RESOLVED", "Backlog cleared. Per-endpoint timeouts have been tightened.", DAY * 12 + HOUR * 2],
      ],
    },
    {
      id: "seed-incident-exports",
      title: "Partial dashboard timeouts on report exports",
      severity: "MINOR" as const,
      serviceId: "seed-service-dashboard",
      startedAt: ago(HOUR * 3),
      resolvedAt: null,
      updates: [
        ["INVESTIGATING", "Some customers cannot export CSV reports. Live views are unaffected.", HOUR * 3],
        ["IDENTIFIED", "A stuck worker pool is being recycled.", HOUR],
      ],
    },
  ];

  for (const incident of incidentSeed) {
    const updates = incident.updates.map(([status, body, offset]) => ({
      status: status as "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED",
      body: body as string,
      createdAt: ago(offset as number),
      authorId: user.id,
    }));

    const latest = updates[updates.length - 1];

    await prisma.incident.upsert({
      where: { id: incident.id },
      update: {},
      create: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: latest.status,
        startedAt: incident.startedAt,
        resolvedAt: incident.resolvedAt,
        organizationId: org.id,
        serviceId: incident.serviceId,
        updates: { create: updates },
      },
    });
  }

  console.log("");
  console.log("  Seeded Beacon demo data");
  console.log("  ---------------------------------------------");
  console.log("  Sign in:      demo@beacon.dev / beacon1234");
  console.log("  Status page:  http://localhost:3000/s/acme");
  console.log("");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
