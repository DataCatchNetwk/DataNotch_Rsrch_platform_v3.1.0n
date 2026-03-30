import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArtifactsService } from './artifacts.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ArtifactsController {
  constructor(private readonly service: ArtifactsService) {}

  @Get('datasets/:datasetId/artifacts')
  list(@Param('datasetId') datasetId: string, @Req() req: any) {
    return this.service.listForDataset(datasetId, req.user.sub);
  }

  @Get('artifacts/:artifactId/download')
  download(@Param('artifactId') artifactId: string, @Req() req: any) {
    return this.service.getDownloadUrl(artifactId, req.user.sub);
  }
}
