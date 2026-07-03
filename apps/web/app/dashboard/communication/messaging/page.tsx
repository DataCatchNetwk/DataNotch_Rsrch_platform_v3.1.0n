"use client";

import { useEffect, useMemo, useState } from 'react';
import { Archive, Bell, Mail, Paperclip, Plus, Search, Send, Star, X } from 'lucide-react';
import { CommShell } from '@/components/communication/comm-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  createMessageThread,
  getMessageThread,
  getMyInboxThreads,
  markThreadRead,
  replyMessageThread,
  setMessageThreadStarred,
  type InboxThreadListItem,
} from '@/lib/api/communication';

type ComposerMode = 'Message' | 'Internal Note';
type InboxFolder = 'inbox' | 'drafts' | 'spam' | 'deleted' | 'sent' | 'starred';

export default function UserMessagingPage() {
  const [threads, setThreads] = useState<InboxThreadListItem[]>([]);
  const [threadDetails, setThreadDetails] = useState<Record<string, Awaited<ReturnType<typeof getMessageThread>>>>({});
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [subject, setSubject] = useState('Support Request');
  const [recipientId, setRecipientId] = useState('admin-demo-id');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('User messaging page ready.');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'Inbox' | 'All' | 'Unread'>('Inbox');
  const [search, setSearch] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerMode>('Message');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('admin.team@example.com');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<InboxFolder>('inbox');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [starredByThread, setStarredByThread] = useState<Record<string, boolean>>({});

  const selectedThread = useMemo(() => threadDetails[selectedThreadId] ?? null, [threadDetails, selectedThreadId]);
  const visibleThreads = useMemo(() => {
    return threads.filter((thread) => {
      const searchText = `${thread.subject} ${thread.category}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesFilter = filter === 'Unread' ? (thread.unreadCount ?? 0) > 0 : true;
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, threads]);

  function actors(detail?: Awaited<ReturnType<typeof getMessageThread>>) {
    if (!detail) {
      return { from: '-', to: '-' };
    }
    const latest = detail.messages[detail.messages.length - 1];
    const senderName = `${latest?.sender?.firstname ?? ''} ${latest?.sender?.surname ?? ''}`.trim();
    const from = latest?.sender?.email ?? (senderName || 'system');
    const to = detail.participants
      .filter((participant) => participant.user.id !== latest?.sender?.id)
      .map((participant) => participant.user.email)
      .join(', ');
    return { from, to: to || detail.participants.map((participant) => participant.user.email).join(', ') || '-' };
  }

  async function loadThread(threadId: string) {
    try {
      const detail = await getMessageThread(threadId);
      setThreadDetails((current) => ({ ...current, [threadId]: detail }));
    } catch {
      setStatus('Unable to load thread details right now.');
    }
  }

  async function refreshInbox() {
    setLoading(true);
    try {
      const items = await getMyInboxThreads(selectedFolder);
      setThreads(items);
      setStarredByThread((current) => ({
        ...current,
        ...Object.fromEntries(items.map((item) => [item.id, Boolean(item.isStarred)])),
      }));
      const selected = selectedThreadId || items[0]?.id || '';
      if (selected) {
        setSelectedThreadId(selected);
      }
      await Promise.all(items.slice(0, 20).map((item) => loadThread(item.id)));
      setStatus('Inbox synced.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to load user inbox.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshInbox();
    const timer = window.setInterval(() => {
      void refreshInbox();
    }, 20000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder]);

  async function createThread() {
    if (!recipientId.trim()) return setStatus('Recipient user ID is required.');
    if (!subject.trim()) return setStatus('Subject is required.');
    if (!body.trim()) return setStatus('Message body is required.');

    setLoading(true);
    try {
      const created = await createMessageThread({
        subject: subject.trim(),
        category: 'USER_MESSAGE',
        participantIds: [recipientId.trim()],
        body: body.trim(),
        sendEmailCopy: false,
      });
      setBody('');
      const newId = (created.thread as { id?: string })?.id;
      if (newId) {
        setSelectedThreadId(newId);
        await loadThread(newId);
      }
      await refreshInbox();
      setStatus('Thread created.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to create thread.');
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!selectedThreadId) return setStatus('Select a thread first.');
    if (!body.trim()) return setStatus('Reply body is required.');

    setLoading(true);
    try {
      const replyBody = composerMode === 'Internal Note' ? `[Internal Note]\n${body.trim()}` : body.trim();
      await replyMessageThread(selectedThreadId, { body: replyBody, sendEmailCopy: false });
      await markThreadRead(selectedThreadId);
      setBody('');
      await loadThread(selectedThreadId);
      await refreshInbox();
      setStatus('Reply sent.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to send reply.');
    } finally {
      setLoading(false);
    }
  }

  async function createFromCompose() {
    if (!composeTo.trim()) return setStatus('Recipient is required.');
    if (!composeSubject.trim()) return setStatus('Subject is required.');
    if (!composeBody.trim()) return setStatus('Message body is required.');

    const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
    const toList = parseList(composeTo);
    const ccList = parseList(composeCc);
    const bccList = parseList(composeBcc);
    const allRecipientTokens = Array.from(new Set([...toList, ...ccList, ...bccList]));

    const participantIds = allRecipientTokens.filter((token) => !token.includes('@'));
    const recipientEmails = toList.filter((token) => token.includes('@'));
    const ccEmails = ccList.filter((token) => token.includes('@'));
    const bccEmails = bccList.filter((token) => token.includes('@'));

    setLoading(true);
    try {
      const created = await createMessageThread({
        subject: composeSubject.trim(),
        category: 'USER_MESSAGE',
        participantIds,
        recipientEmails,
        ccEmails,
        bccEmails,
        body: composeBody.trim(),
        sendEmailCopy: false,
      });
      const newId = (created.thread as { id?: string })?.id;
      if (newId) {
        setSelectedThreadId(newId);
        await loadThread(newId);
      }
      setComposeBody('');
      setComposeSubject('');
      setComposeCc('');
      setComposeBcc('');
      setComposeOpen(false);
      await refreshInbox();
      setStatus('Thread created.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to create thread.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleThreadStar(threadId: string) {
    const next = !starredByThread[threadId];
    try {
      await setMessageThreadStarred(threadId, next);
      setStarredByThread((current) => ({ ...current, [threadId]: next }));
      setStatus(next ? 'Thread added to starred.' : 'Thread removed from starred.');
      if (selectedFolder === 'starred') {
        await refreshInbox();
      }
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to update starred state.');
    }
  }

  return (
    <CommShell
      title="User Messaging Workspace"
      subtitle="Dedicated user inbox table with sender, receiver, and subject columns for direct communication."
      backHref="/dashboard/communication"
    >
      <section className="rounded-[2rem] border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950"><Mail className="h-6 w-6" /> User Inbox Table</h2>
            <p className="text-sm text-slate-500">From, To, and Subject are displayed per thread.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setComposeOpen(true)}><Plus className="mr-2 h-4 w-4" />Compose</Button>
            <Button
              variant="outline"
              onClick={() => selectedThreadId && void toggleThreadStar(selectedThreadId)}
              disabled={!selectedThreadId}
            >
              <Star className="mr-2 h-4 w-4" /> {selectedThreadId && starredByThread[selectedThreadId] ? 'Unstar' : 'Star'} Thread
            </Button>
            <Button variant="outline" onClick={() => void refreshInbox()} disabled={loading}>Refresh</Button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="Admin recipient user ID" />
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
        </div>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="Write message or reply..." />
        <div className="mt-3 flex gap-2">
          {(['Message', 'Internal Note'] as ComposerMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setComposerMode(mode)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${composerMode === mode ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Status: {status}</p>
          <div className="flex gap-2">
            <Button className="rounded-2xl bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => void createThread()} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" /> Create Thread
            </Button>
            <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => void sendReply()} disabled={loading || !selectedThreadId || !body.trim()}>
              <Send className="mr-2 h-4 w-4" /> Send Reply
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
            {(['Inbox', 'All', 'Unread'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-3 py-1.5 transition ${filter === tab ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search messages..." />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <div>From: Sender Email</div>
          <div>To: Receiver Email</div>
          <div>Subject</div>
        </div>
        <ScrollArea className="mt-2 h-96">
          <div className="space-y-2 pr-2">
            {visibleThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id);
                  void markThreadRead(thread.id);
                  void loadThread(thread.id);
                }}
                className={`grid w-full grid-cols-[1fr_1fr_1fr] gap-3 rounded-2xl border p-3 text-left text-sm transition ${selectedThreadId === thread.id ? 'border-cyan-400 bg-cyan-50' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="truncate text-slate-700">{actors(threadDetails[thread.id]).from}</div>
                <div className="truncate text-slate-700">{actors(threadDetails[thread.id]).to}</div>
                <div className="truncate font-semibold text-slate-950">{thread.subject}</div>
              </button>
            ))}
            {!visibleThreads.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No inbox threads yet.</p> : null}
          </div>
        </ScrollArea>

        {selectedThread ? (
          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Thread Messages</p>
            <ScrollArea className="mt-2 h-56">
              <div className="space-y-2 pr-2">
                {selectedThread.messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border bg-white p-3">
                    <div className="text-xs text-slate-500">{message.sender.email} - {new Date(message.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-sm text-slate-800">{message.body}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </section>

      {composeOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
            <div className="grid min-h-155 md:grid-cols-[240px_1fr]">
              <aside className="border-r bg-slate-100 p-4">
                <Button className="mb-4 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700">Compose</Button>
                <div className="space-y-2 text-sm">
                  {[
                    ['Inbox', 'inbox', String(threads.length), Mail],
                    ['Drafts', 'drafts', '-', Paperclip],
                    ['Spam', 'spam', '-', Bell],
                    ['Deleted', 'deleted', '-', Archive],
                    ['Starred', 'starred', '-', Star],
                    ['Sent', 'sent', '-', Send],
                  ].map(([label, key, count, Icon]: any) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSelectedFolder(key as InboxFolder);
                        setStatus(`Folder set to ${label}.`);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-white ${selectedFolder === key ? 'bg-white ring-1 ring-slate-200' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span>{label}</span>
                      </div>
                      <span className="text-xs text-slate-500">{selectedFolder === key ? String(threads.length) : count}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="flex flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950">New message</h3>
                  <button type="button" title="Close compose modal" aria-label="Close compose modal" className="rounded-xl p-2 hover:bg-slate-100" onClick={() => setComposeOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <Input value={composeTo} onChange={(event) => setComposeTo(event.target.value)} placeholder="To (emails or user IDs, comma-separated)" />
                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700" onClick={() => setShowCcBcc((current) => !current)}>
                      {showCcBcc ? 'Hide Cc Bcc' : 'Show Cc Bcc'}
                    </button>
                  </div>
                  {showCcBcc ? (
                    <>
                      <Input value={composeCc} onChange={(event) => setComposeCc(event.target.value)} placeholder="Cc (emails, comma-separated)" />
                      <Input value={composeBcc} onChange={(event) => setComposeBcc(event.target.value)} placeholder="Bcc (emails, comma-separated)" />
                    </>
                  ) : null}
                  <Input value={composeSubject} onChange={(event) => setComposeSubject(event.target.value)} placeholder="Subject" />
                  <Textarea value={composeBody} onChange={(event) => setComposeBody(event.target.value)} rows={14} placeholder="Write message..." />
                </div>

                <div className="mt-4 flex justify-between">
                  <Button className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700" disabled={loading} onClick={() => void createFromCompose()}>
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setComposeOpen(false)}>Cancel</Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </CommShell>
  );
}

