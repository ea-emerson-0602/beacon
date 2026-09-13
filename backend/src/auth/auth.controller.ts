import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "./auth.dto";
import { CurrentUser } from "./current-user.decorator";
import type { AuthUser } from "./current-user.decorator";
import { Public } from "./public.decorator";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);
    this.setCookie(res, result.token);
    return this.auth.me(result.user.id);
  }

  @Public()
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);
    this.setCookie(res, result.token);
    return this.auth.me(result.user.id);
  }

  @Public()
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post("change-password")
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(user.id, dto);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("beacon_token", cookieOptions());
    return { ok: true };
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  private setCookie(res: Response, token: string) {
    res.cookie("beacon_token", token, {
      ...cookieOptions(),
      maxAge: WEEK_MS,
    });
  }
}

/**
 * Lax is enough on localhost. Across Vercel + Render (different sites)
 * Chrome will not send the session cookie unless it is SameSite=None; Secure.
 */
const cookieOptions = () => {
  const secure = process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    path: "/",
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
  };
};
