import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { PipelineState } from '../types/pipeline.types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/pipelines',
})
export class ProgressGateway {
  @WebSocketServer()
  server!: Server;

  emitPipelineSnapshot(snapshot: PipelineState) {
    this.server.emit(`pipeline:${snapshot.id}`, snapshot);
    this.server.emit('pipelines:list', snapshot);
  }

  emitGlobalMetrics(metrics: unknown) {
    this.server.emit('pipelines:metrics', metrics);
  }
}
