import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";
import {
  NAME_MESSAGE,
  NAME_PATTERN,
  ORGANIZATION_MESSAGE,
  ORGANIZATION_PATTERN,
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
} from "./validation";

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  name!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsString()
  @Matches(ORGANIZATION_PATTERN, { message: ORGANIZATION_MESSAGE })
  organizationName!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: "Reset token is invalid" })
  token!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}
