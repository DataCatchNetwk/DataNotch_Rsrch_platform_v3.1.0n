import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export function RoomSidebar({
  rooms,
  selectedRoomId,
}: {
  rooms: Array<{ id: string; name: string; type: string }>;
  selectedRoomId?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="mb-2 text-sm font-semibold">Rooms</p>
        <div className="space-y-1">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/admin/communication/${room.id}`}
              className={`block rounded-md border px-3 py-2 text-sm ${selectedRoomId === room.id ? 'bg-sky-50 border-sky-300' : ''}`}
            >
              <div className="font-medium">{room.name}</div>
              <div className="text-xs text-muted-foreground">{room.type}</div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
