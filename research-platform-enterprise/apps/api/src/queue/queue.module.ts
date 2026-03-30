import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [WorkersModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
