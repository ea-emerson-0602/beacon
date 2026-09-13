import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) {
      throw new NotFoundException("No organization found for this account");
    }
    return membership;
  }
}
