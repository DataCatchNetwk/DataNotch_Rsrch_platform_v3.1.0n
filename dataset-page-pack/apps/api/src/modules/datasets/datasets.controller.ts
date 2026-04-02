import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { DatasetsService } from './datasets.service'
import { ListDatasetsDto } from './dto/list-datasets.dto'
import { PullDatasetDto } from './dto/pull-dataset.dto'

@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListDatasetsDto) {
    return this.datasetsService.list(req.user.id, query)
  }

  @Post(':datasetId/favorite')
  toggleFavorite(@Req() req: any, @Param('datasetId') datasetId: string) {
    return this.datasetsService.toggleFavorite(req.user.id, datasetId)
  }

  @Post(':datasetId/pull')
  pull(@Req() req: any, @Param('datasetId') datasetId: string, @Body() body: PullDatasetDto) {
    return this.datasetsService.pullToWorkspace(req.user.id, datasetId, body)
  }
}
