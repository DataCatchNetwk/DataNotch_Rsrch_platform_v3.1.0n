import { createConnection } from 'node:net';
import { Queue, type JobsOptions } from 'bullmq';
import { env } from '../config/env.js';
import { RESEARCH_QUEUES } from '../pipelines/queue.constants.js';

type RedisConnectionOptions = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  maxRetriesPerRequest: null;
  enableReadyCheck: false;
  tls?: Record<string, never>;
};

let redisConnection: RedisConnectionOptions | null = null;
let queueRegistry: Record<string, Queue> | null = null;
let redisReachabilityCache: { reachable: boolean; checkedAt: number } | null = null;

export function getRedisConnection() {
  if (!redisConnection) {
    const url = new URL(env.REDIS_URL);
    redisConnection = {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    };
  }

  return redisConnection;
}

export async function isRedisReachable(timeoutMs = 750) {
  const now = Date.now();
  if (redisReachabilityCache && now - redisReachabilityCache.checkedAt < 5000) {
    return redisReachabilityCache.reachable;
  }

  const connection = getRedisConnection();

  const reachable = await new Promise<boolean>((resolve) => {
    let settled = false;
    const socket = createConnection({ host: connection.host, port: connection.port });

    const finish = (value: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

  redisReachabilityCache = { reachable, checkedAt: now };
  return reachable;
}

export function getQueueRegistry() {
  if (!queueRegistry) {
    const connection = getRedisConnection();
    queueRegistry = Object.values(RESEARCH_QUEUES).reduce<Record<string, Queue>>((queues, queueName) => {
      queues[queueName] = new Queue(queueName, { connection, defaultJobOptions: defaultJobOptions });
      return queues;
    }, {});
  }

  return queueRegistry;
}

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 1000,
  removeOnFail: 1000,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
};