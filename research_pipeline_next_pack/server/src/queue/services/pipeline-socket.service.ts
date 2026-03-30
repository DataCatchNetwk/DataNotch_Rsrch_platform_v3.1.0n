import { Injectable } from '@nestjs/common';
import { ProgressGateway } from '../transports/progress.gateway';
import type { PipelineState } from '../types/pipeline.types';

@Injectable()
export class PipelineSocketService {
  constructor(private readonly gateway: ProgressGateway) {}

  emitPipelineSnapshot(snapshot: PipelineState) {
    this.gateway.emitPipelineSnapshot(snapshot);
  }

  emitGlobalMetrics(payload: unknown) {
    this.gateway.emitGlobalMetrics(payload);
  }
}
