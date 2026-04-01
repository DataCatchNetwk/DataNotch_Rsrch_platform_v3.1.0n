import { Body, Controller, Delete, Get, Param, Post, Query, Req } from "@nestjs/common";
import { DataDepositService } from "./data-deposit.service";
import { ListDepositDatasetsDto } from "./dto/list-deposit-datasets.dto";
import { PullDatasetDto } from "./dto/pull-dataset.dto";

@Controller("api/v1/datasets/deposit")
export class DataDepositController {
  constructor(private readonly service: DataDepositService) {}

  @Get("public")
  listPublic(@Query() query: ListDepositDatasetsDto, @Req() req: any) {
    return this.service.listPublic(query, req.user?.id);
  }

  @Get(":id")
  getById(@Param("id") id: string, @Req() req: any) {
    return this.service.getById(id, req.user?.id);
  }

  @Get(":id/preview")
  preview(@Param("id") id: string, @Req() req: any) {
    return this.service.preview(id, req.user?.id);
  }

  @Post(":id/pull")
  pull(@Param("id") id: string, @Body() dto: PullDatasetDto, @Req() req: any) {
    return this.service.pull(id, dto, req.user.id);
  }

  @Post(":id/favorite")
  favorite(@Param("id") id: string, @Req() req: any) {
    return this.service.favorite(id, req.user.id);
  }

  @Delete(":id/favorite")
  unfavorite(@Param("id") id: string, @Req() req: any) {
    return this.service.unfavorite(id, req.user.id);
  }
}
