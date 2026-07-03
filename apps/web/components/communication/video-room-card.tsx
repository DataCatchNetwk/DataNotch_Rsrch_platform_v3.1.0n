import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VideoRoomCard({ onStart }: { onStart: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Video className="h-4 w-4" /> R-Zooma Video</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Realtime video rooms with WebRTC signaling, observer and moderation controls.</p>
        <Button onClick={onStart}>Start Video Room</Button>
      </CardContent>
    </Card>
  );
}


