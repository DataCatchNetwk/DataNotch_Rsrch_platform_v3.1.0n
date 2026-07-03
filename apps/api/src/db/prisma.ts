import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL. Set DATABASE_URL to a PostgreSQL connection string before starting the API.');
}

export const prisma = new PrismaClient();
