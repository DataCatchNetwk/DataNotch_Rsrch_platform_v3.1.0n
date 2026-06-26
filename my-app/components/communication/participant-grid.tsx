import { Card, CardContent } from '@/components/ui/card';
import { PresenceBadge } from '@/components/communication/presence-badge';

export function ParticipantGrid({
  participants,
}: {
  participants: Array<{ userId: string; role: string; muted: boolean; cameraEnabled: boolean; isOnline: boolean }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {participants.map((p) => (
        <Card key={`${p.userId}-${p.role}`}>
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{p.userId}</p>
              <PresenceBadge status={p.isOnline ? 'ONLINE' : 'OFFLINE'} />
            </div>
            <p className="text-xs text-muted-foreground">Role: {p.role}</p>
            <p className="text-xs text-muted-foreground">Mic: {p.muted ? 'Muted' : 'On'} · Cam: {p.cameraEnabled ? 'On' : 'Off'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
