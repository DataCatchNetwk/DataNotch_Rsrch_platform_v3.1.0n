'use client';
import React, { useState } from 'react';
import { communicationApi } from '@/lib/communicationApi';

export function MeetingLifecyclePanel({ createdById }:{createdById:string}) {
  const [kind,setKind] = useState<'RMEET_AUDIO'|'RZOOMA_VIDEO'>('RZOOMA_VIDEO');
  const [title,setTitle] = useState('Dataset Review Meeting');
  const [inviteeIds,setInviteeIds] = useState('');
  async function schedule(){ await communicationApi.scheduleMeeting({ title, kind, createdById, startTime: new Date(Date.now()+3600000).toISOString(), endTime: new Date(Date.now()+7200000).toISOString(), inviteeIds: inviteeIds.split(',').map(x=>x.trim()).filter(Boolean), agenda:'Review research asset, approvals, and next actions.'}); alert('Meeting scheduled and invitations routed to user inbox.'); }
  return <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-6 shadow-xl">
    <p className="text-emerald-300 text-xs tracking-[0.35em]">MEETING LIFECYCLE ENGINE</p><h2 className="text-2xl font-black mb-4">Schedule by choosing Audio or Video</h2>
    <div className="grid md:grid-cols-2 gap-4 mb-4"><button onClick={()=>setKind('RMEET_AUDIO')} className={`rounded-2xl p-5 text-left border ${kind==='RMEET_AUDIO'?'bg-orange-600 border-orange-300':'border-white/20'}`}><b>R-MEET Audio</b><p>Phone/email registered-user call flow.</p></button><button onClick={()=>setKind('RZOOMA_VIDEO')} className={`rounded-2xl p-5 text-left border ${kind==='RZOOMA_VIDEO'?'bg-violet-600 border-violet-300':'border-white/20'}`}><b>R-ZOOMA Video</b><p>Email invite, video room, AI notes, calendar ICS.</p></button></div>
    <input className="w-full rounded-xl p-3 text-slate-900 mb-3" value={title} onChange={e=>setTitle(e.target.value)} /><input className="w-full rounded-xl p-3 text-slate-900 mb-3" placeholder="Invitee user IDs, comma-separated" value={inviteeIds} onChange={e=>setInviteeIds(e.target.value)} />
    <button onClick={schedule} className="w-full rounded-xl bg-white text-slate-950 py-3 font-black">Schedule + Send Inbox Invitations</button>
  </section>
}
