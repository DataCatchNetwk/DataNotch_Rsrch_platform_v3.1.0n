import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { attachNotificationGateway } from './realtime/notifications.gateway.js';
import { attachCommunicationGateway } from './realtime/communication.gateway.js';
import { systemMonitoringRealtimeService } from './modules/system-monitoring-realtime/system-monitoring-realtime.module.js';

const app = createApp();
const server = createServer(app);

const PORT = Number(process.env.PORT || 3001);
if (!Number.isInteger(PORT) || PORT < 0 || PORT >= 65536) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}


async function bootstrap() {
  await prisma.$connect();
  attachNotificationGateway(server);
  attachCommunicationGateway(server);
  systemMonitoringRealtimeService.startBroadcastLoop();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`API running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});

