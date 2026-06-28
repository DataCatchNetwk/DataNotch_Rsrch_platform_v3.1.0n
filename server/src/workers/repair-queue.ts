import { prisma } from '../db/prisma.js';
import { repairMissingWorkerJobs } from './queue-repair.js';

try {
  await prisma.$connect();
  const result = await repairMissingWorkerJobs(prisma);
  console.log(
    `Queue repair complete: inspected=${result.inspectedRuns}, repaired=${result.repairedRuns}, skipped=${result.skippedRuns}`,
  );
} finally {
  await prisma.$disconnect();
}
