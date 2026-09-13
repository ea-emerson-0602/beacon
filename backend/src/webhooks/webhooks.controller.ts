import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CurrentUser, AuthUser } from "../auth/current-user.decorator";
import { WebhooksService } from "./webhooks.service";
import { CreateWebhookDto } from "./webhooks.dto";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.webhooks.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWebhookDto) {
    return this.webhooks.create(user.id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.webhooks.remove(user.id, id);
  }
}
