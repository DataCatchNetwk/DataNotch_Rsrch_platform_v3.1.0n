'use client';

import { useEffect, useState } from 'react';
import { BookOpen, MessagesSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { communicationApi, type CommunicationThread } from '@/lib/communicationApi';

type Props = {
  assetType: 'PROJECT' | 'STUDY' | 'DATASET' | 'ANALYSIS' | 'PUBLICATION';
  assetId: string;
};

export function ResearchAssetDiscussion({ assetType, assetId }: Props) {
  const [threads, setThreads] = useState<CommunicationThread[]>([]);
  const [status, setStatus] = useState('Asset discussions ready.');

  useEffect(() => {
    communicationApi.assetThreads(assetType, assetId)
      .then((items) => {
        setThreads(items);
        setStatus('Asset threads synced.');
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Unable to load asset discussions.'));
  }, [assetId, assetType]);

  return (
    <Card className="rounded-[2rem] border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Research Asset Discussion</CardTitle>
        <CardDescription>{assetType}: {assetId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{threads.length} threads</Badge>
          <Badge variant="outline"><MessagesSquare className="mr-1 h-3 w-3" /> Integrated with inbox</Badge>
        </div>
        <div className="space-y-3">
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-2xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-950">{thread.subject}</div>
                <Badge variant="outline">{thread.unreadCount ?? 0} unread</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{thread.latestMessage?.body ?? thread.messages?.[0]?.body ?? 'No messages attached yet.'}</p>
            </div>
          ))}
          {!threads.length ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No research asset discussions yet.</div> : null}
        </div>
        <div className="rounded-2xl border bg-white p-3 text-sm text-slate-700">Status: {status}</div>
      </CardContent>
    </Card>
  );
}