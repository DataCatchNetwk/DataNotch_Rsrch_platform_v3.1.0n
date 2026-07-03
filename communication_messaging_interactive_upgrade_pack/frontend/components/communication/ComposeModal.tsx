'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Person, useCommunicationStore } from '@/store/useCommunicationStore';

export default function ComposeModal() {
  const { composeOpen, closeCompose, createThread } = useCommunicationStore();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  if (!composeOpen) return null;

  const send = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    const recipient: Person = { id: `external-${to}`, name: to, email: to };
    createThread(subject, body, [recipient]);
    setTo(''); setSubject(''); setBody('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compose Message</h2>
          <button onClick={closeCompose} className="p-2 rounded-xl hover:bg-zinc-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="To: name@email.com" className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-violet-500" />
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-violet-500" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." rows={8} className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-violet-500 resize-none" />
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={closeCompose} className="px-5 py-2 rounded-2xl border hover:bg-zinc-50">Cancel</button>
          <button onClick={send} className="px-6 py-2 rounded-2xl bg-violet-600 text-white hover:bg-violet-700">Send</button>
        </div>
      </div>
    </div>
  );
}
