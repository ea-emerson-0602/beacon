import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser, AuthUser } from "../auth/current-user.decorator";
import { IncidentsService } from "./incidents.service";
import { AddUpdateDto, CreateIncidentDto } from "./incidents.dto";

@Controller("incidents")
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.incidents.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIncidentDto) {
    return this.incidents.create(user.id, dto);
  }

  @Post(":id/updates")
  addUpdate(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddUpdateDto,
  ) {
    return this.incidents.addUpdate(user.id, id, dto);
  }
}
