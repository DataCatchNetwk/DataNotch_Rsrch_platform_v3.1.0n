'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket/client';

export function usePresence(status: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'IN_CALL' = 'ONLINE') {
  useEffect(() => {
    const socket = getSocket();
    socket.emit('presence:heartbeat', { status });

    const id = window.setInterval(() => {
      socket.emit('presence:heartbeat', { status });
    }, 15000);

    return () => {
      window.clearInterval(id);
      socket.emit('presence:heartbeat', { status: 'OFFLINE' });
    };
  }, [status]);
}
