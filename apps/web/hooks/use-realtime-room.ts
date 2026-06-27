'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket/client';

type RealtimeMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  body: string;
  sentAt: string;
};

type RealtimeParticipant = {
  id: string;
  roomId: string;
  userId: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  muted: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  isOnline: boolean;
};

type RealtimeError = {
  roomId?: string;
  message: string;
};

export function useRealtimeRoom(roomId: string) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [error, setError] = useState<RealtimeError | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    setConnected(socket.connected);
    socket.emit('room:join', { roomId });

    const onConnect = () => {
      setConnected(true);
      socket.emit('room:join', { roomId });
    };

    const onDisconnect = () => setConnected(false);

    const onNewMessage = (payload: { roomId: string; message: RealtimeMessage }) => {
      if (payload.roomId === roomId) {
        setMessages((prev) => (prev.some((message) => message.id === payload.message.id) ? prev : [...prev, payload.message]));
      }
    };

    const onParticipants = (payload: { roomId: string; participants: RealtimeParticipant[] }) => {
      if (payload.roomId === roomId) {
        setParticipants(payload.participants);
      }
    };

    const onCommError = (payload: RealtimeError) => {
      if (!payload.roomId || payload.roomId === roomId) {
        setError(payload);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onNewMessage);
    socket.on('room:participants', onParticipants);
    socket.on('comm:error', onCommError);

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onNewMessage);
      socket.off('room:participants', onParticipants);
      socket.off('comm:error', onCommError);
    };
  }, [roomId]);

  return { messages, setMessages, participants, setParticipants, error, setError, connected };
}