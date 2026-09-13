import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { IncidentSeverity, IncidentStatus } from "@prisma/client";
import {
  INCIDENT_TITLE_MESSAGE,
  INCIDENT_TITLE_PATTERN,
} from "../auth/validation";

export class CreateIncidentDto {
  @IsString()
  @Matches(INCIDENT_TITLE_PATTERN, { message: INCIDENT_TITLE_MESSAGE })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  serviceId?: string;
}

export class AddUpdateDto {
  @IsString()
  @MaxLength(2000)
  @Matches(/^[^\x00-\x1F]{4,2000}$/, {
    message: "Update must be 4–2000 characters with no control characters",
  })
  body!: string;

  @IsEnum(IncidentStatus)
  status!: IncidentStatus;
}
