import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client instance.
 * Lazy initialization to support Vercel's serverless build process.
 * DATABASE_URL is only required when actually connecting to the database.
 *
 * DIRECT_URL is optional — only needed when DATABASE_URL points to a
 * connection pooler. If DIRECT_URL is not set, Prisma uses DATABASE_URL
 * for both pooled queries and migrations.
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Missing required environment variable: DATABASE_URL. ' +
        'Set DATABASE_URL to a PostgreSQL connection string before starting the API.'
      );
    }
    // If DIRECT_URL is not set, fall back to DATABASE_URL so Prisma does not
    // throw "Missing environment variable: DIRECT_URL" at runtime.
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
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
