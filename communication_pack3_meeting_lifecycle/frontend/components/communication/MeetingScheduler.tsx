'use client';
import React, { useState } from 'react';
import { CalendarPlus, Users, Video } from 'lucide-react';
import { api } from '@/lib/communicationApi';

export function MeetingScheduler({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({
    title: 'Publication Review Meeting',
    type: 'R_ZOOMA_VIDEO',
    assetType: 'PUBLICATION',
    assetTitle: 'SDOH Readmission Manuscript',
    startsAt: '',
    endsAt: '',
    agenda: 'Review findings, comments, approvals, and publication next steps.',
    inviteeIds: 'demo-user-1,demo-user-2'
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api('/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...form, inviteeIds: form.inviteeIds.split(',').map(x => x.trim()).filter(Boolean), roomUrl: '/communication/rzooma/:meetingId' })
      });
      onCreated?.();
    } finally { setBusy(false); }
  }

  return <section className="rounded-3xl border bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-5">
      <div className="rounded-2xl bg-indigo-600 p-3 text-white"><CalendarPlus /></div>
      <div><h2 className="text-xl font-bold">Meeting Scheduler</h2><p className="text-sm text-slate-500">Schedule R-ZOOMA/R-MEET sessions with acceptance workflow.</p></div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <input className="rounded-xl border p-3" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Meeting title" />
      <select className="rounded-xl border p-3" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
        <option value="R_ZOOMA_VIDEO">R-ZOOMA Video</option><option value="R_MEET_AUDIO">R-MEET Audio</option><option value="STUDY_REVIEW">Study Review</option><option value="DATASET_REVIEW">Dataset Review</option><option value="ANALYSIS_REVIEW">Analysis Review</option><option value="PUBLICATION_REVIEW">Publication Review</option>
      </select>
      <input type="datetime-local" className="rounded-xl border p-3" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})} />
      <input type="datetime-local" className="rounded-xl border p-3" value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value})} />
      <input className="rounded-xl border p-3" value={form.assetTitle} onChange={e=>setForm({...form,assetTitle:e.target.value})} placeholder="Linked asset" />
      <input className="rounded-xl border p-3" value={form.inviteeIds} onChange={e=>setForm({...form,inviteeIds:e.target.value})} placeholder="Invitee IDs comma separated" />
      <textarea className="md:col-span-2 rounded-xl border p-3" rows={4} value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})} />
    </div>
    <button disabled={busy} onClick={submit} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-white"><Video size={18}/> Schedule and Send Invites</button>
  </section>;
}
