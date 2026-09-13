import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrgsService } from "../orgs/orgs.service";
import { WebhooksService } from "../webhooks/webhooks.service";
import { AddUpdateDto, CreateIncidentDto } from "./incidents.dto";
import { nextResolvedAt, webhookEventForStatus } from "./resolved-at";

const include = {
  service: true,
  updates: {
    orderBy: { createdAt: "asc" as const },
    // No email here: this payload is also what gets sent to webhook receivers.
    include: { author: { select: { id: true, name: true } } },
  },
};

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgs: OrgsService,
    private readonly webhooks: WebhooksService,
  ) {}

  async list(userId: string) {
    const { organizationId } = await this.orgs.forUser(userId);
    return this.prisma.incident.findMany({
      where: { organizationId },
      include,
      orderBy: { startedAt: "desc" },
    });
  }

  async create(userId: string, dto: CreateIncidentDto) {
    const { organizationId } = await this.orgs.forUser(userId);
    const incident = await this.prisma.incident.create({
      data: {
        organizationId,
        title: dto.title,
        severity: dto.severity ?? "MAJOR",
        serviceId: dto.serviceId || null,
        updates: {
          create: {
            body: dto.body ?? "We are investigating this issue.",
            status: "INVESTIGATING",
            authorId: userId,
          },
        },
      },
      include,
    });
    await this.webhooks.enqueue(organizationId, "incident.created", incident);
    return incident;
  }

  async addUpdate(userId: string, id: string, dto: AddUpdateDto) {
    const { organizationId } = await this.orgs.forUser(userId);
    const existing = await this.prisma.incident.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException("Incident not found");
    }

    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: nextResolvedAt(dto.status, existing.resolvedAt),
        updates: {
          create: {
            body: dto.body,
            status: dto.status,
            authorId: userId,
          },
        },
      },
      include,
    });

    await this.webhooks.enqueue(
      organizationId,
      webhookEventForStatus(dto.status),
      incident,
    );
    return incident;
  }
}
