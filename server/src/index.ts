import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';

const app = createApp();

async function bootstrap() {
  await prisma.$connect();
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`API running on http://0.0.0.0:${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
