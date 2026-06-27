import { QueueEvents } from 'bullmq';
import { RESEARCH_QUEUES } from '../pipelines/queue.constants.js';
import { getRedisConnection, isRedisReachable } from './queue.factory.js';

let queueEventsRegistry: Record<string, QueueEvents> | null = null;

function buildDedicatedConnection() {
  const connection = getRedisConnection();
  return {
    ...connection,
  };
}

export function getQueueEventsRegistry() {
  if (!queueEventsRegistry) {
    queueEventsRegistry = Object.values(RESEARCH_QUEUES).reduce<Record<string, QueueEvents>>((entries, queueName) => {
      entries[queueName] = new QueueEvents(queueName, {
        connection: buildDedicatedConnection(),
      });
      return entries;
    }, {});
  }

  return queueEventsRegistry;
}

export async function startQueueEvents() {
  const redisAvailable = await isRedisReachable();
  if (!redisAvailable) {
    console.warn('QueueEvents disabled: QUEUE_BACKEND=postgres. Realtime queue history uses PostgreSQL fallback.');
    return {};
  }

  const registry = getQueueEventsRegistry();
  await Promise.all(Object.values(registry).map((events) => events.waitUntilReady()));

  for (const queueEvents of Object.values(registry)) {
    queueEvents.on('error', (error) => {
      console.error(`QueueEvents error on ${queueEvents.name}`, error);
    });
  }

  return registry;
}
