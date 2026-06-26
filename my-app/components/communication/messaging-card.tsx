import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MessagingCard({ onOpen }: { onOpen: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Messaging</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Realtime direct, workspace, and broadcast messaging with read/delivery status hooks.</p>
        <Button onClick={onOpen}>Open Messaging</Button>
      </CardContent>
    </Card>
  );
}
