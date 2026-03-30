// Bull Board bootstrap snippet for Express-based admin queue ops.
// Packages:
// pnpm add @bull-board/api @bull-board/express

import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import type { Express } from 'express';
import { getQueueRegistry } from '../server/src/workers/queue.factory.js';

export function attachBullBoard(app: Express) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = Object.values(getQueueRegistry()).map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues,
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
}
