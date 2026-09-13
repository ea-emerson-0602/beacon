import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  HISTORY_DAYS,
  DAY_MS,
  buildHistory,
  overallStatus,
  uptimePercentage,
} from "./uptime";

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async bySlug(slug: string) {
    const windowStart = new Date(Date.now() - HISTORY_DAYS * DAY_MS);

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        services: { orderBy: { name: "asc" } },
        incidents: {
          where: {
            OR: [{ resolvedAt: null }, { resolvedAt: { gte: windowStart } }],
          },
          include: {
            service: { select: { id: true, name: true } },
            updates: {
              orderBy: { createdAt: "desc" },
              include: { author: { select: { id: true, name: true } } },
            },
          },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!org) {
      throw new NotFoundException("Status page not found");
    }

    const services = org.services.map((service) => {
      const related = org.incidents.filter(
        (incident) => incident.serviceId === service.id,
      );
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        status: service.status,
        history: buildHistory(related),
        uptime: uptimePercentage(related),
      };
    });

    return {
      name: org.name,
      slug: org.slug,
      status: overallStatus(org.services.map((service) => service.status)),
      updatedAt: new Date().toISOString(),
      historyDays: HISTORY_DAYS,
      services,
      activeIncidents: org.incidents.filter(
        (incident) => incident.status !== "RESOLVED",
      ),
      pastIncidents: org.incidents.filter(
        (incident) => incident.status === "RESOLVED",
      ),
    };
  }
}
