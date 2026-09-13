import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { PublicService } from "./public.service";

@Controller("public")
export class PublicController {
  constructor(private readonly pages: PublicService) {}

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.pages.bySlug(slug);
  }
}
