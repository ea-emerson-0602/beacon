import { Module } from "@nestjs/common";
import { OrgsService } from "../orgs/orgs.service";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, OrgsService],
  exports: [OrgsService],
})
export class ServicesModule {}
