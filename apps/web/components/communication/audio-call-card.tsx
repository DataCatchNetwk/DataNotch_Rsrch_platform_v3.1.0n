import { Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AudioCallCard({ onStart }: { onStart: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="h-4 w-4" /> R-Meet (Call/Voice)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">One-to-one and team audio sessions with moderation hooks.</p>
        <Button onClick={onStart}>Start Audio Call</Button>
      </CardContent>
    </Card>
  );
}

