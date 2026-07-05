"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Archive, Bell, Mail, Paperclip, Plus, Search, Send, Star, X } from 'lucide-react';
import { CommShell } from '@/components/communication/comm-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Group, Panel, Separator } from 'react-resizable-panels';
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
type FolderShortcut = [label: string, key: InboxFolder, count: string, Icon: typeof Mail];
type ReplyScope = 'reply' | 'reply-all';

const folderTabs: Array<{ key: InboxFolder; label: string }> = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'sent', label: 'Sent' },
  { key: 'starred', label: 'Starred' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'spam', label: 'Spam' },
  { key: 'deleted', label: 'Deleted' },
];

function formatThreadStamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function groupThreadsByDate(items: InboxThreadListItem[]) {
  return items.reduce<Record<string, InboxThreadListItem[]>>((groups, item) => {
    const key = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.updatedAt));
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function attachmentLabel(url: string) {
  if (!url) return 'Attached file';
  if (url.startsWith('data:')) {
    const mime = url.slice(5, url.indexOf(';'));
    const subtype = mime.split('/')[1];
    return subtype ? `Attached ${subtype.toUpperCase()} file` : 'Attached file';
  }
  try {
    const name = new URL(url).pathname.split('/').filter(Boolean).pop();
    return name ? `Attached ${name}` : 'Attached file';
  } catch {
    return 'Attached file';
  }
}

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
  const [composeAttachmentUrl, setComposeAttachmentUrl] = useState('');
  const [composeAttachmentName, setComposeAttachmentName] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState('');
  const [replyAttachmentName, setReplyAttachmentName] = useState('');
  const [starredByThread, setStarredByThread] = useState<Record<string, boolean>>({});
  const [replyScope, setReplyScope] = useState<ReplyScope>('reply');
  const replyAttachmentInputRef = useRef<HTMLInputElement>(null);
  const composeAttachmentInputRef = useRef<HTMLInputElement>(null);

  const selectedThread = useMemo(() => threadDetails[selectedThreadId] ?? null, [threadDetails, selectedThreadId]);
  const visibleThreads = useMemo(() => {
    return threads.filter((thread) => {
      const searchText = `${thread.subject} ${thread.category}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesFilter = filter === 'Unread' ? (thread.unreadCount ?? 0) > 0 : true;
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, threads]);
  const groupedThreads = useMemo(() => groupThreadsByDate(visibleThreads), [visibleThreads]);

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
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to load user inbox.');
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
  }, []);

  useEffect(() => {
    void refreshInbox();
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
        attachmentUrl: composeAttachmentUrl.trim() || undefined,
        sendEmailCopy: false,
      });
      setBody('');
      setComposeAttachmentUrl('');
      setComposeAttachmentName('');
      const newId = (created.thread as { id?: string })?.id;
      if (newId) {
        setSelectedThreadId(newId);
        await loadThread(newId);
      }
      await refreshInbox();
      setStatus('Thread created.');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to create thread.');
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
      await replyMessageThread(selectedThreadId, { body: replyBody, sendEmailCopy: replyScope === 'reply-all', attachmentUrl: replyAttachmentUrl.trim() || undefined });
      await markThreadRead(selectedThreadId);
      setBody('');
      setReplyAttachmentUrl('');
      setReplyAttachmentName('');
      await loadThread(selectedThreadId);
      await refreshInbox();
      setStatus('Reply sent.');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to send reply.');
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
        attachmentUrl: composeAttachmentUrl.trim() || undefined,
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
      setComposeAttachmentUrl('');
      setComposeAttachmentName('');
      setComposeOpen(false);
      await refreshInbox();
      setStatus('Thread created.');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to create thread.');
    } finally {
      setLoading(false);
    }
  }

  function openForwardDraft(message: { sender: { email: string }; body: string; attachmentUrl?: string | null }) {
    setComposeTo(message.sender.email);
    setComposeSubject(`Fwd: ${subject || selectedThread?.subject || 'Message'}`);
    setComposeBody(`Forwarded message from ${message.sender.email}\n\n${message.body}`);
    setComposeAttachmentUrl(message.attachmentUrl ?? '');
    setComposeAttachmentName(message.attachmentUrl ? 'Forwarded attachment' : '');
    setShowCcBcc(false);
    setComposeOpen(true);
  }

  async function readAttachmentFile(file: File, setUrl: (value: string) => void, setName: (value: string) => void) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
    setUrl(dataUrl);
    setName(file.name);
  }

  function handleReplyAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void readAttachmentFile(file, setReplyAttachmentUrl, setReplyAttachmentName);
    event.target.value = '';
  }

  function handleComposeAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void readAttachmentFile(file, setComposeAttachmentUrl, setComposeAttachmentName);
    event.target.value = '';
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
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to update starred state.');
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

        <div className="mb-4 flex flex-wrap gap-2">
          {folderTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedFolder(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedFolder === tab.key ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <div>From: Sender Email</div>
          <div>To: Receiver Email</div>
          <div>{selectedFolder === 'sent' ? 'Sent Subject' : 'Subject'}</div>
        </div>
        <ScrollArea className="mt-2 h-96">
          <div className="space-y-2 pr-2">
            {Object.entries(groupedThreads).map(([date, items]) => (
              <div key={date} className="space-y-2">
                <div className="flex justify-center py-1.5">
                  <span className="rounded-full border bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{date}</span>
                </div>
                {items.map((thread) => (
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
                    <div className="flex items-center justify-between gap-2 font-semibold text-slate-950">
                      <span className="truncate">{thread.subject}</span>
                      <span className="shrink-0 text-[11px] font-medium text-slate-500">{formatThreadStamp(thread.updatedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {!visibleThreads.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No inbox threads yet.</p> : null}
          </div>
        </ScrollArea>

        <Group orientation="vertical" className="mt-4 h-[42rem] rounded-2xl border bg-slate-50">
          <Panel defaultSize={62} minSize={35} className="min-h-0">
            <div className="h-full p-4">
              <div className="grid h-full grid-rows-[auto_1fr] gap-3">
                {selectedThread ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">Thread Messages</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full border bg-white px-2.5 py-1">Reply attached</span>
                          <span className="rounded-full border bg-white px-2.5 py-1">Drag splitter below</span>
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="min-h-0 pr-2">
                      <div className="space-y-2">
                        {selectedThread.messages.map((message) => (
                          <div key={message.id} className="rounded-2xl border bg-white p-2.5">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span>{message.sender.email}</span>
                              <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-slate-800">{message.body}</div>
                            {message.attachmentUrl ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {attachmentLabel(message.attachmentUrl)}
                                </span>
                                <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100">
                                  Preview
                                </a>
                                <a href={message.attachmentUrl} download className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100">
                                  Download
                                </a>
                              </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyScope('reply');
                                  setBody('');
                                  setReplyAttachmentUrl(message.attachmentUrl ?? '');
                                  setReplyAttachmentName(message.attachmentUrl ? 'Forwarded attachment' : '');
                                  setStatus('Reply selected for this thread.');
                                }}
                                className="rounded-full border px-3 py-1 hover:bg-slate-50"
                              >
                                Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyScope('reply-all');
                                  setBody('');
                                  setReplyAttachmentUrl(message.attachmentUrl ?? '');
                                  setReplyAttachmentName(message.attachmentUrl ? 'Forwarded attachment' : '');
                                  setStatus('Reply all selected for this thread.');
                                }}
                                className="rounded-full border px-3 py-1 hover:bg-slate-50"
                              >
                                Reply all
                              </button>
                              <button
                                type="button"
                                onClick={() => openForwardDraft(message)}
                                className="rounded-full border px-3 py-1 hover:bg-slate-50"
                              >
                                Forward
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="grid place-items-center rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
                    Select a thread to view messages.
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <Separator className="relative flex h-4 items-center justify-center" />
            <div className="h-1.5 w-20 rounded-full bg-slate-300" />
          
          <Panel defaultSize={38} minSize={24} className="min-h-0">
            <div className="h-full p-4 pt-0">
              <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3 rounded-2xl border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Read Box Reply</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full border bg-slate-50 px-2.5 py-1">Reply all sends email copy</span>
                    <span className="rounded-full border bg-slate-50 px-2.5 py-1">Forward opens draft compose</span>
                  </div>
                </div>
                <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder={selectedThread ? 'Write a reply, internal note, or forward message...' : 'Select a thread to start replying...'} className="min-h-0 resize-none border-slate-200" />
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Input value={replyAttachmentUrl} onChange={(event) => setReplyAttachmentUrl(event.target.value)} placeholder="Reply attachment URL (optional)" className="border-slate-200" />
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={() => replyAttachmentInputRef.current?.click()}>
                      Attach
                    </Button>
                  </div>
                  <input ref={replyAttachmentInputRef} type="file" accept="*/*" className="hidden" onChange={handleReplyAttachmentChange} />
                  <p className="text-xs text-slate-500">{replyAttachmentName ? `Attached: ${replyAttachmentName}` : 'Used when sending a reply or reply-all on the selected thread.'}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
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
                    <button type="button" onClick={() => setReplyScope('reply')} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${replyScope === 'reply' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Reply</button>
                    <button type="button" onClick={() => setReplyScope('reply-all')} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${replyScope === 'reply-all' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Reply all</button>
                  </div>
                  <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => void sendReply()} disabled={loading || !selectedThreadId || !body.trim()}>
                    <Send className="mr-2 h-4 w-4" /> {replyScope === 'reply-all' ? 'Send Reply All' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
        </Group>
      </section>

      {composeOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
            <div className="grid min-h-155 md:grid-cols-[240px_1fr]">
              <aside className="border-r bg-slate-100 p-4">
                <Button className="mb-4 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700">Compose</Button>
                <div className="space-y-2 text-sm">
                  {([
                    ['Inbox', 'inbox', String(threads.length), Mail],
                    ['Drafts', 'drafts', '-', Paperclip],
                    ['Spam', 'spam', '-', Bell],
                    ['Deleted', 'deleted', '-', Archive],
                    ['Starred', 'starred', '-', Star],
                    ['Sent', 'sent', '-', Send],
                  ] satisfies FolderShortcut[]).map(([label, key, count, Icon]) => (
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
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input value={composeAttachmentUrl} onChange={(event) => setComposeAttachmentUrl(event.target.value)} placeholder="Attachment URL (optional)" />
                      <Button type="button" variant="outline" className="rounded-2xl" onClick={() => composeAttachmentInputRef.current?.click()}>
                        Attach
                      </Button>
                    </div>
                    <input ref={composeAttachmentInputRef} type="file" accept="*/*" className="hidden" onChange={handleComposeAttachmentChange} />
                    <p className="text-xs text-slate-500">{composeAttachmentName ? `Attached: ${composeAttachmentName}` : 'Accepts any file type and stores it as a data URL attachment.'}</p>
                  </div>
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
