import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OrgsService } from "../orgs/orgs.service";
import { CreateServiceDto, UpdateServiceDto } from "./services.dto";

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgs: OrgsService,
  ) {}

  async list(userId: string) {
    const { organizationId } = await this.orgs.forUser(userId);
    return this.prisma.service.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async create(userId: string, dto: CreateServiceDto) {
    const { organizationId } = await this.orgs.forUser(userId);
    return this.prisma.service.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? "",
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    const { organizationId } = await this.orgs.forUser(userId);
    const existing = await this.prisma.service.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException("Service not found");
    }
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }
}
