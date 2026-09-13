import { Module } from "@nestjs/common";
import { OrgsService } from "../orgs/orgs.service";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, OrgsService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
