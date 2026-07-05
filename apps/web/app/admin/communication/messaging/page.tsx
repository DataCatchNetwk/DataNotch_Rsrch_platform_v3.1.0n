"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Archive, Bell, CalendarClock, Inbox, Megaphone, Paperclip, Search, Send, Star, Ticket, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CommShell } from '@/components/communication/comm-shell';
import { MetricCard } from '@/components/communication/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  archiveMessageThread,
  cancelCommunicationMeeting,
  createMessageThread,
  deleteCommunicationMeeting,
  getMessageThread,
  getMyInboxThreads,
  getNotificationsList,
  getSupportTickets,
  listCommunicationMeetings,
  markThreadRead,
  replyMessageThread,
  setMessageThreadStarred,
  updateCommunicationMeeting,
  type InboxThreadListItem,
} from '@/lib/api/communication';

type ThreadDetail = Awaited<ReturnType<typeof getMessageThread>>;
type ComposerMode = 'Message' | 'Internal Note';
type InboxFolder = 'inbox' | 'drafts' | 'spam' | 'deleted' | 'sent' | 'starred';
type FolderShortcut = [label: string, key: InboxFolder, count: string, Icon: typeof Inbox];
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

const moduleDefinitions = [
  { key: 'INBOX', label: 'Inbox', categories: ['USER_MESSAGE', 'ADMIN_MESSAGE', 'REVIEW_REQUEST', 'APPROVAL_REQUEST'] },
  { key: 'INVITATIONS', label: 'Invitations', categories: ['MEETING_INVITATION'] },
  { key: 'DATASET', label: 'Dataset Discussions', categories: ['DATASET_REQUEST'] },
  { key: 'STUDY', label: 'Study Discussions', categories: ['STUDY_REQUEST'] },
  { key: 'ANALYSIS', label: 'Analysis Discussions', categories: ['REVIEW_REQUEST'] },
  { key: 'PUBLICATION', label: 'Publication Discussions', categories: ['APPROVAL_REQUEST'] },
  { key: 'SUPPORT', label: 'Support Center', categories: ['SUPPORT_TICKET'] },
  { key: 'ANNOUNCEMENTS', label: 'Announcements', categories: ['ANNOUNCEMENT', 'BROADCAST', 'SYSTEM_ALERT'] },
] as const;

const templateThreads = [
  { subject: 'Dataset Approval Request — Clinical_SDOH_v5', category: 'DATASET_REQUEST' as const, assetType: 'DATASET', assetId: 'Clinical_SDOH_v5' },
  { subject: 'Study Review Request — NeuroTwinFM', category: 'STUDY_REQUEST' as const, assetType: 'STUDY', assetId: 'NeuroTwinFM' },
  { subject: 'Meeting Invitation — Publication Review', category: 'MEETING_INVITATION' as const, assetType: 'PUBLICATION', assetId: 'Readmission_Paper_v2' },
  { subject: 'Support Ticket — Account Recovery', category: 'SUPPORT_TICKET' as const, assetType: 'PROJECT', assetId: 'Support_Case_AccountRecovery' },
  { subject: 'Publication Review — SDOH Readmission', category: 'APPROVAL_REQUEST' as const, assetType: 'PUBLICATION', assetId: 'SDOH_Readmission' },
];

export default function MessagingPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<(typeof moduleDefinitions)[number]['key']>('INBOX');
  const [recipientId, setRecipientId] = useState('user-demo-id');
  const [subject, setSubject] = useState('Research communication update');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState<InboxThreadListItem[]>([]);
  const [threadDetails, setThreadDetails] = useState<Record<string, ThreadDetail>>({});
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description?: string; createdAt: string; isRead?: boolean }>>([]);
  const [supportTickets, setSupportTickets] = useState<Array<{ id: string; subject: string; status: string }>>([]);
  const [meetings, setMeetings] = useState<Array<{ room: { id: string }; metadata: { title: string; startsAt: string; status: string } }>>([]);
  const [status, setStatus] = useState('Messaging workspace ready.');
  const [sending, setSending] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('Message');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('research.user@example.com');
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
  const [mutedByThread, setMutedByThread] = useState<Record<string, boolean>>({});
  const [starredByThread, setStarredByThread] = useState<Record<string, boolean>>({});
  const [replyScope, setReplyScope] = useState<ReplyScope>('reply');
  const replyAttachmentInputRef = useRef<HTMLInputElement>(null);
  const composeAttachmentInputRef = useRef<HTMLInputElement>(null);
  const replyBodyRef = useRef<HTMLTextAreaElement>(null);

  const selectedThread = useMemo(() => threadDetails[selectedThreadId] ?? null, [threadDetails, selectedThreadId]);
  const activeCategories = useMemo(() => moduleDefinitions.find((item) => item.key === activeModule)?.categories ?? [], [activeModule]);

  function actors(detail?: ThreadDetail) {
    if (!detail) return { from: '-', to: '-' };
    const latest = detail.messages[detail.messages.length - 1];
    const from = latest?.sender?.email ?? 'system';
    const to = detail.participants
      .filter((p) => p.user.id !== latest?.sender?.id)
      .map((p) => p.user.email)
      .join(', ');
    return { from, to: to || detail.participants.map((p) => p.user.email).join(', ') || '-' };
  }

  async function loadThread(threadId: string) {
    const detail = await getMessageThread(threadId);
    setThreadDetails((current) => ({ ...current, [threadId]: detail }));
  }

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const categoryMatch = !activeCategories.length || (activeCategories as readonly string[]).includes(thread.category);
      if (!categoryMatch) return false;
      if (!search.trim()) return true;

      const detail = threadDetails[thread.id];
      const actorInfo = actors(detail);
      const haystack = [
        thread.subject,
        thread.category,
        thread.assetType ?? '',
        actorInfo.from,
        actorInfo.to,
        detail?.messages.map((message) => message.body).join(' ') ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search.toLowerCase());
    });
  }, [activeCategories, search, threadDetails, threads]);

  const selectedThreadResolved = useMemo(() => {
    if (selectedThread) return selectedThread;
    const fallbackId = filteredThreads[0]?.id;
    return fallbackId ? threadDetails[fallbackId] ?? null : null;
  }, [filteredThreads, selectedThread, threadDetails]);

  const supportSummary = useMemo(() => {
    const open = supportTickets.filter((ticket) => ['OPEN', 'TRIAGED', 'IN_PROGRESS'].includes(ticket.status)).length;
    const pending = supportTickets.filter((ticket) => ['WAITING_FOR_USER'].includes(ticket.status)).length;
    const resolved = supportTickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
    return { open, pending, resolved };
  }, [supportTickets]);

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => ['SCHEDULED', 'READY', 'LIVE'].includes(meeting.metadata.status))
      .sort((a, b) => new Date(a.metadata.startsAt).getTime() - new Date(b.metadata.startsAt).getTime())
      .slice(0, 4);
  }, [meetings]);

  async function refreshInbox() {
    const items = await getMyInboxThreads(selectedFolder);
    setThreads(items);
    setStarredByThread((current) => ({
      ...current,
      ...Object.fromEntries(items.map((item) => [item.id, Boolean(item.isStarred)])),
    }));
    const first = items[0]?.id ?? '';
    if (!selectedThreadId && first) {
      setSelectedThreadId(first);
    }
    await Promise.all(items.slice(0, 15).map((item) => loadThread(item.id)));
  }

  async function refreshSidePanels() {
    const [notifs, tickets, meetingList] = await Promise.all([
      getNotificationsList(),
      getSupportTickets(),
      listCommunicationMeetings(),
    ]);

    type NotificationListItem = (typeof notifs)[number];
    type TicketListItem = (typeof tickets)[number];
    type MeetingListItem = (typeof meetingList)[number];

    setNotifications(
      notifs
        .slice(0, 8)
        .map((item: NotificationListItem) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          createdAt: item.createdAt,
          isRead: item.isRead,
        })),
    );

    setSupportTickets(
      tickets
        .slice(0, 30)
        .map((item: TicketListItem) => ({ id: item.id, subject: item.subject, status: item.status })),
    );

    setMeetings(
      (meetingList as MeetingListItem[]).map((m: MeetingListItem) => ({
        room: { id: m.room.id },
        metadata: {
          title: m.metadata.title,
          startsAt: m.metadata.startsAt,
          status: m.metadata.status,
        },
      })),
    );
  }

  useEffect(() => {
    void Promise.all([refreshInbox(), refreshSidePanels()]);
    const timer = window.setInterval(() => {
      void Promise.all([refreshInbox(), refreshSidePanels()]);
    }, 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void refreshInbox();
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedThreadId) return;
    if (filteredThreads[0]?.id) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  async function createOrSendThread() {
    if (!subject.trim()) return setStatus('Enter a subject before sending.');
    if (!body.trim()) return setStatus('Write a message before sending.');

    setSending(true);
    try {
      if (!recipientId.trim()) return setStatus('Select a recipient before sending.');
      const category =
        activeModule === 'INVITATIONS'
          ? 'MEETING_INVITATION'
          : activeModule === 'DATASET'
            ? 'DATASET_REQUEST'
            : activeModule === 'STUDY'
              ? 'STUDY_REQUEST'
              : activeModule === 'PUBLICATION'
                ? 'APPROVAL_REQUEST'
                : activeModule === 'SUPPORT'
                  ? 'SUPPORT_TICKET'
                  : activeModule === 'ANNOUNCEMENTS'
                    ? 'ANNOUNCEMENT'
                    : 'ADMIN_MESSAGE';

      const created = await createMessageThread({
        subject: subject.trim(),
        category,
        participantIds: [recipientId.trim()],
        body: body.trim(),
        attachmentUrl: composeAttachmentUrl.trim() || undefined,
        sendEmailCopy: true,
      });
      const newId = (created.thread as { id?: string })?.id;
      if (newId) {
        setSelectedThreadId(newId);
        await loadThread(newId);
      }
      setStatus(`Message sent to ${recipientId.trim()}.`);
      setBody('');
      setComposeAttachmentUrl('');
      setComposeAttachmentName('');
      await refreshInbox();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function sendReply() {
    if (!selectedThreadId) return setStatus('Select a thread first.');
    if (!body.trim()) return setStatus('Write a reply before sending.');
    setSending(true);
    try {
      const replyBody = composerMode === 'Internal Note' ? `[Internal Note]\n${body.trim()}` : body.trim();
      await replyMessageThread(selectedThreadId, { body: replyBody, sendEmailCopy: replyScope === 'reply-all', attachmentUrl: replyAttachmentUrl.trim() || undefined });
      await markThreadRead(selectedThreadId);
      setBody('');
      setReplyAttachmentUrl('');
      setReplyAttachmentName('');
      await loadThread(selectedThreadId);
      await refreshInbox();
      setStatus(replyScope === 'reply-all' ? 'Reply all sent.' : 'Reply sent.');
      setReplyScope('reply');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  async function seedTemplateThread(template: typeof templateThreads[number]) {
    setSending(true);
    try {
      const created = await createMessageThread({
        subject: template.subject,
        category: template.category,
        participantIds: [recipientId.trim() || 'user-demo-id'],
        body: `Kickoff thread for ${template.subject}.`,
        assetType: template.assetType,
        assetId: template.assetId,
        attachmentUrl: composeAttachmentUrl.trim() || undefined,
        sendEmailCopy: true,
      });
      const newId = (created.thread as { id?: string })?.id;
      if (newId) {
        setSelectedThreadId(newId);
        await loadThread(newId);
      }
      await refreshInbox();
      setStatus('Template thread created.');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to create template thread.');
    } finally {
      setSending(false);
    }
  }

  async function archiveThread() {
    if (!selectedThreadId) return;
    setSending(true);
    try {
      await archiveMessageThread(selectedThreadId);
      setStatus('Thread archived.');
      setSelectedThreadId('');
      await refreshInbox();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to archive thread.');
    } finally {
      setSending(false);
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
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to update starred state.');
    }
  }

  async function editMeeting(roomId: string, title: string, startsAt: string) {
    const nextTitle = window.prompt('Edit meeting title', title)?.trim();
    if (!nextTitle) return;
    const nextStartsAt = window.prompt('Edit meeting start time (ISO)', startsAt)?.trim();
    if (!nextStartsAt) return;
    try {
      await updateCommunicationMeeting(roomId, { title: nextTitle, startsAt: nextStartsAt });
      setStatus('Meeting updated.');
      await refreshSidePanels();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to update meeting.');
    }
  }

  async function cancelMeeting(roomId: string) {
    if (!window.confirm('Cancel this meeting invitation?')) return;
    try {
      await cancelCommunicationMeeting(roomId);
      setStatus('Meeting cancelled.');
      await refreshSidePanels();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to cancel meeting.');
    }
  }

  async function deleteMeeting(roomId: string) {
    if (!window.confirm('Delete this meeting permanently?')) return;
    try {
      await deleteCommunicationMeeting(roomId);
      setStatus('Meeting deleted.');
      await refreshSidePanels();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete meeting.');
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

    setSending(true);
    try {
      const created = await createMessageThread({
        subject: composeSubject.trim(),
        category: 'ADMIN_MESSAGE',
        participantIds,
        recipientEmails,
        ccEmails,
        bccEmails,
        body: composeBody.trim(),
        attachmentUrl: composeAttachmentUrl.trim() || undefined,
        sendEmailCopy: true,
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
      setStatus('New message thread created.');
      await refreshInbox();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to create new thread.');
    } finally {
      setSending(false);
    }
  }

  function openForwardDraft(message: { sender: { email: string }; body: string; attachmentUrl?: string | null }) {
    const participantEmails = (selectedThreadResolved?.participants ?? []).map((participant) => participant.user.email).filter(Boolean);
    const ccRecipients = participantEmails.filter((email) => email !== message.sender.email);
    setComposeTo(message.sender.email);
    setComposeCc(ccRecipients.join(', '));
    setComposeBcc('');
    setComposeSubject(`Fwd: ${subject || selectedThreadResolved?.subject || 'Message'}`);
    setComposeBody(`Forwarded message from ${message.sender.email}\n\n${message.body}`);
    setComposeAttachmentUrl(message.attachmentUrl ?? '');
    setComposeAttachmentName(message.attachmentUrl ? 'Forwarded attachment' : '');
    setShowCcBcc(ccRecipients.length > 0);
    setComposeOpen(true);
    setStatus(`Forward draft opened for ${message.sender.email}.`);
  }

  function primeReplyComposer(message: { sender: { email: string }; body: string; createdAt: string; attachmentUrl?: string | null }, scope: ReplyScope) {
    setReplyScope(scope);
    setBody(`\n\nOn ${new Date(message.createdAt).toLocaleString()}, ${message.sender.email} wrote:\n${message.body}`);
    setReplyAttachmentUrl(message.attachmentUrl ?? '');
    setReplyAttachmentName(message.attachmentUrl ? 'Forwarded attachment' : '');
    setStatus(scope === 'reply-all' ? 'Reply all selected for this thread.' : 'Reply selected for this thread.');
    window.setTimeout(() => {
      replyBodyRef.current?.focus();
      replyBodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
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

  const participants = selectedThreadResolved?.participants ?? [];
  const attachments = (selectedThreadResolved?.messages ?? []).filter((message) => Boolean(message.attachmentUrl));
  const groupedThreads = useMemo(() => groupThreadsByDate(filteredThreads), [filteredThreads]);

  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTs(Date.now());
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <CommShell title="Research Communication Hub" subtitle="Inbox, invitations, support, and asset-linked conversations for project, study, dataset, analysis, and publication workflows." backHref="/admin/communication">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Inbox Threads" value={String(threads.length)} />
        <MetricCard label="Open Tickets" value={String(supportSummary.open)} />
        <MetricCard label="Pending Tickets" value={String(supportSummary.pending)} />
        <MetricCard label="Unread Notices" value={String(notifications.filter((notification) => !notification.isRead).length)} />
      </section>

      <section className="mt-6 rounded-[2rem] border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Search className="h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search messages, users, studies, datasets, publications"
            className="max-w-xl"
          />
          <p className="text-sm text-slate-500">{filteredThreads.length} matching threads</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr_340px]">
        <aside className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-black">Hub Modules</h2>
          {moduleDefinitions.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              className={`mb-2 flex w-full items-center rounded-2xl p-3 text-left font-bold transition ${activeModule === item.key ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-100'}`}
            >
              {item.key === 'INBOX' ? <Inbox className="mr-3 h-5 w-5" /> : item.key === 'SUPPORT' ? <Ticket className="mr-3 h-5 w-5" /> : item.key === 'ANNOUNCEMENTS' ? <Megaphone className="mr-3 h-5 w-5" /> : <Users className="mr-3 h-5 w-5" />}
              {item.label}
            </button>
          ))}

          <div className="mt-5 rounded-2xl border bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-700">Suggested Thread Starters</p>
            <div className="mt-2 space-y-2">
              {templateThreads.map((template) => (
                <button
                  key={template.subject}
                  onClick={() => void seedTemplateThread(template)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {template.subject}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="rounded-[2rem] border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Conversation Thread</h2>
              <p className="text-sm text-slate-500">Inbox list to select thread to read and reply</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setComposeOpen(true)}>Compose</Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => selectedThreadId && void toggleThreadStar(selectedThreadId)}
                disabled={!selectedThreadId}
              >
                <Star className="mr-2 h-4 w-4" /> {selectedThreadId && starredByThread[selectedThreadId] ? 'Unstar' : 'Star'} Thread
              </Button>
              <Button className="rounded-2xl bg-pink-600" onClick={() => void archiveThread()} disabled={!selectedThreadId || sending}>Archive Thread</Button>
            </div>
          </div>

          <div className="mb-5 rounded-3xl border bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="Recipient user ID" />
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
            </div>
            <Textarea ref={replyBodyRef} value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="mt-3" placeholder="Write the message body here..." />
            <div className="mt-3 space-y-1">
              <div className="flex gap-2">
                <Input value={replyAttachmentUrl} onChange={(event) => setReplyAttachmentUrl(event.target.value)} placeholder="Reply attachment URL (optional)" />
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => replyAttachmentInputRef.current?.click()}>
                  Attach
                </Button>
              </div>
              <input ref={replyAttachmentInputRef} type="file" accept="*/*" className="hidden" onChange={handleReplyAttachmentChange} />
              <p className="text-xs text-slate-500">{replyAttachmentName ? `Attached: ${replyAttachmentName}` : 'Used when sending a reply on the selected thread.'}</p>
            </div>
            <div className="mt-3 flex gap-2">
              {(['Message', 'Internal Note'] as ComposerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setComposerMode(mode)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${composerMode === mode ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {mode}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReplyScope('reply')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${replyScope === 'reply' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => setReplyScope('reply-all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${replyScope === 'reply-all' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Reply all
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Status: {status}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void createOrSendThread()} disabled={sending} className="rounded-2xl bg-pink-600">
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Sending...' : 'Create / Send Thread'}
                </Button>
                <Button onClick={() => void sendReply()} disabled={sending || !selectedThreadId || !body.trim()} variant="outline" className="rounded-2xl">
                  <Send className="mr-2 h-4 w-4" /> {replyScope === 'reply-all' ? 'Send Reply All' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {folderTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFolder(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedFolder === tab.key ? 'bg-pink-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

            <div className="space-y-2.5">
              <div className="rounded-3xl border bg-white p-4">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b pb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                <div>From: Sender Email</div>
                <div>To: Receiver Email</div>
                <div>{selectedFolder === 'sent' ? 'Sent Subject' : 'Subject'}</div>
              </div>
              <ScrollArea className="mt-2 h-64">
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
                          className={`grid w-full grid-cols-[1fr_1fr_1fr] gap-3 rounded-2xl border p-3 text-left text-sm transition ${selectedThreadId === thread.id ? 'border-pink-400 bg-pink-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                        >
                          <div className="truncate text-slate-700">{actors(threadDetails[thread.id]).from}</div>
                          <div className="truncate text-slate-700">{actors(threadDetails[thread.id]).to}</div>
                          <div className="flex items-center justify-between gap-2 font-semibold text-slate-900">
                            <span className="truncate">{thread.subject}</span>
                            <span className="shrink-0 text-[11px] font-medium text-slate-500">{formatThreadStamp(thread.updatedAt)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                  {!filteredThreads.length ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">No inbox threads yet.</p> : null}
                </div>
              </ScrollArea>
            </div>

            {selectedThreadResolved ? (
              <div className="rounded-3xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Thread Messages</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full border bg-white px-2.5 py-1">Reply / Reply all / Forward attached to each message</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">Category: {filteredThreads.find((thread) => thread.id === (selectedThreadResolved?.id ?? ''))?.category ?? 'N/A'}</Badge>
                  <Badge variant="outline">Asset: {filteredThreads.find((thread) => thread.id === (selectedThreadResolved?.id ?? ''))?.assetType ?? 'None'}</Badge>
                  <Badge variant="outline">Asset ID: {filteredThreads.find((thread) => thread.id === (selectedThreadResolved?.id ?? ''))?.assetId ?? 'N/A'}</Badge>
                </div>
                <ScrollArea className="mt-2 h-48">
                  <div className="space-y-2 pr-2">
                    {selectedThreadResolved.messages.map((message) => (
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
                              primeReplyComposer(message, 'reply');
                            }}
                            className="rounded-full border px-3 py-1 hover:bg-slate-50"
                          >
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              primeReplyComposer(message, 'reply-all');
                            }}
                            className="rounded-full border px-3 py-1 hover:bg-slate-50"
                          >
                            Reply all
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              primeReplyComposer(message, 'reply');
                              replyAttachmentInputRef.current?.click();
                            }}
                            className="rounded-full border px-3 py-1 hover:bg-slate-50"
                          >
                            Attach
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
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700"><Users className="h-4 w-4" /> Participants</h3>
            <div className="mt-3 space-y-2">
              {participants.map((participant) => {
                const online = participant.lastReadAt ? nowTs - new Date(participant.lastReadAt).getTime() < 5 * 60 * 1000 : false;
                return (
                  <div key={participant.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
                    <div className="font-semibold text-slate-900">{participant.user.email}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{online ? 'Online' : 'Offline'}</span>
                      <span>{participant.lastReadAt ? `Last Active: ${new Date(participant.lastReadAt).toLocaleString()}` : 'Last Active: N/A'}</span>
                    </div>
                  </div>
                );
              })}
              {!participants.length ? <p className="text-sm text-slate-500">No participants loaded.</p> : null}
            </div>
            {selectedThreadId ? (
              <button
                type="button"
                className="mt-3 w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setMutedByThread((current) => ({ ...current, [selectedThreadId]: !current[selectedThreadId] }))}
              >
                {mutedByThread[selectedThreadId] ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
            ) : null}
          </div>

          <div className="rounded-[2rem] border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700"><Paperclip className="h-4 w-4" /> Attachments</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="rounded-xl border bg-slate-50 p-3">
                  {attachment.attachmentUrl}
                </div>
              ))}
              {!attachments.length ? <p className="text-sm text-slate-500">No attachments in this thread.</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700"><Bell className="h-4 w-4" /> Notifications</h3>
            <div className="mt-3 space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-900">{notification.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{notification.description ?? ''}</div>
                </div>
              ))}
              {!notifications.length ? <p className="text-sm text-slate-500">No notifications.</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700"><CalendarClock className="h-4 w-4" /> Meeting Invitations</h3>
            <div className="mt-3 space-y-2">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.room.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-900">{meeting.metadata.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(meeting.metadata.startsAt).toLocaleString()}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl bg-pink-600 text-white hover:bg-pink-700"
                      onClick={() => router.push(`/admin/communication/${meeting.room.id}?mode=video&pane=rzooma`)}
                    >
                      Join R-Zooma
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void editMeeting(meeting.room.id, meeting.metadata.title, meeting.metadata.startsAt)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void cancelMeeting(meeting.room.id)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void deleteMeeting(meeting.room.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!upcomingMeetings.length ? <p className="text-sm text-slate-500">No upcoming meetings.</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-700"><Ticket className="h-4 w-4" /> Support Center</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl border bg-slate-50 p-2">
                <div className="font-black text-slate-900">{supportSummary.open}</div>
                <div className="text-xs text-slate-500">Open</div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-2">
                <div className="font-black text-slate-900">{supportSummary.pending}</div>
                <div className="text-xs text-slate-500">Pending</div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-2">
                <div className="font-black text-slate-900">{supportSummary.resolved}</div>
                <div className="text-xs text-slate-500">Resolved</div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {composeOpen ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border bg-white shadow-2xl">
            <div className="grid min-h-155 md:grid-cols-[240px_1fr]">
              <aside className="border-r bg-slate-100 p-4">
                <Button className="mb-4 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700">Compose</Button>
                <div className="space-y-2 text-sm">
                  {([
                    ['Inbox', 'inbox', String(threads.length), Inbox],
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
                  <Button className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700" disabled={sending} onClick={() => void createFromCompose()}>
                    {sending ? 'Sending...' : 'Send'}
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
