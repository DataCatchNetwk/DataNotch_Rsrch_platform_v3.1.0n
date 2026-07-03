import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/communication' })
export class CommunicationGateway {
  @WebSocketServer() server!: Server;

  emitToUsers(emails: string[], event: string, payload: unknown) {
    this.server.emit(event, { recipients: emails, payload });
  }
}
