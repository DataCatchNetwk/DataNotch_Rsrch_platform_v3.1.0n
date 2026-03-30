import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  async handleConnection(client: Socket) {
    this.logger.debug(`Notifications client connected: ${client.id}`);
  }

  async joinUserRoom(client: Socket, userId: string) {
    await client.join(`user:${userId}`);
  }

  emitCreated(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification.created', payload);
  }

  emitRead(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification.read', payload);
  }

  emitDeleted(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification.deleted', payload);
  }

  emitUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification.unread_count', { count });
  }

  @SubscribeMessage('notifications.join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId: string },
  ) {
    if (!body?.userId) return { ok: false };
    await this.joinUserRoom(client, body.userId);
    return { ok: true };
  }
}
