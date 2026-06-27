import type { Queue } from 'bullmq';
import { RESEARCH_QUEUES } from '../pipelines/queue.constants.js';
import { getQueueRegistry, isRedisReachable } from './queue.factory.js';

type QueueCounts = {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
};

type QueueRecommendation = {
  queue: string;
  waiting: number;
  active: number;
  desiredReplicas: number;
  maxSuggestedReplicas: number;
  reason: string;
};

type AutoscalingRecommendation = {
  generatedAt: string;
  targetJobsPerReplica: number;
  minReplicas: number;
  maxReplicas: number;
  queues: QueueRecommendation[];
};

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function bound(value: number, minValue: number, maxValue: number) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function computeDesiredReplicas(counts: QueueCounts, targetJobsPerReplica: number, minReplicas: number, maxReplicas: number) {
  const load = counts.waiting + counts.active;
  const desired = load <= 0 ? minReplicas : Math.ceil(load / Math.max(1, targetJobsPerReplica));
  return bound(desired, minReplicas, maxReplicas);
}

function buildReason(counts: QueueCounts, desiredReplicas: number, minReplicas: number) {
  if (counts.waiting > 0) {
    return `Backlog detected (${counts.waiting} waiting jobs), scale up to ${desiredReplicas}.`;
  }

  if (counts.active > 0) {
    return `Active workload (${counts.active} jobs), keep at ${desiredReplicas}.`;
  }

  if (desiredReplicas <= minReplicas) {
    return 'No active load, keep minimum replica floor.';
  }

  return `Low pressure, reduce toward ${desiredReplicas}.`;
}

export class AutoscalingRecommendationService {
  private queues?: Record<string, Queue>;

  constructor(queues?: Record<string, Queue>) {
    this.queues = queues;
  }

  async recommend(): Promise<AutoscalingRecommendation> {
    const targetJobsPerReplica = toInt(process.env.AUTOSCALE_TARGET_JOBS_PER_REPLICA, 8);
    const minReplicas = toInt(process.env.AUTOSCALE_MIN_REPLICAS, 1);
    const maxReplicas = toInt(process.env.AUTOSCALE_MAX_REPLICAS, 24);
    const queueNames = Object.values(RESEARCH_QUEUES);

    const redisAvailable = await isRedisReachable();
    if (!redisAvailable) {
      return {
        generatedAt: new Date().toISOString(),
        targetJobsPerReplica,
        minReplicas,
        maxReplicas,
        queues: queueNames.map((queueName) => ({
          queue: queueName,
          waiting: 0,
          active: 0,
          desiredReplicas: minReplicas,
          maxSuggestedReplicas: maxReplicas,
          reason: 'Queue backend unavailable. Showing PostgreSQL-backed pipeline history only.',
        })),
      };
    }

    const queues = Object.values(this.getQueues());
    const queueRecommendations = await Promise.all(
      queues.map(async (queue) => {
        try {
          const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
          const normalizedCounts: QueueCounts = {
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            delayed: counts.delayed ?? 0,
            failed: counts.failed ?? 0,
            completed: counts.completed ?? 0,
          };

          const desiredReplicas = computeDesiredReplicas(normalizedCounts, targetJobsPerReplica, minReplicas, maxReplicas);

          return {
            queue: queue.name,
            waiting: normalizedCounts.waiting,
            active: normalizedCounts.active,
            desiredReplicas,
            maxSuggestedReplicas: maxReplicas,
            reason: buildReason(normalizedCounts, desiredReplicas, minReplicas),
          } satisfies QueueRecommendation;
        } catch {
          return {
            queue: queue.name,
            waiting: 0,
            active: 0,
            desiredReplicas: minReplicas,
            maxSuggestedReplicas: maxReplicas,
            reason: 'Queue backend unavailable. Showing PostgreSQL-backed pipeline history only.',
          } satisfies QueueRecommendation;
        }
      }),
    );

    return {
      generatedAt: new Date().toISOString(),
      targetJobsPerReplica,
      minReplicas,
      maxReplicas,
      queues: queueRecommendations,
    };
  }

  private getQueues() {
    if (!this.queues) {
      this.queues = getQueueRegistry();
    }

    return this.queues;
  }
}
