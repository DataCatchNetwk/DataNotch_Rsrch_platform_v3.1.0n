import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | undefined;

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token') ?? undefined;
}

export function getSocket() {
  const token = getToken();

  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socketToken = token;
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://127.0.0.1:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = undefined;
}
