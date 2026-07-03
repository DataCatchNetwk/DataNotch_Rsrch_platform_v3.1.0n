'use client';
import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, CheckCircle2, Clock, MailCheck, Video } from 'lucide-react';
import { api } from '@/lib/communicationApi';
import { MeetingScheduler } from '@/components/communication/MeetingScheduler';
import { MeetingCard } from '@/components/communication/MeetingCard';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [error, setError] = useState('');
  async function load(){ try{ setMeetings(await api('/meetings')); } catch(e:any){ setError(e.message); }}
  useEffect(()=>{ load(); const t=setInterval(load,15000); return()=>clearInterval(t);},[]);

  return <main className="min-h-screen bg-slate-50 p-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-indigo-950 to-fuchsia-900 p-8 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">Communication Pack 3</p>
            <h1 className="mt-3 text-4xl font-black">Meeting Lifecycle Command Hub</h1>
            <p className="mt-3 max-w-3xl text-indigo-100">Schedule, invite, accept, sync calendar, auto-open R-ZOOMA, and manage call activity with admin/user permissions.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {[['Scheduled',meetings.length,CalendarDays],['Ready',meetings.filter(m=>m.status==='READY').length,CheckCircle2],['Live',meetings.filter(m=>m.status==='LIVE').length,Video],['Invites',meetings.reduce((a,m)=>a+(m.invitations?.length||0),0),MailCheck]].map(([l,v,Icon]:any)=><div key={l} className="rounded-2xl bg-white/10 p-4 backdrop-blur"><Icon size={20}/><div className="mt-2 text-2xl font-bold">{v}</div><div className="text-indigo-100">{l}</div></div>)}
          </div>
        </div>
      </header>

      <MeetingScheduler onCreated={load}/>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      <section className="grid gap-4 lg:grid-cols-2">
        {meetings.map(m=><MeetingCard key={m.id} meeting={m} refresh={load}/>)}
      </section>
    </div>
  </main>;
}
