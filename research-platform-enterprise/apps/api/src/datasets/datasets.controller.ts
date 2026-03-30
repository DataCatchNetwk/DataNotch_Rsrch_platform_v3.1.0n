import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('datasets')
export class DatasetsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':datasetId')
  async getOne(@Param('datasetId') datasetId: string, @Req() req: any) {
    return this.prisma.dataset.findUnique({
      where: { id: datasetId },
      include: {
        jobs: { orderBy: { createdAt: 'desc' } },
        artifacts: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
}
