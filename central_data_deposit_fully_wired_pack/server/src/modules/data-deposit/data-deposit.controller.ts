import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { DataDepositService } from './data-deposit.service'
import { ListDepositDatasetsDto } from './dto/list-deposit-datasets.dto'
import { PullDepositDatasetDto } from './dto/pull-deposit-dataset.dto'
import { FavoriteDepositDatasetDto } from './dto/favorite-deposit-dataset.dto'

@Controller('api/v1/datasets/deposit')
export class DataDepositController {
  constructor(private readonly dataDepositService: DataDepositService) {}

  @Get()
  // Replace with your auth guard + RBAC decorator.
  list(@Query() query: ListDepositDatasetsDto, @Req() req: any) {
    return this.dataDepositService.list(query, req.user?.id)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.dataDepositService.getById(id)
  }

  @Get(':id/preview')
  preview(@Param('id') id: string, @Req() req: any) {
    return this.dataDepositService.preview(id, req.user?.id)
  }

  @Post(':id/pull')
  pull(@Param('id') id: string, @Body() dto: PullDepositDatasetDto, @Req() req: any) {
    return this.dataDepositService.pull(id, dto, req.user?.id)
  }

  @Post(':id/favorite')
  favorite(@Param('id') id: string, @Body() dto: FavoriteDepositDatasetDto, @Req() req: any) {
    return this.dataDepositService.favorite(id, dto.favorite, req.user?.id)
  }
}
