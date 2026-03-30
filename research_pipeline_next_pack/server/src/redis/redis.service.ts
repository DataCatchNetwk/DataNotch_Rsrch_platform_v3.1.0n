import { Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: IORedis;
  private readonly subscriber: IORedis;

  constructor() {
    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    const db = Number(process.env.REDIS_DB ?? 0);

    this.client = new IORedis({ host, port, db, maxRetriesPerRequest: null });
    this.subscriber = new IORedis({ host, port, db, maxRetriesPerRequest: null });
  }

  getClient(): IORedis {
    return this.client;
  }

  getSubscriber(): IORedis {
    return this.subscriber;
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.client.quit(), this.subscriber.quit()]);
  }
}
