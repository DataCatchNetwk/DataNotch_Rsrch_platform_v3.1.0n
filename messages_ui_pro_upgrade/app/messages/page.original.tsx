'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Inbox,
  Mail,
  Menu,
  MoreVertical,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Star,
  Trash2,
  UserRound,
  Users,
  AtSign,
} from 'lucide-react';

type ThreadStatus = 'Open' | 'Closed' | 'Pending';
type Priority = 'Low' | 'Normal' | 'High';
type ThreadCategory = 'DATASET_REQUEST' | 'MEETING_INVITE' | 'ANALYSIS_UPDATE' | 'SUPPORT' | 'ANNOUNCEMENT';

type Participant = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
  tag?: string;
};

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
  dateLabel: string;
};

type ThreadMessage = {
  id: number;
  sender: string;
  avatar: string;
  time: string;
  content: string;
  isMe?: boolean;
  attachment?: {
    label: string;
    size: string;
  };
  reaction?: string;
};

const avatar = (name: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;

const threadItems: ThreadItem[] = [
  {
    id: 1,
    sender: 'Dr. Sarah Johnson',
    avatar: avatar('sarah-johnson'),
    time: '2:15 PM',
    dateLabel: 'Today',
    subject: 'Dataset Approval Request',
    preview: 'Please review the Clinical_SDOH_v5 dataset...',
    unread: 2,
    category: 'DATASET_REQUEST',
    status: 'Open',
    priority: 'Normal',
    assetName: 'Clinical_SDOH_v5 Dataset',
  },
  {
    id: 2,
    sender: 'Admin Team',
    icon: <Users className="h-5 w-5 text-violet-700" />,
    time: '11:45 AM',
    dateLabel: 'Today',
    subject: 'Study Review Meeting Invitation',
    preview: 'You are invited to the study review meeting...',
    unread: 1,
    category: 'MEETING_INVITE',
    status: 'Pending',
    priority: 'Normal',
    assetName: 'NeuroTwinFM Phase 2',
  },
  {
    id: 3,
    sender: 'Michael Chen',
    avatar: avatar('michael-chen'),
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    subject: 'Data Analysis Update',
    preview: 'The analysis for Phase 2 is complete...',
    unread: 1,
    category: 'ANALYSIS_UPDATE',
    status: 'Open',
    priority: 'Low',
    assetName: 'Phase 2 Analysis',
  },
  {
    id: 4,
    sender: 'Data Steward Team',
    icon: <Users className="h-5 w-5 text-violet-700" />,
    time: 'Yesterday',
    dateLabel: 'Yesterday',
    subject: 'Metadata Validation',
    preview: 'We have validated the metadata for your...',
    unread: 0,
    category: 'DATASET_REQUEST',
    status: 'Open',
    priority: 'Normal',
    assetName: 'Clinical Metadata',
  },
  {
    id: 5,
    sender: 'Support Center',
    icon: <HelpCircle className="h-5 w-5 text-orange-600" />,
    time: 'Jul 1',
    dateLabel: 'Jul 1',
    subject: 'Ticket #SUP-2026-1287',
    preview: 'Your support ticket has been updated...',
    unread: 0,
    category: 'SUPPORT',
    status: 'Open',
    priority: 'High',
  },
  {
    id: 6,
    sender: 'Dr. James Wilson',
    avatar: avatar('james-wilson'),
    time: 'Jun 30',
    dateLabel: 'Jun 30',
    subject: 'Publication Collaboration',
    preview: "Let's discuss the outline for the manuscript...",
    unread: 0,
    category: 'ANALYSIS_UPDATE',
    status: 'Open',
    priority: 'Normal',
    assetName: 'Publication Draft',
  },
  {
    id: 7,
    sender: 'System Notifications',
    icon: <Bell className="h-5 w-5 text-blue-700" />,
    time: 'Jun 30',
    dateLabel: 'Jun 30',
    subject: 'Platform Maintenance',
    preview: 'Scheduled maintenance on July 5, 2026...',
    unread: 0,
    category: 'ANNOUNCEMENT',
    status: 'Closed',
    priority: 'Low',
  },
];

const messages: ThreadMessage[] = [
  {
    id: 1,
    sender: 'Dr. Sarah Johnson',
    avatar: avatar('sarah-johnson'),
    time: 'Today, 2:15 PM',
    content:
      'Hello Emily,\n\nPlease review the Clinical_SDOH_v5 dataset and provide your approval. The dataset includes updated demographic and clinical variables.\n\nThanks,\nSarah',
    attachment: { label: 'Dataset: Clinical_SDOH_v5', size: '2.4 MB' },
  },
  {
    id: 2,
    sender: 'Emily Davis',
    avatar: avatar('emily-davis'),
    time: 'Today, 2:18 PM',
    content:
      'Hi Sarah,\n\nI have reviewed the dataset. Everything looks good. I approve the dataset for publication.\n\nLet me know if any changes are required.\n\nBest,\nEmily',
    isMe: true,
  },
  {
    id: 3,
    sender: 'Dr. Sarah Johnson',
    avatar: avatar('sarah-johnson'),
    time: 'Today, 2:21 PM',
    content: 'Thank you, Emily! I will proceed with the next steps.\nAppreciate your quick review.\n\nBest,\nSarah',
    reaction: '👍 1',
  },
];

const participants: Participant[] = [
  { id: '1', name: 'Dr. Sarah Johnson', role: 'Principal Investigator', avatar: avatar('sarah-johnson'), online: true, tag: 'Initiator' },
  { id: '2', name: 'Emily Davis (You)', role: 'Data Analyst', avatar: avatar('emily-davis'), online: true },
  { id: '3', name: 'Michael Chen', role: 'Data Steward', avatar: avatar('michael-chen'), online: false },
];

const primaryNav = [
  { label: 'Overview', icon: Home },
  { label: 'Activity', icon: ShieldCheck },
];

const communicationNav = [
  { label: 'My Messages', count: 24, icon: Mail, active: true },
  { label: 'Sent', icon: Send },
  { label: 'Drafts', count: 3, icon: FileText },
  { label: 'Mentions', count: 5, icon: AtSign },
  { label: 'Starred', icon: Star },
  { label: 'Trash', icon: Trash2 },
];

const channels = [
  { label: 'Announcements', icon: Bell },
  { label: 'General', icon: MessageCircleIcon },
  { label: 'Project Alpha', icon: Briefcase },
  { label: 'Data Stewardship', icon: AtSign },
  { label: 'Support', icon: HelpCircle },
];

const assets = [
  { label: 'My Datasets', icon: Archive },
  { label: 'My Studies', icon: FileText },
  { label: 'My Publications', icon: FileText },
];

function MessageCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Mail {...props} />;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function MessagesDashboard() {
  const [selectedThreadId, setSelectedThreadId] = useState(1);
  const [filter, setFilter] = useState<'Inbox' | 'All' | 'Unread' | 'Starred'>('Inbox');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [muted, setMuted] = useState(false);

  const selectedThread = threadItems.find((thread) => thread.id === selectedThreadId) ?? threadItems[0];

  const filteredThreads = useMemo(() => {
    return threadItems.filter((thread) => {
      const matchesSearch = `${thread.sender} ${thread.subject} ${thread.preview} ${thread.assetName ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === 'Unread' ? thread.unread > 0 : true;
      return matchesSearch && matchesFilter;
    });
  }, [filter, search]);

  function sendMessage() {
    if (!draft.trim()) return;
    setDraft('');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faff] text-slate-950">
      <div className="flex min-h-screen">
        <Rail />
        <SideNavigation />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopHeader />

          <div className="grid min-h-0 flex-1 grid-cols-[370px_minmax(520px,1fr)_330px] gap-4 p-4 xl:gap-5 xl:p-5">
            <InboxPanel
              threads={filteredThreads}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
            />

            <ThreadPanel thread={selectedThread} draft={draft} setDraft={setDraft} sendMessage={sendMessage} />

            <ThreadDetails thread={selectedThread} muted={muted} setMuted={setMuted} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Rail() {
  return (
    <aside className="hidden w-[64px] shrink-0 flex-col items-center border-r border-slate-900/10 bg-[#070d24] py-5 text-slate-300 lg:flex">
      <div className="mb-9 grid h-9 w-9 place-items-center rounded-2xl bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/25">
        <span className="text-xl">✺</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-3">
        {[Home, Briefcase, Archive, Inbox, Send, FileText, Trash2].map((Icon, index) => (
          <button
            key={index}
            className={classNames(
              'grid h-10 w-10 place-items-center rounded-xl transition hover:bg-white/10 hover:text-white',
              index === 3 && 'bg-violet-600 text-white shadow-lg shadow-violet-700/30'
            )}
            aria-label={`Navigation icon ${index + 1}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </button>
        <img src={avatar('emily-davis')} alt="Emily Davis" className="h-9 w-9 rounded-full border-2 border-white/20 object-cover" />
      </div>
    </aside>
  );
}

function SideNavigation() {
  return (
    <aside className="hidden w-[210px] shrink-0 border-r border-slate-200/80 bg-white/85 px-4 py-5 backdrop-blur-xl xl:block">
      <div className="mb-7">
        <h2 className="text-lg font-black tracking-tight text-slate-950">Research Platform V3</h2>
        <p className="text-sm text-slate-500">Communication Hub</p>
      </div>

      <NavGroup items={primaryNav} />
      <NavGroup title="Communication" items={communicationNav} />
      <NavGroup title="Channels" items={channels} />
      <NavGroup title="Assets" items={assets} />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Storage Usage</span>
          <span>33%</span>
        </div>
        <p className="mb-2 text-xs text-slate-500">67.4 GB / 200 GB</p>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 rounded-full bg-violet-600" />
        </div>
        <button className="w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/20">
          Upgrade Plan
        </button>
      </div>
    </aside>
  );
}

function NavGroup({ title, items }: { title?: string; items: Array<any> }) {
  return (
    <div className="mb-6">
      {title && <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={classNames(
                'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700',
                item.active && 'bg-violet-100 text-violet-700'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.count ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopHeader() {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden w-full max-w-[430px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search messages, users, datasets..." />
          <kbd className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-400">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <IconButton badge="8"><Bell className="h-5 w-5" /></IconButton>
        <IconButton><CalendarDays className="h-5 w-5" /></IconButton>
        <IconButton><HelpCircle className="h-5 w-5" /></IconButton>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <img src={avatar('emily-davis')} alt="Emily Davis" className="h-10 w-10 rounded-full object-cover" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold">Emily Davis</p>
            <p className="text-xs text-slate-500">Researcher</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <button className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100">
      {children}
      {badge && <span className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function InboxPanel({
  threads,
  selectedThreadId,
  onSelect,
  filter,
  setFilter,
  search,
  setSearch,
}: {
  threads: ThreadItem[];
  selectedThreadId: number;
  onSelect: (id: number) => void;
  filter: 'Inbox' | 'All' | 'Unread' | 'Starred';
  setFilter: (filter: 'Inbox' | 'All' | 'Unread' | 'Starred') => void;
  search: string;
  setSearch: (search: string) => void;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="text-xl font-black tracking-tight">My Messages</h1>
            <p className="text-xs text-slate-500 xl:hidden">Communicate with your team</p>
          </div>
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/20">Compose</button>
        </div>

        <div className="border-b border-slate-200 p-4">
          <div className="mb-4 flex items-center gap-2">
            {(['Inbox', 'All', 'Unread', 'Starred'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={classNames(
                  'relative rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50',
                  filter === tab && 'text-violet-700'
                )}
              >
                {tab}
                {tab === 'Inbox' && <span className="ml-1 rounded-full bg-violet-100 px-1.5 text-xs text-violet-700">24</span>}
                {filter === tab && <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-violet-600" />}
              </button>
            ))}
            <button className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              placeholder="Search messages..."
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelect(thread.id)}
              className={classNames(
                'mb-2 flex w-full gap-3 rounded-2xl border p-3 text-left transition hover:border-violet-300 hover:bg-violet-50/40',
                selectedThreadId === thread.id ? 'border-violet-500 bg-violet-50/50 shadow-sm' : 'border-transparent bg-white'
              )}
            >
              <AvatarOrIcon thread={thread} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-black">{thread.sender}</div>
                  <div className="shrink-0 text-xs text-slate-500">{thread.time}</div>
                </div>
                <div className="truncate text-sm font-bold text-slate-900">{thread.subject}</div>
                <div className="mt-0.5 truncate text-sm text-slate-500">{thread.preview}</div>
              </div>
              {thread.unread > 0 && (
                <span className="mt-9 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">{thread.unread}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>Showing 1 to 7 of 42 conversations</span>
          <div className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-100 font-bold text-violet-700">1</span>
            <span>2</span>
            <span>3</span>
            <span>...</span>
            <span>6</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarOrIcon({ thread }: { thread: ThreadItem }) {
  if (thread.avatar) {
    return (
      <div className="relative shrink-0">
        <img src={thread.avatar} alt={thread.sender} className="h-11 w-11 rounded-full object-cover" />
        <span className="absolute -right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      </div>
    );
  }
  return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100">{thread.icon}</div>;
}

function ThreadPanel({
  thread,
  draft,
  setDraft,
  sendMessage,
}: {
  thread: ThreadItem;
  draft: string;
  setDraft: (value: string) => void;
  sendMessage: () => void;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <Archive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-lg font-black">{thread.subject}</h2>
                <span className="rounded-md bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-700">{thread.category}</span>
              </div>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                {thread.assetName ?? 'General Communication'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><Star className="h-5 w-5" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><Archive className="h-5 w-5" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><Trash2 className="h-5 w-5" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><MoreVertical className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5">
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        <Composer draft={draft} setDraft={setDraft} sendMessage={sendMessage} />
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  return (
    <div className={classNames('flex gap-3', message.isMe && 'justify-end')}>
      {!message.isMe && <img src={message.avatar} alt={message.sender} className="mt-1 h-9 w-9 rounded-full object-cover" />}
      <div className={classNames('max-w-[72%]', message.isMe && 'flex flex-col items-end')}>
        <div className={classNames('mb-2 flex items-center gap-3', message.isMe && 'justify-end')}>
          {!message.isMe && <span className="font-black">{message.sender}</span>}
          <span className="text-xs text-slate-500">{message.time}</span>
        </div>
        <div
          className={classNames(
            'rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm',
            message.isMe
              ? 'border-violet-200 bg-violet-50 text-slate-950'
              : 'border-slate-200 bg-slate-50/80 text-slate-950'
          )}
        >
          <p className="whitespace-pre-line">{message.content}</p>
          {message.attachment && (
            <div className="mt-3 flex max-w-[260px] items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-violet-700">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-bold">{message.attachment.label}</p>
                <p className="text-xs text-slate-500">{message.attachment.size}</p>
              </div>
            </div>
          )}
        </div>
        {message.isMe && <p className="mt-1 text-xs text-slate-500">Read 2:20 PM <span className="text-violet-600">✓✓</span></p>}
        {message.reaction && <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm">{message.reaction}</span>}
      </div>
      {message.isMe && <img src={message.avatar} alt={message.sender} className="mt-10 h-9 w-9 rounded-full object-cover" />}
    </div>
  );
}

function Composer({ draft, setDraft, sendMessage }: { draft: string; setDraft: (value: string) => void; sendMessage: () => void }) {
  return (
    <div className="border-t border-slate-200 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex gap-5 border-b border-slate-200 text-sm font-bold">
          <button className="border-b-2 border-violet-600 px-1 pb-3 text-violet-700">Message</button>
          <button className="px-1 pb-3 text-slate-500">Internal Note</button>
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          className="h-16 w-full resize-none bg-transparent text-sm outline-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-600">
            <Paperclip className="h-5 w-5" />
            <Smile className="h-5 w-5" />
            <AtSign className="h-5 w-5" />
            <ImageIcon className="h-5 w-5" />
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="flex overflow-hidden rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
            <button onClick={sendMessage} className="px-7 py-2.5 text-sm font-bold hover:bg-violet-700">Send</button>
            <button className="border-l border-white/20 px-3 hover:bg-violet-700"><ChevronDown className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadDetails({
  thread,
  muted,
  setMuted,
}: {
  thread: ThreadItem;
  muted: boolean;
  setMuted: (value: boolean) => void;
}) {
  return (
    <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-full overflow-y-auto">
        <section className="border-b border-slate-200 p-5">
          <h3 className="mb-4 text-lg font-black">Thread Details</h3>
          <DetailRow label="Status" value={<Pill color="green">{thread.status}</Pill>} />
          <DetailRow label="Priority" value={<Pill color="orange">{thread.priority}</Pill>} />
          <DetailRow label="Created" value="Jul 2, 2026, 2:15 PM" />
          <DetailRow label="Last Updated" value="Today, 2:21 PM" />
        </section>

        <section className="border-b border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black">Participants (3)</h3>
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="space-y-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <div className="relative">
                  <img src={participant.avatar} alt={participant.name} className="h-10 w-10 rounded-full object-cover" />
                  <span
                    className={classNames(
                      'absolute -right-0.5 bottom-0 h-3 w-3 rounded-full border-2 border-white',
                      participant.online ? 'bg-emerald-500' : 'bg-slate-300'
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black">{participant.name}</p>
                    {participant.tag && <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{participant.tag}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{participant.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-slate-200 p-5">
          <h3 className="mb-4 text-base font-black">Attachments (1)</h3>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Clinical_SDOH_v5_Dictionary.pdf</p>
              <p className="text-xs text-slate-500">2.4 MB</p>
            </div>
            <button className="text-slate-500 hover:text-violet-700"><Download className="h-5 w-5" /></button>
          </div>
        </section>

        <section className="border-b border-slate-200 p-5">
          <h3 className="mb-4 text-base font-black">Associated Asset</h3>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><Archive className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Clinical_SDOH_v5 Dataset</p>
              <p className="text-xs text-slate-500">Version 2.1</p>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50">View</button>
          </div>
        </section>

        <section className="p-5">
          <h3 className="mb-4 text-base font-black">Actions</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <ActionRow icon={<Mail className="h-4 w-4" />} label="Mark as Unread" />
            <ActionRow icon={<Archive className="h-4 w-4" />} label="Archive Thread" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3"><Bell className="h-4 w-4" />Mute Notifications</span>
              <button
                onClick={() => setMuted(!muted)}
                className={classNames('flex h-7 w-12 items-center rounded-full p-1 transition', muted ? 'bg-violet-600' : 'bg-slate-200')}
              >
                <span className={classNames('h-5 w-5 rounded-full bg-white shadow transition', muted && 'translate-x-5')} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: 'green' | 'orange' }) {
  return (
    <span
      className={classNames(
        'rounded-full px-3 py-1 text-xs font-bold',
        color === 'green' && 'bg-emerald-100 text-emerald-700',
        color === 'orange' && 'bg-orange-100 text-orange-700'
      )}
    >
      {children}
    </span>
  );
}

function ActionRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left hover:text-violet-700">
      {icon}
      {label}
    </button>
  );
}
