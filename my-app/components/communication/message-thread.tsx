"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSocket } from '@/lib/socket/client';

export function MessageThread({ roomId, messages }: { roomId: string; messages: Array<{ id: string; senderName: string; body: string }> }) {
  const [body, setBody] = useState('');

  function send() {
    if (!body.trim()) return;
    getSocket().emit('message:send', { roomId, body: body.trim() });
    setBody('');
  }

  return (
    <div className="flex h-[500px] flex-col rounded-2xl border">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border p-3 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">{m.senderName}</div>
              <div>{m.body}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) send();
          }}
          placeholder="Type a message..."
        />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
}
