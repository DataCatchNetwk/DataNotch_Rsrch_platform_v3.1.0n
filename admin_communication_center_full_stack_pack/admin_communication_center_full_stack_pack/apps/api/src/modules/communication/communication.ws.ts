import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const clients = new Set<WebSocket>();

export function attachCommunicationWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/admin/communication' });

  wss.on('connection', (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify({ type: 'socket.connected', payload: { message: 'Connected to communication live updates.' } }));
    socket.on('close', () => clients.delete(socket));
  });

  return wss;
}

export function broadcastCommunicationEvent(event: unknown) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}
