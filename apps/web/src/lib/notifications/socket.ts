"use client";

import { io, type Socket } from "socket.io-client";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001";

const SOCKET_BASE = RAW_API_BASE.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function connectNotificationSocket(token: string): Socket {
  return io(`${SOCKET_BASE}/notifications`, {
    transports: ["websocket"],
    auth: { token },
  });
}
