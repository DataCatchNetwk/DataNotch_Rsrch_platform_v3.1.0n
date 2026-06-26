'use client';

import { useMemo } from 'react';
import { useRealtimeRoom } from '@/hooks/use-realtime-room';

export function useMessageThread(roomId: string) {
  const { messages, setMessages } = useRealtimeRoom(roomId);

  const ordered = useMemo(
    () => [...messages].sort((a, b) => (a.sentAt > b.sentAt ? 1 : -1)),
    [messages],
  );

  return {
    messages: ordered,
    setMessages,
  };
}
