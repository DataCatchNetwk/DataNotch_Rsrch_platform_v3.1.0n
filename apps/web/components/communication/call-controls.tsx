"use client";

import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CallControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={onToggleMic}>
        {micEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
        {micEnabled ? 'Mute' : 'Unmute'}
      </Button>
      <Button variant="outline" onClick={onToggleCamera}>
        {cameraEnabled ? <Video className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
        {cameraEnabled ? 'Camera Off' : 'Camera On'}
      </Button>
      <Button variant="destructive" onClick={onLeave}>
        <PhoneOff className="mr-2 h-4 w-4" />
        Leave
      </Button>
    </div>
  );
}
