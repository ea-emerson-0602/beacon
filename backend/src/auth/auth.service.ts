import { createHash, randomBytes } from "crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "./auth.dto";
import { MailerService } from "./mailer.service";

const RESET_TTL_MS = 60 * 60 * 1000;

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return base || "org";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException("An account with that email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    let slug = slugify(dto.organizationName);
    const taken = await this.prisma.organization.findUnique({ where: { slug } });
    if (taken) {
      slug = `${slug}-${randomBytes(2).toString("hex")}`;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name.trim(),
        passwordHash,
        memberships: {
          create: {
            role: "OWNER",
            organization: {
              create: {
                name: dto.organizationName.trim(),
                slug,
              },
            },
          },
        },
      },
    });

    return this.issue(user.id, user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issue(user.id, user.email, user.name);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const generic = { ok: true as const };

    if (!user) {
      return generic;
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const origin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${token}`;

    try {
      await this.mailer.sendPasswordReset(user.email, resetUrl);
    } catch (error) {
      this.log.warn(
        `Could not send reset email: ${(error as Error).message}`,
      );
    }

    if (!this.mailer.isConfigured() && process.env.NODE_ENV !== "production") {
      return { ...generic, devResetUrl: resetUrl };
    }

    return generic;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      if (record) {
        await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      }
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return { ok: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        "New password must be different from the current password",
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
    ]);

    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const membership = user.memberships[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organization: membership
        ? {
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            role: membership.role,
          }
        : null,
    };
  }

  private issue(id: string, email: string, name: string) {
    const token = this.jwt.sign({ sub: id, email });
    return { token, user: { id, email, name } };
  }
}
