import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.readToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(
        token,
      );
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException();
      }
      (request as Request & { user: { id: string; email: string; name: string } }).user =
        {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private readToken(request: Request) {
    const cookie = (request as Request & { cookies?: Record<string, string> })
      .cookies?.beacon_token;
    if (cookie) {
      return cookie;
    }
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice(7);
    }
    return null;
  }
}
