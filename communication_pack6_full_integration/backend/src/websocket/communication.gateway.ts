import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/communication' })
export class CommunicationGateway {
  @WebSocketServer() server!: Server;
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
  emitAdmin(event: string, payload: unknown) {
    this.server.to('role:ADMIN').emit(event, payload);
  }
}
