'use client';
import React, { useEffect, useState } from 'react';
import { Mic, MicOff, MonitorUp, PhoneOff, Users, Video, VideoOff, MessageSquare, ShieldCheck, CircleDot } from 'lucide-react';

export default function RZoomaRoom({ params }: { params: { meetingId: string } }) {
  const [mic,setMic]=useState(true), [cam,setCam]=useState(true), [share,setShare]=useState(false), [ended,setEnded]=useState(false);
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{ const t=setInterval(()=>setSeconds(s=>s+1),1000); return()=>clearInterval(t);},[]);
  if (ended) return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="text-center"><h1 className="text-3xl font-bold">Call Ended</h1><a href="/communication/meetings" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-slate-950">Return to Meetings</a></div></main>;
  return <main className="min-h-screen bg-[#070B1A] text-white">
    <div className="grid min-h-screen grid-cols-12">
      <aside className="col-span-12 border-r border-white/10 bg-white/5 p-4 lg:col-span-2">
        <div className="flex items-center gap-2 font-black"><Video className="text-indigo-300"/> R-ZOOMA</div>
        <div className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-emerald-300"><CircleDot className="inline mr-2" size={16}/> LIVE · {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</div>
        <h3 className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">Participants</h3>
        {['Admin Host','Researcher','Data Steward','Reviewer'].map((p,i)=><div key={p} className="mt-3 flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500">{p[0]}</div><div><p className="text-sm font-semibold">{p}</p><p className="text-xs text-slate-400">{i===0?'Host':'Accepted'}</p></div></div>)}
      </aside>
      <section className="col-span-12 flex flex-col lg:col-span-7">
        <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h1 className="text-xl font-bold">Publication Review Session</h1><p className="text-sm text-slate-400">Meeting ID: {params.meetingId}</p></div><ShieldCheck className="text-emerald-300"/></header>
        <div className="grid flex-1 grid-cols-2 gap-4 p-4">
          <div className="col-span-2 grid place-items-center rounded-[2rem] bg-gradient-to-br from-indigo-700 to-slate-900 shadow-2xl"><div className="text-center"><div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-white/15 text-5xl font-black">A</div><p className="mt-4 text-2xl font-bold">Admin Host</p><p className="text-indigo-200">Screen-ready research review room</p></div></div>
          <div className="rounded-3xl bg-white/10 p-4">Researcher Camera</div><div className="rounded-3xl bg-white/10 p-4">Data Steward Camera</div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 p-4">
          <button onClick={()=>setMic(!mic)} className="rounded-2xl bg-white/10 p-4">{mic?<Mic/>:<MicOff/>}</button>
          <button onClick={()=>setCam(!cam)} className="rounded-2xl bg-white/10 p-4">{cam?<Video/>:<VideoOff/>}</button>
          <button onClick={()=>setShare(!share)} className={`rounded-2xl p-4 ${share?'bg-indigo-600':'bg-white/10'}`}><MonitorUp/></button>
          <button onClick={()=>setEnded(true)} className="rounded-2xl bg-red-600 px-6 py-4 font-bold"><PhoneOff className="inline mr-2"/> End Call</button>
        </footer>
      </section>
      <aside className="col-span-12 border-l border-white/10 bg-white/5 p-4 lg:col-span-3">
        <div className="flex gap-2"><button className="rounded-xl bg-white/10 px-4 py-2"><MessageSquare size={16} className="inline mr-2"/>Chat</button><button className="rounded-xl bg-white/10 px-4 py-2"><Users size={16} className="inline mr-2"/>People</button></div>
        <div className="mt-5 space-y-3 text-sm"><div className="rounded-2xl bg-white/10 p-3"><b>AI Assistant</b><p className="text-slate-300">Recording decisions, tasks, and summary.</p></div><div className="rounded-2xl bg-white/10 p-3"><b>Agenda</b><p className="text-slate-300">Review results, approve manuscript, assign follow-ups.</p></div></div>
      </aside>
    </div>
  </main>;
}
