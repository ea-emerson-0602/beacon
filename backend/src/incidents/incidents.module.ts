import { Module } from "@nestjs/common";
import { OrgsService } from "../orgs/orgs.service";
import { WebhooksModule } from "../webhooks/webhooks.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [WebhooksModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, OrgsService],
})
export class IncidentsModule {}
