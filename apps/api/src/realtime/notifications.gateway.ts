import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';
import { resolveAuthenticatedUser } from '../services/authenticated-user.service.js';

let io: Server | null = null;

function getToken(socket: Socket) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
}

export function attachNotificationGateway(server: HttpServer) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGINS,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    void (async () => {
      try {
        const token = getToken(socket);
        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const user = await resolveAuthenticatedUser(verifyToken(token));
        if (!user) {
          return next(new Error('Unauthorized'));
        }

        socket.data.user = user;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    })();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload;
    socket.join(user.id);

    socket.on('join', (payload?: { userId?: string }) => {
      if (payload?.userId && payload.userId !== user.id) {
        return;
      }

      socket.join(user.id);
    });

    socket.on('pipelines:subscribe', (payload?: { runId?: string }) => {
      if (!payload?.runId) {
        return;
      }

      socket.join(`pipeline:${payload.runId}`);
    });

    socket.on('pipelines:unsubscribe', (payload?: { runId?: string }) => {
      if (!payload?.runId) {
        return;
      }

      socket.leave(`pipeline:${payload.runId}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(userId).emit(event, payload);
}

export function emitToPipelineRun(runId: string, payload: unknown) {
  io?.to(`pipeline:${runId}`).emit(`pipeline:${runId}`, payload);
}

export function emitPipelineMetrics(payload: unknown) {
  io?.emit('pipelines:metrics', payload);
}

export function emitSystemMonitoringSnapshot(payload: unknown) {
  io?.emit('system-monitoring:snapshot', payload);
}
