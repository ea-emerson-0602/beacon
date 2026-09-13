import { IsEnum, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { ServiceStatus } from "@prisma/client";
import { SERVICE_NAME_MESSAGE, SERVICE_NAME_PATTERN } from "../auth/validation";

export class CreateServiceDto {
  @IsString()
  @Matches(SERVICE_NAME_PATTERN, { message: SERVICE_NAME_MESSAGE })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @Matches(SERVICE_NAME_PATTERN, { message: SERVICE_NAME_MESSAGE })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
