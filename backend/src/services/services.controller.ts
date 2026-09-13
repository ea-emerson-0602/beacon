import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser, AuthUser } from "../auth/current-user.decorator";
import { ServicesService } from "./services.service";
import { CreateServiceDto, UpdateServiceDto } from "./services.dto";

@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.services.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.services.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(user.id, id, dto);
  }
}
