'use client';

import { Archive, Forward, MoreHorizontal, Reply, ReplyAll, Star } from 'lucide-react';
import { useState } from 'react';
import { useCommunicationStore } from '@/store/useCommunicationStore';
import { formatDateGroup, formatMessageStamp, groupByDate } from './dateGroups';

export default function ThreadPanel() {
  const { selectedThreadId, threads, messagesByThread, sendReply, replyAll, forwardThread, toggleStar, archiveThread, toggleDetails } = useCommunicationStore();
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'MESSAGE' | 'INTERNAL_NOTE' | 'FORWARD'>('MESSAGE');
  const [replyVariant, setReplyVariant] = useState<'reply' | 'reply-all'>('reply');
  const [forwardEmail, setForwardEmail] = useState('');
  const selected = threads.find(t => t.id === selectedThreadId);
  const messages = selectedThreadId ? [...(messagesByThread[selectedThreadId] || [])].sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)) : [];
  const groups = groupByDate(messages);
  if (!selected) return <main className="flex-1 grid place-items-center text-slate-500">Select a message</main>;

  const submit = () => {
    if (!body.trim()) return;
    if (mode === 'FORWARD') {
      if (!forwardEmail.trim()) return;
      forwardThread(selected.id, forwardEmail.trim(), body);
      setForwardEmail('');
    } else if (mode === 'MESSAGE' && replyVariant === 'reply-all') {
      replyAll(selected.id, body);
    } else {
      sendReply(selected.id, body, mode);
    }
    setBody('');
  };

  const setReplyMode = (nextMode: 'MESSAGE' | 'INTERNAL_NOTE' | 'FORWARD') => {
    setMode(nextMode);
    setReplyVariant('reply');
    if (nextMode !== 'FORWARD') {
      setForwardEmail('');
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white">
      <div className="h-20 border-b px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold truncate">{selected.subject}</h2>
          <div className="text-sm text-emerald-700 truncate">{selected.assetName || 'General communication'} • {selected.priority}</div>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <button onClick={() => toggleStar(selected.id)} className="p-2 rounded-xl hover:bg-slate-100"><Star className={`w-5 h-5 ${selected.starred ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
          <button onClick={() => archiveThread(selected.id)} className="p-2 rounded-xl hover:bg-slate-100"><Archive className="w-5 h-5" /></button>
          <button onClick={toggleDetails} className="p-2 rounded-xl hover:bg-slate-100"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] px-4 lg:px-8 py-4 space-y-3">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="flex justify-center my-3"><span className="text-xs bg-white border rounded-full px-3 py-1 text-slate-500">{date}</span></div>
            <div className="space-y-2.5">
              {items.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'justify-end' : ''}`}>
                  {!msg.isMine && <img src={msg.sender.avatar} className="w-8 h-8 rounded-xl mt-0.5" alt="" />}
                  <div className={`max-w-[78%] lg:max-w-[68%] rounded-2xl px-3.5 py-2.5 shadow-sm ${msg.isMine ? 'bg-violet-600 text-white' : msg.kind === 'INTERNAL_NOTE' ? 'bg-amber-50 border border-amber-200' : 'bg-white border'}`}>
                    <div className="flex items-center justify-between gap-4 text-xs opacity-75 mb-1">
                      <span>{msg.sender.name}</span><span>{formatMessageStamp(msg.sentAt)}</span>
                    </div>
                    <div className="whitespace-pre-line text-[14px] leading-5.5">{msg.body}</div>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs opacity-85">
                      <button onClick={() => setReplyMode('MESSAGE')} className="inline-flex gap-1 items-center rounded-full px-2 py-1 hover:bg-black/5"><Reply className="w-3 h-3" /> Reply</button>
                      <button onClick={() => { setReplyMode('MESSAGE'); setReplyVariant('reply-all'); }} className="inline-flex gap-1 items-center rounded-full px-2 py-1 hover:bg-black/5"><ReplyAll className="w-3 h-3" /> Reply all</button>
                      <button onClick={() => setReplyMode('FORWARD')} className="inline-flex gap-1 items-center rounded-full px-2 py-1 hover:bg-black/5"><Forward className="w-3 h-3" /> Forward</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-white p-4">
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          {([
            { key: 'MESSAGE', label: 'Reply' },
            { key: 'INTERNAL_NOTE', label: 'Internal Note' },
            { key: 'FORWARD', label: 'Forward' },
          ] as const).map(tab => <button key={tab.key} onClick={() => setReplyMode(tab.key)} className={`px-4 py-1.5 rounded-full text-sm ${mode === tab.key ? 'bg-violet-100 text-violet-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>{tab.label}</button>)}
          <button onClick={() => { setMode('MESSAGE'); setReplyVariant('reply-all'); }} className={`ml-auto hidden sm:inline-flex px-3 py-1.5 rounded-xl border text-sm hover:bg-slate-50 ${replyVariant === 'reply-all' && mode === 'MESSAGE' ? 'bg-violet-50 border-violet-200 text-violet-700' : ''}`}>Reply All</button>
        </div>
        {mode === 'FORWARD' ? (
          <div className="space-y-3">
            <input value={forwardEmail} onChange={e => setForwardEmail(e.target.value)} placeholder="Forward to email" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-violet-500" />
            <div className="flex items-end gap-3">
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder="Add a note to the forwarded email..." className="flex-1 resize-none rounded-2xl border px-4 py-3 outline-none focus:border-violet-500 text-sm" />
              <button onClick={submit} className="px-6 py-3 rounded-2xl bg-violet-600 text-white hover:bg-violet-700">Forward</button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder={`Write your ${mode === 'INTERNAL_NOTE' ? 'internal note' : 'reply'}...`} className="flex-1 resize-none rounded-2xl border px-4 py-3 outline-none focus:border-violet-500 text-sm" />
            <button onClick={submit} className="px-6 py-3 rounded-2xl bg-violet-600 text-white hover:bg-violet-700">{mode === 'INTERNAL_NOTE' ? 'Save Note' : replyVariant === 'reply-all' ? 'Send Reply All' : 'Send'}</button>
          </div>
        )}
      </div>
    </main>
  );
}
