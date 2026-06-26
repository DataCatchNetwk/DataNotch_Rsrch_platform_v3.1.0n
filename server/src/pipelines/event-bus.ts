import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { PIPELINE_STREAMS } from './queue.constants.js';
import { getRedisConnection, isRedisReachable } from '../workers/queue.factory.js';

type PipelineStreamEvent = {
  id: string;
  pipelineRunId: string;
  eventType: string;
  level: string;
  message: string;
  stepOrder?: number;
  createdAt: Date;
  dataJson?: unknown;
};

let redisClient: Redis | null = null;

async function getRedisClient() {
  const redisAvailable = await isRedisReachable();
  if (!redisAvailable) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(getRedisConnection());
  }

  return redisClient;
}

export async function publishPipelineStreamEvent(event: PipelineStreamEvent) {
  try {
    const redis = await getRedisClient();
    if (!redis) {
      return;
    }

    const streamKey = env.PIPELINE_EVENT_STREAM_KEY || PIPELINE_STREAMS.EVENTS;
    await redis.xadd(
      streamKey,
      'MAXLEN',
      '~',
      '10000',
      '*',
      'id',
      event.id,
      'pipelineRunId',
      event.pipelineRunId,
      'eventType',
      event.eventType,
      'level',
      event.level,
      'message',
      event.message,
      'stepOrder',
      event.stepOrder?.toString() ?? '',
      'createdAt',
      event.createdAt.toISOString(),
      'data',
      JSON.stringify(event.dataJson ?? {}),
    );
  } catch (error) {
    console.warn('Failed to publish pipeline event to optional Redis stream', error);
  }
}

type PipelineStreamTailEvent = {
  streamId: string;
  id: string;
  pipelineRunId: string;
  eventType: string;
  level: string;
  message: string;
  stepOrder?: number;
  createdAt: string;
  dataJson?: unknown;
};

function entryToObject(entry: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < entry.length; index += 2) {
    const key = entry[index];
    const value = entry[index + 1] ?? '';
    result[key] = value;
  }

  return result;
}

export async function tailPipelineStreamEvents(runId: string, count = 50): Promise<PipelineStreamTailEvent[]> {
  const redis = await getRedisClient();
  if (!redis) {
    throw new Error('PostgreSQL event stream fallback active');
  }

  const streamKey = env.PIPELINE_EVENT_STREAM_KEY || PIPELINE_STREAMS.EVENTS;
  const safeCount = Math.max(1, Math.min(500, Math.floor(count)));
  const entries = await redis.xrevrange(streamKey, '+', '-', 'COUNT', safeCount * 3);

  const filtered = entries
    .map(([streamId, values]) => {
      const event = entryToObject(values);
      let parsedData: unknown;
      if (event.data) {
        try {
          parsedData = JSON.parse(event.data);
        } catch {
          parsedData = { raw: event.data };
        }
      }

      return {
        streamId,
        id: event.id,
        pipelineRunId: event.pipelineRunId,
        eventType: event.eventType,
        level: event.level,
        message: event.message,
        stepOrder: event.stepOrder ? Number(event.stepOrder) : undefined,
        createdAt: event.createdAt,
        dataJson: parsedData,
      } as PipelineStreamTailEvent;
    })
    .filter((event) => event.pipelineRunId === runId)
    .slice(0, safeCount)
    .reverse();

  return filtered;
}
