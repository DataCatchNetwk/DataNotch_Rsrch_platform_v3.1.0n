"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommunicationPanel } from '@/components/communication/communication-panel';
import { AudioCallCard } from '@/components/communication/audio-call-card';
import { VideoRoomCard } from '@/components/communication/video-room-card';
import { MessagingCard } from '@/components/communication/messaging-card';
import { RoomSidebar } from '@/components/communication/room-sidebar';
import {
  createCommunicationRoom,
  getCommunicationMonitoring,
  listCommunicationRooms,
  startRoomCall,
  type CommunicationRoom,
} from '@/lib/api/communication';
import { usePresence } from '@/hooks/use-presence';

export default function CommunicationAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [rooms, setRooms] = React.useState<CommunicationRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<CommunicationRoom | null>(null);
  const [monitoring, setMonitoring] = React.useState({
    activeCalls: 0,
    activeVideoRooms: 0,
    onlineUsers: 0,
    unreadMessages: 0,
    failedConnectionAttempts: 0,
    flaggedSessions: 0,
  });

  usePresence('ONLINE');

  const load = React.useCallback(async () => {
    const [roomList, mon] = await Promise.all([listCommunicationRooms(), getCommunicationMonitoring()]);
    setRooms(roomList);
    setSelectedRoom((prev) => prev ?? roomList[0] ?? null);
    setMonitoring(mon.cards);
  }, []);

  React.useEffect(() => {
    void load().catch((error) => toast.error((error as Error).message));
  }, [load]);

  async function ensureRoom(type: CommunicationRoom['type']) {
    if (selectedRoom?.type === type) return selectedRoom;

    const existing = rooms.find((room) => room.type === type);
    if (existing) {
      setSelectedRoom(existing);
      return existing;
    }

    const room = await createCommunicationRoom({
      name: type === 'CHANNEL' ? 'Messaging Channel' : type === 'CALL_ROOM' ? 'Realtime Call Room' : 'Communication Room',
      type,
      visibility: 'ORG',
    });
    await load();
    setSelectedRoom(room);
    return room;
  }

  async function handleAudio() {
    try {
      const room = await ensureRoom('CALL_ROOM');
      const call = await startRoomCall(room.id, 'AUDIO');
      toast.success('R-MEET audio started');
      router.push(`/admin/communication/${room.id}?mode=audio&callSessionId=${call.id}`);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to start audio call');
    }
  }

  async function handleVideo() {
    try {
      const room = await ensureRoom('CALL_ROOM');
      const call = await startRoomCall(room.id, 'VIDEO');
      toast.success('R-ZOOMA video room started');
      router.push(`/admin/communication/${room.id}?mode=video&callSessionId=${call.id}`);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to start video room');
    }
  }

  async function handleMessaging() {
    try {
      const room = await ensureRoom('CHANNEL');
      toast.success('Messaging room ready');
      router.push(`/admin/communication/${room.id}?mode=messaging`);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to open messaging');
    }
  }

  React.useEffect(() => {
    if (!mode) return;
    if (mode === 'audio') void handleAudio();
    if (mode === 'video') void handleVideo();
    if (mode === 'messaging') void handleMessaging();
  }, [mode]);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Communication Center</h1>

      <CommunicationPanel
        activeRooms={monitoring.activeCalls + monitoring.activeVideoRooms}
        onlineUsers={monitoring.onlineUsers}
        onAudio={() => void handleAudio()}
        onVideo={() => void handleVideo()}
        onMessaging={() => void handleMessaging()}
      />

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <RoomSidebar rooms={rooms} selectedRoomId={selectedRoom?.id} />

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <AudioCallCard onStart={() => void handleAudio()} />
            <VideoRoomCard onStart={() => void handleVideo()} />
            <MessagingCard onOpen={() => void handleMessaging()} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-3 text-sm">Active calls: {monitoring.activeCalls}</div>
                <div className="rounded-lg border p-3 text-sm">Active video rooms: {monitoring.activeVideoRooms}</div>
                <div className="rounded-lg border p-3 text-sm">Online users: {monitoring.onlineUsers}</div>
                <div className="rounded-lg border p-3 text-sm">Unread messages: {monitoring.unreadMessages}</div>
                <div className="rounded-lg border p-3 text-sm">Failed connection attempts: {monitoring.failedConnectionAttempts}</div>
                <div className="rounded-lg border p-3 text-sm">Flagged sessions: {monitoring.flaggedSessions}</div>
              </div>
              {selectedRoom ? (
                <Button className="mt-4" onClick={() => router.push(`/admin/communication/${selectedRoom.id}`)}>Open selected room</Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
