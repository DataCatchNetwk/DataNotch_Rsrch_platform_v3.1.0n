"use client";

import { MessageSquare, Phone, Radio, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CommunicationPanel({
  activeRooms,
  onlineUsers,
  onAudio,
  onVideo,
  onMessaging,
}: {
  activeRooms: number;
  onlineUsers: number;
  onAudio: () => void;
  onVideo: () => void;
  onMessaging: () => void;
}) {
  return (
    <Card className="rounded-2xl border-4 border-sky-500 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <Button className="h-20 rounded-2xl border-4 border-amber-700 bg-white text-3xl font-black text-indigo-600 hover:bg-amber-50" variant="outline" onClick={onAudio}>
            R-MEET
          </Button>
          <Button className="h-20 rounded-2xl border-4 border-black bg-white text-3xl font-black text-red-500 hover:bg-neutral-50" variant="outline" onClick={onVideo}>
            R-ZOOMA
          </Button>
          <Button className="h-20 rounded-2xl border-4 border-pink-500 bg-white text-2xl font-black text-fuchsia-600 hover:bg-pink-50" variant="outline" onClick={onMessaging}>
            MESSAGING
          </Button>
        </div>

        <div className="grid min-w-[260px] grid-cols-3 gap-3 text-center text-xs font-semibold">
          <div className="rounded-xl border p-3">
            <Phone className="mx-auto mb-1 h-4 w-4" />
            AUDIO CALL
          </div>
          <div className="rounded-xl border p-3 text-green-600">
            <Video className="mx-auto mb-1 h-4 w-4" />
            VIDEO CALL
          </div>
          <div className="rounded-xl border p-3">
            <MessageSquare className="mx-auto mb-1 h-4 w-4" />
            TEXT / EMAIL
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Badge className="gap-1"><Radio className="h-3 w-3" /> Live</Badge>
          <Badge variant="outline">{activeRooms} active rooms</Badge>
          <Badge variant="outline">{onlineUsers} online users</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
