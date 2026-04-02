import { Module } from '@nestjs/common'
import { DatasetsController } from './datasets.controller'
import { DatasetsService } from './datasets.service'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  controllers: [DatasetsController],
  providers: [DatasetsService, PrismaService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
