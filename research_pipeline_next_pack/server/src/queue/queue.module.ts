import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { PipelineStateService } from './services/pipeline-state.service';
import { PipelineEventBusService } from './services/pipeline-event-bus.service';
import { PipelineOrchestratorService } from './services/pipeline-orchestrator.service';
import { PipelineSocketService } from './services/pipeline-socket.service';
import { PipelineWorker } from './workers/pipeline.worker';
import { ProgressGateway } from './transports/progress.gateway';
import { ProgressSseController } from './transports/progress.sse.controller';
import { PipelineController } from './controllers/pipeline.controller';

@Module({
  imports: [RedisModule],
  providers: [
    PipelineStateService,
    PipelineEventBusService,
    PipelineOrchestratorService,
    PipelineSocketService,
    PipelineWorker,
    ProgressGateway,
  ],
  controllers: [PipelineController, ProgressSseController],
  exports: [PipelineOrchestratorService],
})
export class QueueModule {}
