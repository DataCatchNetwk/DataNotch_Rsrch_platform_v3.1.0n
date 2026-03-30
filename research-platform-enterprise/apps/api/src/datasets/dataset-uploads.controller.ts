import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatasetUploadsService } from './services/dataset-uploads.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { RequestPartUrlDto } from './dto/request-part-url.dto';
import { CompletePartDto } from './dto/complete-part.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@UseGuards(JwtAuthGuard)
@Controller('datasets/:datasetId/uploads')
export class DatasetUploadsController {
  constructor(private readonly service: DatasetUploadsService) {}

  @Post('initiate')
  initiate(@Param('datasetId') datasetId: string, @Req() req: any, @Body() dto: InitiateUploadDto) {
    return this.service.initiate(datasetId, req.user.sub, dto);
  }

  @Post(':uploadId/parts/url')
  partUrl(@Param('datasetId') datasetId: string, @Param('uploadId') uploadId: string, @Req() req: any, @Body() dto: RequestPartUrlDto) {
    return this.service.getPartUrl(datasetId, uploadId, req.user.sub, dto);
  }

  @Post(':uploadId/parts/complete')
  completePart(@Param('datasetId') datasetId: string, @Param('uploadId') uploadId: string, @Req() req: any, @Body() dto: CompletePartDto) {
    return this.service.markPartComplete(datasetId, uploadId, req.user.sub, dto);
  }

  @Post(':uploadId/complete')
  completeUpload(@Param('datasetId') datasetId: string, @Param('uploadId') uploadId: string, @Req() req: any, @Body() dto: CompleteUploadDto) {
    return this.service.complete(datasetId, uploadId, req.user.sub, dto);
  }

  @Post(':uploadId/abort')
  abort(@Param('datasetId') datasetId: string, @Param('uploadId') uploadId: string, @Req() req: any) {
    return this.service.abort(datasetId, uploadId, req.user.sub);
  }
}
