import { Server } from 'socket.io';
let io: Server | null = null;
export function attachRealtime(server: any) {
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', socket => {
    socket.on('join-user', (userId: string) => socket.join(`user:${userId}`));
    socket.on('join-thread', (threadId: string) => socket.join(`thread:${threadId}`));
    socket.on('join-room', (roomId: string) => socket.join(`room:${roomId}`));
    socket.on('rzooma-signal', payload => socket.to(`room:${payload.roomId}`).emit('rzooma-signal', payload));
    socket.on('collab-board', payload => socket.to(`room:${payload.roomId}`).emit('collab-board', payload));
  });
}
export function emitToUser(userId: string, event: string, payload: unknown) { io?.to(`user:${userId}`).emit(event, payload); }
export function emitToThread(threadId: string, event: string, payload: unknown) { io?.to(`thread:${threadId}`).emit(event, payload); }
export function emitToRoom(roomId: string, event: string, payload: unknown) { io?.to(`room:${roomId}`).emit(event, payload); }
