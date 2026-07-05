'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Send, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  archiveMessageThread,
  createMessageThread,
  getMessageThread,
  getMyInboxThreads,
  markThreadRead,
  replyMessageThread,
  type InboxThreadListItem,
} from '@/lib/api/communication';

type Props = {
  userId: string;
  role: 'ADMIN' | 'USER';
  defaultParticipantIds?: string;
  defaultSubject?: string;
};

type ErrorWithMessage = {
  message: string;
};

type CreatedThreadShape = {
  id: string;
};

function hasMessage(error: unknown): error is ErrorWithMessage {
  return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string';
}

function errorMessage(error: unknown, fallback: string) {
  return hasMessage(error) ? error.message : fallback;
}

function createdThreadId(thread: unknown) {
  return typeof thread === 'object' && thread !== null && 'id' in thread && typeof thread.id === 'string'
    ? (thread as CreatedThreadShape).id
    : '';
}

export function UnifiedInbox({ userId, role, defaultParticipantIds = '', defaultSubject = 'Platform message' }: Props) {
  const [threads, setThreads] = useState<InboxThreadListItem[]>([]);
  const [threadDetails, setThreadDetails] = useState<Record<string, Awaited<ReturnType<typeof getMessageThread>>>>({});
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [participantIds, setParticipantIds] = useState(defaultParticipantIds);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('Inbox ready.');
  const [loading, setLoading] = useState(false);

  const selectedThread = useMemo(() => threadDetails[selectedThreadId] ?? null, [threadDetails, selectedThreadId]);

  function describeThreadActors(detail?: Awaited<ReturnType<typeof getMessageThread>>) {
    if (!detail) {
      return { from: '-', to: '-' };
    }

    const latest = detail.messages[detail.messages.length - 1];
    const senderName = `${latest?.sender?.firstname ?? ''} ${latest?.sender?.surname ?? ''}`.trim();
    const from = latest?.sender?.email ?? (senderName || 'system');
    const to = detail.participants
      .filter((participant) => participant.user.id !== latest?.sender?.id)
      .map((participant) => participant.user.email)
      .filter(Boolean)
      .join(', ');

    return {
      from,
      to: to || detail.participants.map((participant) => participant.user.email).join(', ') || '-',
    };
  }

  async function loadThreadDetail(threadId: string) {
    try {
      const detail = await getMessageThread(threadId);
      setThreadDetails((current) => ({ ...current, [threadId]: detail }));
    } catch {
      // Keep list usable even if one detail request fails.
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const items = await getMyInboxThreads();
      setThreads(items);
      const nextSelected = selectedThreadId || items[0]?.id || '';
      if (nextSelected) {
        setSelectedThreadId(nextSelected);
      }
      await Promise.all(items.slice(0, 20).map((thread) => loadThreadDetail(thread.id)));
      if (nextSelected && !threadDetails[nextSelected]) {
        await loadThreadDetail(nextSelected);
      }
      setStatus('Inbox synced.');
    } catch (error) {
      setStatus(errorMessage(error, 'Unable to load inbox.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 20000);
    return () => window.clearInterval(timer);
  }, [userId]);

  async function createThread() {
    if (!subject.trim()) return setStatus('Enter a subject before creating a thread.');
    if (!participantIds.trim()) return setStatus('Add at least one participant ID.');
    if (!body.trim()) return setStatus('Write a message before creating the thread.');
    setLoading(true);
    try {
      const created = await createMessageThread({
        subject: subject.trim(),
        category: role === 'ADMIN' ? 'ADMIN_MESSAGE' : 'USER_MESSAGE',
        participantIds: participantIds.split(',').map((value) => value.trim()).filter(Boolean),
        body: body.trim(),
        sendEmailCopy: role === 'ADMIN',
      });
      setBody('');
      setStatus('Thread created and notifications routed.');
      await refresh();
      const newId = createdThreadId(created.thread);
      if (newId) {
        setSelectedThreadId(newId);
        await loadThreadDetail(newId);
      }
    } catch (error) {
      setStatus(errorMessage(error, 'Unable to create thread.'));
    } finally {
      setLoading(false);
    }
  }

  async function reply() {
    if (!selectedThread) return setStatus('Select a thread first.');
    if (!body.trim()) return setStatus('Write a reply before sending.');
    setLoading(true);
    try {
      await replyMessageThread(selectedThread.id, { body: body.trim(), sendEmailCopy: role === 'ADMIN' });
      setBody('');
      setStatus('Message sent.');
      await markThreadRead(selectedThread.id);
      await loadThreadDetail(selectedThread.id);
      await refresh();
    } catch (error) {
      setStatus(errorMessage(error, 'Unable to send message.'));
    } finally {
      setLoading(false);
    }
  }

  async function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    await markThreadRead(threadId);
    await loadThreadDetail(threadId);
  }

  async function archiveSelectedThread() {
    if (!selectedThreadId) return;
    setLoading(true);
    try {
      await archiveMessageThread(selectedThreadId);
      setStatus('Thread archived.');
      setSelectedThreadId('');
      await refresh();
    } catch (error) {
      setStatus(errorMessage(error, 'Unable to archive thread.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-0 shadow-sm">
      <CardHeader className="border-b bg-white/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Unified Inbox & Research Threads</CardTitle>
            <CardDescription>{role} inbox, notifications, support, and research messaging routed through the backend.</CardDescription>
          </div>
          <Badge variant="outline">{threads.length} threads</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
          <div className="border-r bg-slate-50/80 p-4">
            <div className="mb-3 rounded-2xl border bg-white p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-950"><Users className="h-4 w-4" /> Inbox Columns</div>
              <p className="mt-2 text-xs text-slate-500">From (sender email), To (receiver emails), and Subject are now shown per thread.</p>
            </div>
            <ScrollArea className="h-144 pr-2">
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 rounded-xl border bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                  <div>From</div>
                  <div>To</div>
                  <div>Subject</div>
                </div>
                {threads.map((thread) => (
                  <button key={thread.id} onClick={() => void selectThread(thread.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedThread?.id === thread.id ? 'border-sky-500 bg-sky-50' : 'bg-white hover:bg-slate-50'}`}>
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-sm">
                      <div className="truncate text-slate-700">{describeThreadActors(threadDetails[thread.id]).from}</div>
                      <div className="truncate text-slate-700">{describeThreadActors(threadDetails[thread.id]).to}</div>
                      <div className="truncate font-semibold text-slate-950">{thread.subject}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{thread.category}</span>
                      <span>{new Date(thread.updatedAt).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
                {!threads.length ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No inbox threads yet.</div> : null}
              </div>
            </ScrollArea>
          </div>

          <div className="bg-white p-4">
            <div className="space-y-4">
              <div className="rounded-2xl border bg-slate-950 p-4 text-white">
                <div className="text-xs uppercase tracking-[0.35em] text-sky-300">Thread Composer</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
                  <Input value={participantIds} onChange={(event) => setParticipantIds(event.target.value)} placeholder="Participant IDs, comma-separated" />
                </div>
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="mt-3 bg-white text-slate-950" placeholder="Write a reply, admin instruction, dataset note, or user support response..." />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="rounded-2xl bg-white text-slate-950" onClick={createThread} disabled={loading}><Mail className="mr-2 h-4 w-4" />Create Thread</Button>
                  <Button variant="outline" className="rounded-2xl border-white/30 bg-white/5 text-white hover:bg-white/10" onClick={reply} disabled={loading || !selectedThread}><Send className="mr-2 h-4 w-4" />Send Reply</Button>
                  <Button variant="outline" className="rounded-2xl border-white/30 bg-white/5 text-white hover:bg-white/10" onClick={() => void archiveSelectedThread()} disabled={loading || !selectedThreadId}>Archive Thread</Button>
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">Status: {status}</div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">Selected thread</h3>
                    <p className="text-sm text-slate-500">Messages and discussion details for the active inbox thread.</p>
                  </div>
                  <Button variant="outline" onClick={refresh} disabled={loading}>Refresh</Button>
                </div>
                {selectedThread ? (
                  <div className="mt-4 space-y-3">
                    {(selectedThread.messages ?? []).map((message) => (
                      <div key={message.id} className="rounded-2xl border bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{message.sender.email}</span>
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{message.body}</p>
                      </div>
                    ))}
                    {!selectedThread.messages?.length ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No messages in this thread yet.</div> : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">Select a thread to view messages.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
