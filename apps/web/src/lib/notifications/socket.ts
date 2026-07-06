"use client";

import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-base";

const SOCKET_BASE = getApiBaseUrl().replace(/\/api\/?$/, "").replace(/\/+$/, "");

export function connectNotificationSocket(token: string): Socket {
  return io(`${SOCKET_BASE}/notifications`, {
    transports: ["websocket"],
    auth: { token },
  });
}
