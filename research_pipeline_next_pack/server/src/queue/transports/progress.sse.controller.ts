import { Controller, MessageEvent, Param, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { PipelineStateService } from '../services/pipeline-state.service';

@Controller('api/pipelines/stream')
export class ProgressSseController {
  constructor(private readonly pipelineState: PipelineStateService) {}

  @Sse(':pipelineId')
  streamPipeline(@Param('pipelineId') pipelineId: string): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => ({
        data: this.pipelineState.getPipeline(pipelineId),
      })),
    );
  }
}
