import { ArrayNotEmpty, IsArray, IsIn, IsString, IsUrl, MaxLength } from "class-validator";

const WEBHOOK_EVENTS = [
  "incident.created",
  "incident.updated",
  "incident.resolved",
] as const;

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn([...WEBHOOK_EVENTS], { each: true })
  events!: string[];
}
