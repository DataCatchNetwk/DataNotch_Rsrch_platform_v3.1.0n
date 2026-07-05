import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 * Lazy initialization to support Vercel's serverless build process
 * DATABASE_URL is only required when actually connecting to database
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Missing required environment variable: DATABASE_URL. ' +
        'Set DATABASE_URL to a PostgreSQL connection string before starting the API.'
      );
    }
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Export Prisma client as lazy getter
 * Prevents "DATABASE_URL missing" errors during Vercel build process
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop) {
    return getPrismaClient()[prop as keyof PrismaClient];
  },
}) as PrismaClient;

export { getPrismaClient };
