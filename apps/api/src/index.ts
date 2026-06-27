import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { attachNotificationGateway } from './realtime/notifications.gateway.js';
import { attachCommunicationGateway } from './realtime/communication.gateway.js';
import { systemMonitoringRealtimeService } from './modules/system-monitoring-realtime/system-monitoring-realtime.module.js';

const app = createApp();
const server = createServer(app);

async function bootstrap() {
  await prisma.$connect();
  attachNotificationGateway(server);
  attachCommunicationGateway(server);
  systemMonitoringRealtimeService.startBroadcastLoop();
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`API running on http://0.0.0.0:${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
