import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { attachNotificationGateway } from './realtime/notifications.gateway.js';
import { attachCommunicationGateway } from './realtime/communication.gateway.js';
import { systemMonitoringRealtimeService } from './modules/system-monitoring-realtime/system-monitoring-realtime.module.js';

const app = createApp();
const server = createServer(app);
const HOST = '0.0.0.0';
const MAX_PORT_ATTEMPTS = 10;

async function listenWithPortFallback(startPort: number, maxAttempts: number): Promise<number> {
  let port = startPort;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onListening = () => {
          server.off('error', onError);
          resolve();
        };

        const onError = (error: NodeJS.ErrnoException) => {
          server.off('listening', onListening);
          reject(error);
        };

        server.once('listening', onListening);
        server.once('error', onError);
        server.listen(port, HOST);
      });

      return port;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EADDRINUSE' || attempt === maxAttempts - 1) {
        throw err;
      }

      console.warn(`Port ${port} is in use. Retrying on ${port + 1}...`);
      port += 1;
    }
  }

  throw new Error('Unable to bind API server to an available port');
}

async function bootstrap() {
  await prisma.$connect();
  attachNotificationGateway(server);
  attachCommunicationGateway(server);
  systemMonitoringRealtimeService.startBroadcastLoop();
  console.log(
    `Port bind mode: ${env.PORT_FALLBACK_ENABLED ? 'auto-fallback' : 'fail-fast'} (start port ${env.PORT})`
  );
  const maxAttempts = env.PORT_FALLBACK_ENABLED ? MAX_PORT_ATTEMPTS : 1;
  const port = await listenWithPortFallback(env.PORT, maxAttempts);
  console.log(`API running on http://${HOST}:${port}`);
}

bootstrap().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
