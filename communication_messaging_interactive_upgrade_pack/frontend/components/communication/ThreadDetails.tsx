'use client';

import { Archive, Bell, Download, Mail, Plus, X } from 'lucide-react';
import { useCommunicationStore } from '@/store/useCommunicationStore';

export default function ThreadDetails() {
  const { selectedThreadId, threads, detailsOpen, toggleDetails } = useCommunicationStore();
  const thread = threads.find(t => t.id === selectedThreadId);
  if (!detailsOpen || !thread) return null;
  const people = [thread.sender, ...thread.recipients].filter((p, i, arr) => arr.findIndex(x => x.email === p.email) === i);
  return (
    <aside className="hidden xl:block w-80 bg-white border-l overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Thread Details</h3>
          <button onClick={toggleDetails} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4 text-sm mb-8">
          <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs">{thread.status}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Priority</span><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs">{thread.priority}</span></div>
          <div><div className="text-slate-500">Created</div><div>{new Date(thread.createdAt).toLocaleString()}</div></div>
          <div><div className="text-slate-500">Last Updated</div><div>{new Date(thread.updatedAt).toLocaleString()}</div></div>
        </div>
        <section className="mb-8">
          <div className="flex justify-between mb-3"><b>Participants ({people.length})</b><Plus className="w-4 h-4 text-violet-600" /></div>
          <div className="space-y-3">
            {people.map(p => <div key={p.email} className="flex gap-3 items-center"><img src={p.avatar} className="w-10 h-10 rounded-2xl" alt="" /><div><div className="font-medium text-sm">{p.name}</div><div className="text-xs text-slate-500">{p.email}</div></div></div>)}
          </div>
        </section>
        <section className="mb-8">
          <b>Attachments (1)</b>
          <div className="mt-3 border rounded-2xl p-4 flex gap-3 items-center hover:bg-slate-50"><div className="text-3xl">📕</div><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">Clinical_SDOH_v5_Dictionary.pdf</div><div className="text-xs text-slate-500">2.4 MB</div></div><Download className="w-4 h-4 text-slate-400" /></div>
        </section>
        <section className="mb-8">
          <b>Associated Asset</b>
          <div className="mt-3 border border-violet-200 bg-violet-50/50 rounded-2xl p-4"><div className="flex gap-3"><div className="text-3xl">📊</div><div><div className="font-semibold">{thread.assetName || 'No asset'}</div><div className="text-xs text-slate-500">{thread.assetType || 'General'}</div></div></div><button className="mt-4 w-full py-2 rounded-xl border border-violet-200 text-violet-700 hover:bg-white">View</button></div>
        </section>
        <section>
          <b>Actions</b>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <button className="flex gap-3 hover:text-violet-600"><Mail className="w-4 h-4" /> Mark as Unread</button>
            <button className="flex gap-3 hover:text-violet-600"><Archive className="w-4 h-4" /> Archive Thread</button>
            <button className="flex gap-3 hover:text-violet-600"><Bell className="w-4 h-4" /> Mute Notifications</button>
          </div>
        </section>
      </div>
    </aside>
  );
}
