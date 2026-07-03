'use client';
import React, { useEffect, useState } from 'react';
import { communicationApi } from '@/lib/communicationApi';

export function UnifiedInbox({ userId, role }:{ userId:string; role:'ADMIN'|'USER' }) {
  const [threads,setThreads] = useState<any[]>([]);
  const [body,setBody] = useState('');
  useEffect(()=>{ communicationApi.inbox(userId).then(setThreads).catch(console.error); },[userId]);
  return <section className="rounded-3xl bg-white p-6 shadow-sm border">
    <div className="flex items-center justify-between mb-5"><div><p className="tracking-[0.35em] text-xs text-blue-600">{role} INBOX</p><h2 className="text-2xl font-black">Unified Inbox & Research Threads</h2></div><span className="rounded-full bg-slate-900 text-white px-4 py-2">{threads.length} threads</span></div>
    <div className="grid md:grid-cols-[320px_1fr] gap-5">
      <div className="space-y-3">{threads.map(t=><button key={t.id} className="w-full text-left rounded-2xl border p-4 hover:bg-slate-50"><b>{t.subject}</b><p className="text-sm text-slate-500">{t.assetType} {t.assetId ? `• ${t.assetId}`:''}</p><p className="text-sm mt-2">{t.messages?.[0]?.body}</p></button>)}</div>
      <div className="rounded-2xl bg-slate-950 text-white p-5"><h3 className="font-bold mb-3">Reply / create platform message</h3><textarea value={body} onChange={e=>setBody(e.target.value)} className="w-full min-h-40 rounded-xl p-3 text-slate-900" placeholder="Write a reply, admin instruction, dataset note, or user support response..."/><button className="mt-3 rounded-xl bg-white text-slate-950 px-5 py-3 font-bold">Send Message + Optional Email Copy</button></div>
    </div>
  </section>
}
