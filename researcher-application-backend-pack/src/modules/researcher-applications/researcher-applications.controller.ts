import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CreateResearcherApplicationDto } from './dto/create-researcher-application.dto';
import { QueryResearcherApplicationsDto } from './dto/query-researcher-applications.dto';
import { RequestMoreInfoDto } from './dto/request-more-info.dto';
import { ReviewResearcherApplicationDto } from './dto/review-researcher-application.dto';
import { ResearcherApplicationsService } from './researcher-applications.service';

@ApiTags('Researcher Applications')
@Controller('api/v1')
export class ResearcherApplicationsController {
  constructor(
    private readonly researcherApplicationsService: ResearcherApplicationsService,
  ) {}

  @Post('auth/register-researcher-application')
  @ApiOperation({ summary: 'Submit researcher application for pending approval' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Researcher application payload with optional files',
    type: CreateResearcherApplicationDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cvFile', maxCount: 1 },
        { name: 'affiliationProofFile', maxCount: 1 },
        { name: 'irbDocumentFile', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 8 * 1024 * 1024,
          files: 3,
        },
      },
    ),
  )
  async create(
    @Body() dto: CreateResearcherApplicationDto,
    @UploadedFiles()
    files: {
      cvFile?: Express.Multer.File[];
      affiliationProofFile?: Express.Multer.File[];
      irbDocumentFile?: Express.Multer.File[];
    },
  ) {
    return this.researcherApplicationsService.createApplication(dto, files);
  }

  // Add your auth guard + role guard here.
  @Get('admin/researcher-applications')
  @ApiOperation({ summary: 'List researcher applications for admin review queue' })
  async list(@Query() query: QueryResearcherApplicationsDto) {
    return this.researcherApplicationsService.listForAdmin(query);
  }

  // Add your auth guard + role guard here.
  @Get('admin/researcher-applications/:id')
  @ApiOperation({ summary: 'Get researcher application detail for admin review' })
  async detail(@Param('id') id: string) {
    return this.researcherApplicationsService.getAdminDetail(id);
  }

  // Add your auth guard + role guard here.
  @Patch('admin/researcher-applications/:id/review')
  @ApiOperation({ summary: 'Approve or reject a researcher application' })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewResearcherApplicationDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.researcherApplicationsService.reviewApplication(
      id,
      dto,
      req.user?.id ?? 'system-admin',
    );
  }

  // Add your auth guard + role guard here.
  @Patch('admin/researcher-applications/:id/request-more-info')
  @ApiOperation({ summary: 'Request more information from applicant' })
  async requestMoreInfo(
    @Param('id') id: string,
    @Body() dto: RequestMoreInfoDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.researcherApplicationsService.requestMoreInfo(
      id,
      dto,
      req.user?.id ?? 'system-admin',
    );
  }
}
