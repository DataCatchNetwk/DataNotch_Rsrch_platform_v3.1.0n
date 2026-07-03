'use client';

import { Archive, Inbox, Send, Star } from 'lucide-react';
import { groupByDate, formatMessageStamp } from './dateGroups';
import { MessageBox, useCommunicationStore } from '@/store/useCommunicationStore';

const boxes: { key: MessageBox; label: string; icon: any }[] = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'archived', label: 'Archived', icon: Archive },
];

export default function MessageList({ mode }: { mode: 'admin' | 'user' }) {
  const { threads, box, setBox, selectedThreadId, selectThread, query } = useCommunicationStore();
  const filtered = threads
    .filter(t => box === 'starred' ? t.starred : t.box === box)
    .filter(t => !query || `${t.subject} ${t.preview} ${t.sender.name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const groups = groupByDate(filtered);

  return (
    <aside className="w-full lg:w-[360px] xl:w-[400px] bg-white border-r flex flex-col min-w-0">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-semibold">{mode === 'admin' ? 'Admin Messages' : 'My Messages'}</h1>
        <p className="text-sm text-slate-500">Inbox, sent messages, replies, and forwarded email</p>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2 border-b bg-slate-50/60">
        {boxes.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setBox(key)} className={`px-3 py-2 rounded-2xl flex items-center gap-2 text-sm ${box === key ? 'bg-violet-600 text-white shadow' : 'bg-white border text-slate-600 hover:bg-violet-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groups).length === 0 && <div className="p-6 text-sm text-slate-500">No messages found.</div>}
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="sticky top-0 z-10 bg-slate-50/95 border-y px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">{date}</div>
            {items.map((thread) => (
              <button key={thread.id} onClick={() => selectThread(thread.id)} className={`w-full text-left px-4 py-3 border-b hover:bg-slate-50 transition-colors ${selectedThreadId === thread.id ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''}`}>
                <div className="flex gap-3">
                  <img src={thread.sender.avatar} alt="" className="w-10 h-10 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div className="font-semibold truncate">{thread.sender.name}</div>
                      <div className="text-xs text-slate-500 shrink-0">{formatMessageStamp(thread.updatedAt)}</div>
                    </div>
                    <div className="text-sm font-medium truncate">{thread.subject}</div>
                    <div className="text-sm text-slate-500 truncate">{thread.preview}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {thread.box === 'sent' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Sent</span>}
                      {thread.box === 'inbox' && <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">Inbox</span>}
                      {thread.recipients.length > 0 && <span className="bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">To {thread.recipients.map((person) => person.email).join(', ')}</span>}
                      {thread.unreadCount > 0 && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{thread.unreadCount} new</span>}
                      {thread.assetType && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full tracking-wide">{thread.assetType}</span>}
                      {thread.starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
