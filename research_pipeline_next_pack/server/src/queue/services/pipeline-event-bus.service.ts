import { Injectable } from '@nestjs/common';
import { PIPELINE_STREAMS } from '../constants/pipeline.constants';
import { RedisService } from '../../redis/redis.service';
import type { PipelineLogEvent } from '../types/pipeline.types';

@Injectable()
export class PipelineEventBusService {
  constructor(private readonly redisService: RedisService) {}

  async publish(event: PipelineLogEvent) {
    const redis = this.redisService.getClient();
    await redis.xadd(
      PIPELINE_STREAMS.EVENTS,
      '*',
      'id',
      event.id,
      'pipelineId',
      event.pipelineId,
      'type',
      event.type,
      'stage',
      event.stage ?? '',
      'message',
      event.message,
      'timestamp',
      event.timestamp,
      'payload',
      JSON.stringify(event.payload ?? {}),
    );
  }
}
