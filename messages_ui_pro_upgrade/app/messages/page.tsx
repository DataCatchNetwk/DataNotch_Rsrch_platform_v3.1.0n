'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Inbox,
  Mail,
  Menu,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Smile,
  Star,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';

type ThreadStatus = 'Open' | 'Closed' | 'Pending';
type Priority = 'Low' | 'Normal' | 'High';
type ThreadCategory = 'DATASET_REQUEST' | 'MEETING_INVITE' | 'ANALYSIS_UPDATE' | 'SUPPORT' | 'ANNOUNCEMENT' | 'DIRECT_MESSAGE';
type ComposerMode = 'Message' | 'Internal Note';

type ThreadItem = {
  id: number;
  sender: string;
  avatar?: string;
  icon?: React.ReactNode;
  time: string;
  subject: string;
  preview: string;
  unread: number;
  category: ThreadCategory;
  status: ThreadStatus;
  priority: Priority;
  assetName?: string;
  assetVersion?: string;
  muted?: boolean;
  starred?: boolean;
};

type ThreadMessage = {
  id: number;
  threadId: number;
  sender: string;
  avatar: string;
  time: string;
  content: string;
  isMe?: boolean;
  mode?: ComposerMode;
  attachment?: { label: string; size: string };
};

type Participant = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
};

const avatar = (name: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

const initialThreads: ThreadItem[] = [
  { id: 1, sender: 'Dr. Sarah Johnson', avatar: avatar('sarah-johnson'), time: '2:15 PM', subject: 'Dataset Approval Request', preview: 'Please review the Clinical_SDOH_v5 dataset...', unread: 2, category: 'DATASET_REQUEST', status: 'Open', priority: 'Normal', assetName: 'Clinical_SDOH_v5 Dataset', assetVersion: 'Version 2.1' },
  { id: 2, sender: 'Admin Team', icon: <Users className="h-5 w-5 text-violet-700" />, time: '11:45 AM', subject: 'Study Review Meeting Invitation', preview: 'You are invited to the study review meeting...', unread: 1, category: 'MEETING_INVITE', status: 'Pending', priority: 'Normal', assetName: 'NeuroTwinFM Phase 2' },
  { id: 3, sender: 'Michael Chen', avatar: avatar('michael-chen'), time: 'Yesterday', subject: 'Data Analysis Update', preview: 'The analysis for Phase 2 is complete...', unread: 1, category: 'ANALYSIS_UPDATE', status: 'Open', priority: 'Low', assetName: 'Phase 2 Analysis' },
  { id: 4, sender: 'Data Steward Team', icon: <Users className="h-5 w-5 text-violet-700" />, time: 'Yesterday', subject: 'Metadata Validation', preview: 'We have validated the metadata for your dataset...', unread: 0, category: 'DATASET_REQUEST', status: 'Open', priority: 'Normal', assetName: 'Clinical Metadata' },
  { id: 5, sender: 'Support Center', icon: <HelpCircle className="h-5 w-5 text-orange-600" />, time: 'Jul 1', subject: 'Ticket #SUP-2026-1287', preview: 'Your support ticket has been updated...', unread: 0, category: 'SUPPORT', status: 'Open', priority: 'High' },
  { id: 6, sender: 'System Notifications', icon: <Bell className="h-5 w-5 text-blue-700" />, time: 'Jun 30', subject: 'Platform Maintenance', preview: 'Scheduled maintenance on July 5, 2026...', unread: 0, category: 'ANNOUNCEMENT', status: 'Closed', priority: 'Low' },
];

const initialMessages: Record<number, ThreadMessage[]> = {
  1: [
    { id: 1, threadId: 1, sender: 'Dr. Sarah Johnson', avatar: avatar('sarah-johnson'), time: 'Today, 2:15 PM', content: 'Hello Emily,\n\nPlease review the Clinical_SDOH_v5 dataset and provide your approval. The dataset includes updated demographic and clinical variables.\n\nThanks,\nSarah', attachment: { label: 'Clinical_SDOH_v5_Dictionary.pdf', size: '2.4 MB' } },
    { id: 2, threadId: 1, sender: 'Emily Davis', avatar: avatar('emily-davis'), time: 'Today, 2:18 PM', content: 'Hi Sarah,\n\nI have reviewed the dataset. Everything looks good. I approve the dataset for publication.\n\nLet me know if any changes are required.\n\nBest,\nEmily', isMe: true },
    { id: 3, threadId: 1, sender: 'Dr. Sarah Johnson', avatar: avatar('sarah-johnson'), time: 'Today, 2:21 PM', content: 'Thank you, Emily! I will proceed with the next steps.\n\nAppreciate your quick review.\n\nBest,\nSarah' },
  ],
  2: [{ id: 4, threadId: 2, sender: 'Admin Team', avatar: avatar('admin-team'), time: 'Today, 11:45 AM', content: 'You are invited to the Study Review Meeting for NeuroTwinFM Phase 2. Please confirm your availability.' }],
  3: [{ id: 5, threadId: 3, sender: 'Michael Chen', avatar: avatar('michael-chen'), time: 'Yesterday', content: 'The analysis for Phase 2 is complete and ready for your review.' }],
};

const participants: Participant[] = [
  { id: 'p1', name: 'Dr. Sarah Johnson', role: 'Principal Investigator', avatar: avatar('sarah-johnson'), online: true },
  { id: 'p2', name: 'Emily Davis (You)', role: 'Data Analyst', avatar: avatar('emily-davis'), online: true },
  { id: 'p3', name: 'Michael Chen', role: 'Data Steward', avatar: avatar('michael-chen'), online: false },
];

export default function ResearchMessagesPage() {
  const [threads, setThreads] = useState(initialThreads);
  const [threadMessages, setThreadMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'Inbox' | 'All' | 'Unread' | 'Starred'>('Inbox');
  const [query, setQuery] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerMode>('Message');
  const [draft, setDraft] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'thread' | 'details'>('list');

  const selectedThread = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  const selectedMessages = threadMessages[selectedThread?.id] ?? [];

  const visibleThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesFilter =
        activeFilter === 'All' ||
        activeFilter === 'Inbox' ||
        (activeFilter === 'Unread' && thread.unread > 0) ||
        (activeFilter === 'Starred' && thread.starred);
      const text = `${thread.sender} ${thread.subject} ${thread.preview} ${thread.assetName ?? ''}`.toLowerCase();
      return matchesFilter && text.includes(query.toLowerCase());
    });
  }, [activeFilter, query, threads]);

  function selectThread(id: number) {
    setSelectedId(id);
    setMobilePane('thread');
    setThreads((items) => items.map((item) => (item.id === id ? { ...item, unread: 0 } : item)));
  }

  function sendReply() {
    if (!draft.trim() || !selectedThread) return;
    const message: ThreadMessage = {
      id: Date.now(),
      threadId: selectedThread.id,
      sender: 'Emily Davis',
      avatar: avatar('emily-davis'),
      time: 'Just now',
      content: draft.trim(),
      isMe: true,
      mode: composerMode,
    };
    setThreadMessages((current) => ({ ...current, [selectedThread.id]: [...(current[selectedThread.id] ?? []), message] }));
    setThreads((items) =>
      items.map((item) =>
        item.id === selectedThread.id
          ? { ...item, preview: draft.trim(), time: 'Just now', status: item.status === 'Closed' ? 'Open' : item.status }
          : item,
      ),
    );
    setDraft('');
  }

  function createThread(formData: FormData) {
    const subject = String(formData.get('subject') || 'New message');
    const recipient = String(formData.get('recipient') || 'Research Team');
    const body = String(formData.get('body') || '');
    const id = Date.now();
    const newThread: ThreadItem = {
      id,
      sender: recipient,
      avatar: avatar(recipient),
      time: 'Just now',
      subject,
      preview: body,
      unread: 0,
      category: 'DIRECT_MESSAGE',
      status: 'Open',
      priority: 'Normal',
    };
    setThreads((items) => [newThread, ...items]);
    setThreadMessages((current) => ({
      ...current,
      [id]: [{ id: Date.now(), threadId: id, sender: 'Emily Davis', avatar: avatar('emily-davis'), time: 'Just now', content: body, isMe: true }],
    }));
    setSelectedId(id);
    setComposeOpen(false);
    setMobilePane('thread');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7fb] text-zinc-900">
      <IconRail />

      <section className={`${mobilePane === 'list' ? 'flex' : 'hidden'} w-full flex-col border-r border-zinc-200 bg-white md:flex md:w-[420px] xl:w-[460px]`}>
        <Header onCompose={() => setComposeOpen(true)} />
        <Filters activeFilter={activeFilter} setActiveFilter={setActiveFilter} query={query} setQuery={setQuery} />
        <ThreadList threads={visibleThreads} selectedId={selectedId} onSelect={selectThread} />
      </section>

      <main className={`${mobilePane === 'thread' ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-white md:flex`}>
        <ThreadHeader thread={selectedThread} onBack={() => setMobilePane('list')} onDetails={() => setMobilePane('details')} onToggleStar={() => setThreads((items) => items.map((item) => item.id === selectedThread.id ? { ...item, starred: !item.starred } : item))} />
        <MessageStream messages={selectedMessages} />
        <ReplyComposer mode={composerMode} setMode={setComposerMode} draft={draft} setDraft={setDraft} onSend={sendReply} />
      </main>

      <aside className={`${mobilePane === 'details' ? 'block' : 'hidden'} w-full overflow-y-auto border-l border-zinc-200 bg-white md:block md:w-[340px] xl:w-[380px]`}>
        <ThreadDetails thread={selectedThread} onBack={() => setMobilePane('thread')} onToggleMute={() => setThreads((items) => items.map((item) => item.id === selectedThread.id ? { ...item, muted: !item.muted } : item))} />
      </aside>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onCreate={createThread} />}
    </div>
  );
}

function IconRail() {
  const items = [Home, Inbox, Users, FolderOpen, BarChart3, Settings];
  return (
    <nav className="hidden w-16 flex-col items-center border-r border-zinc-200 bg-white py-6 md:flex">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white shadow-lg shadow-violet-200">M</div>
      <div className="flex flex-col gap-7 text-zinc-400">
        {items.map((Icon, index) => <Icon key={index} className="h-5 w-5 cursor-pointer transition hover:text-violet-600" />)}
      </div>
      <img src={avatar('jerry')} alt="Profile" className="mt-auto h-10 w-10 rounded-full ring-4 ring-violet-100" />
    </nav>
  );
}

function Header({ onCompose }: { onCompose: () => void }) {
  return (
    <header className="border-b border-zinc-100 px-5 py-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Messages</h1>
          <p className="text-sm text-zinc-500">Communicate with admins, teams, and collaborators</p>
        </div>
        <button onClick={onCompose} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700">
          <Plus className="h-4 w-4" /> Compose
        </button>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
        <Search className="h-4 w-4" />
        <span className="flex-1">Search people, research assets, messages...</span>
        <UserRound className="h-5 w-5 text-violet-600" />
      </div>
    </header>
  );
}

function Filters(props: { activeFilter: 'Inbox' | 'All' | 'Unread' | 'Starred'; setActiveFilter: (value: 'Inbox' | 'All' | 'Unread' | 'Starred') => void; query: string; setQuery: (value: string) => void }) {
  const tabs: Array<typeof props.activeFilter> = ['Inbox', 'All', 'Unread', 'Starred'];
  return (
    <div className="border-b border-zinc-100 p-4">
      <div className="mb-4 grid grid-cols-4 rounded-2xl bg-zinc-100 p-1 text-sm">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => props.setActiveFilter(tab)} className={`rounded-xl py-2 transition ${props.activeFilter === tab ? 'bg-white font-semibold text-violet-700 shadow-sm' : 'text-zinc-500 hover:bg-white/70'}`}>{tab}</button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
        <input value={props.query} onChange={(e) => props.setQuery(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50" placeholder="Search messages..." />
      </div>
    </div>
  );
}

function ThreadList({ threads, selectedId, onSelect }: { threads: ThreadItem[]; selectedId: number; onSelect: (id: number) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((thread) => (
        <button key={thread.id} onClick={() => onSelect(thread.id)} className={`block w-full border-b border-zinc-100 px-5 py-4 text-left transition hover:bg-zinc-50 ${selectedId === thread.id ? 'border-l-4 border-l-violet-600 bg-violet-50/70' : ''}`}>
          <div className="flex gap-3.5">
            {thread.avatar ? <img src={thread.avatar} alt="" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-zinc-200" /> : <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">{thread.icon}</div>}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate font-semibold">{thread.sender}</div>
                <div className="shrink-0 text-xs text-zinc-500">{thread.time}</div>
              </div>
              <div className="mt-0.5 truncate text-sm font-medium text-zinc-900">{thread.subject}</div>
              <div className="mt-1 truncate text-sm text-zinc-500">{thread.preview}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {thread.unread > 0 && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{thread.unread} new</span>}
                <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[10px] tracking-wider text-amber-700">{thread.category}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ThreadHeader({ thread, onBack, onDetails, onToggleStar }: { thread: ThreadItem; onBack: () => void; onDetails: () => void; onToggleStar: () => void }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-100 bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <button onClick={onBack} className="rounded-xl p-2 hover:bg-zinc-100 md:hidden"><Menu className="h-5 w-5" /></button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">📊</div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold md:text-xl">{thread.subject}</h2>
          <p className="truncate text-sm text-emerald-600">{thread.assetName ?? thread.category} {thread.assetName ? `• ${thread.category}` : ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-zinc-400">
        <Star onClick={onToggleStar} className={`h-5 w-5 cursor-pointer hover:text-amber-500 ${thread.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
        <Archive className="hidden h-5 w-5 cursor-pointer hover:text-zinc-700 sm:block" />
        <Trash2 className="hidden h-5 w-5 cursor-pointer hover:text-red-500 sm:block" />
        <button onClick={onDetails} className="rounded-xl p-2 hover:bg-zinc-100 md:hidden"><MoreVertical className="h-5 w-5" /></button>
      </div>
    </header>
  );
}

function MessageStream({ messages }: { messages: ThreadMessage[] }) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f8fb] p-5 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
            {!message.isMe && <img src={message.avatar} alt="" className="mr-4 mt-1 h-9 w-9 rounded-2xl" />}
            <div className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-sm md:max-w-[68%] ${message.isMe ? 'bg-violet-600 text-white' : 'border border-zinc-100 bg-white text-zinc-800'}`}>
              <div className="mb-2 flex items-center gap-2 text-xs opacity-70">
                <span>{message.time}</span>
                {message.mode === 'Internal Note' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Internal Note</span>}
              </div>
              <div className="whitespace-pre-line text-[15px] leading-relaxed">{message.content}</div>
              {message.attachment && <div className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 text-zinc-700"><FileText className="h-5 w-5 text-violet-600" /><div><div className="text-sm font-medium">{message.attachment.label}</div><div className="text-xs text-zinc-500">{message.attachment.size}</div></div></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyComposer({ mode, setMode, draft, setDraft, onSend }: { mode: ComposerMode; setMode: (mode: ComposerMode) => void; draft: string; setDraft: (value: string) => void; onSend: () => void }) {
  return (
    <footer className="border-t border-zinc-100 bg-white p-4">
      <div className="mb-3 flex gap-2">
        {(['Message', 'Internal Note'] as ComposerMode[]).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-full px-4 py-1.5 text-sm transition ${mode === item ? 'bg-violet-100 font-semibold text-violet-700' : 'text-zinc-500 hover:bg-zinc-100'}`}>{item}</button>)}
      </div>
      <div className="flex items-center rounded-3xl border border-zinc-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex gap-3 border-r border-zinc-200 pr-4 text-zinc-400"><Paperclip className="h-5 w-5" /><Smile className="h-5 w-5" /><CalendarDays className="h-5 w-5" /></div>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }} placeholder={mode === 'Internal Note' ? 'Write an internal note...' : 'Type your message...'} className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none" />
        <button onClick={onSend} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"><Send className="h-4 w-4" /> Send</button>
      </div>
    </footer>
  );
}

function ThreadDetails({ thread, onBack, onToggleMute }: { thread: ThreadItem; onBack: () => void; onToggleMute: () => void }) {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="rounded-xl p-2 hover:bg-zinc-100 md:hidden"><X className="h-5 w-5" /></button>
        <h3 className="text-lg font-semibold">Thread Details</h3>
        <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">{thread.status}</span>
      </div>
      <div className="mb-8 space-y-5 text-sm">
        <Detail label="Priority" value={<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{thread.priority}</span>} />
        <Detail label="Category" value={<span className="font-mono text-xs text-violet-700">{thread.category}</span>} />
        <Detail label="Created" value="Jul 2, 2026, 2:15 PM" />
        <Detail label="Last Updated" value={thread.time} />
      </div>
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">Participants ({participants.length})</h4><Plus className="h-4 w-4 cursor-pointer text-violet-600" /></div>
        <div className="space-y-4">
          {participants.map((p) => <div key={p.id} className="flex items-center gap-3"><div className="relative"><img src={p.avatar} alt="" className="h-10 w-10 rounded-2xl" />{p.online && <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />}</div><div><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-zinc-500">{p.role}</div></div></div>)}
        </div>
      </section>
      <section className="mb-8">
        <h4 className="mb-3 font-semibold">Attachments (1)</h4>
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 transition hover:bg-zinc-50"><div className="text-4xl">📕</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">Clinical_SDOH_v5_Dictionary.pdf</div><div className="text-xs text-zinc-500">2.4 MB</div></div><Download className="h-5 w-5 text-zinc-400" /></div>
      </section>
      <section className="mb-8">
        <h4 className="mb-3 font-semibold">Associated Asset</h4>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5"><div className="flex items-center gap-4"><div className="text-4xl">📊</div><div><div className="font-semibold">{thread.assetName ?? 'No linked asset'}</div><div className="text-xs text-zinc-500">{thread.assetVersion ?? 'Research communication thread'}</div></div></div><button className="mt-6 w-full rounded-2xl border border-violet-200 py-3 text-sm font-semibold text-violet-700 transition hover:bg-white">View</button></div>
      </section>
      <section className="border-t border-zinc-100 pt-6 text-sm">
        <h4 className="mb-4 font-semibold">Actions</h4>
        <div className="space-y-4 text-zinc-600">
          <button className="flex items-center gap-3 hover:text-violet-600"><Mail className="h-4 w-4" /> Mark as Unread</button>
          <button className="flex items-center gap-3 hover:text-violet-600"><Archive className="h-4 w-4" /> Archive Thread</button>
          <button onClick={onToggleMute} className="flex w-full items-center justify-between"><span className="flex items-center gap-3"><Bell className="h-4 w-4" /> Mute Notifications</span><span className={`relative h-5 w-9 rounded-full transition ${thread.muted ? 'bg-violet-600' : 'bg-zinc-200'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${thread.muted ? 'left-4' : 'left-0.5'}`} /></span></button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="mb-1 text-zinc-500">{label}</div><div className="font-medium">{value}</div></div>;
}

function ComposeModal({ onClose, onCreate }: { onClose: () => void; onCreate: (formData: FormData) => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <form action={onCreate} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between"><div><h3 className="text-xl font-semibold">Compose New Message</h3><p className="text-sm text-zinc-500">Create a platform inbox thread or research asset message.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-zinc-100"><X className="h-5 w-5" /></button></div>
        <div className="space-y-4">
          <input name="recipient" placeholder="Recipient or team" className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
          <input name="subject" placeholder="Subject" className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
          <textarea name="body" rows={6} placeholder="Write message..." className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-2xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50">Cancel</button><button className="rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Send Message</button></div>
      </form>
    </div>
  );
}
