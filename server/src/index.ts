import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { attachNotificationGateway } from './realtime/notifications.gateway.js';

const app = createApp();
const server = createServer(app);

async function bootstrap() {
  await prisma.$connect();
  attachNotificationGateway(server);
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`API running on http://0.0.0.0:${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
