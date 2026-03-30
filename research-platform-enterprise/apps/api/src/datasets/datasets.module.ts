import { Module } from '@nestjs/common';
import { DatasetUploadsController } from './dataset-uploads.controller';
import { DatasetUploadsService } from './services/dataset-uploads.service';
import { DatasetsController } from './datasets.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [DatasetUploadsController, DatasetsController],
  providers: [DatasetUploadsService],
  exports: [DatasetUploadsService],
})
export class DatasetsModule {}
