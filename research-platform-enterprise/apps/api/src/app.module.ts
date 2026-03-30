import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { DatasetsModule } from './datasets/datasets.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { QueueModule } from './queue/queue.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    QueueModule,
    WorkersModule,
    DatasetsModule,
    ArtifactsModule,
  ],
})
export class AppModule {}
