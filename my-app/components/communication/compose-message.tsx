"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSocket } from '@/lib/socket/client';

export function ComposeMessage({ roomId }: { roomId: string }) {
  const [body, setBody] = useState('');

  function submit() {
    if (!body.trim()) return;
    getSocket().emit('message:send', { roomId, body: body.trim() });
    setBody('');
  }

  return (
    <div className="flex gap-2">
      <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Compose message..." />
      <Button onClick={submit}>Send</Button>
    </div>
  );
}
