'use client';
import React from 'react';
import { BellRing, Check, Clock, X } from 'lucide-react';

const items = [
  ['Invitation sent', 'Publication Review Meeting invite sent to 4 users.', 'SENT'],
  ['Invitation accepted', 'Researcher accepted Dataset Review Meeting.', 'ACCEPTED'],
  ['Invitation declined', 'Reviewer declined Analysis Review Meeting.', 'DECLINED'],
  ['Upcoming meeting', 'R-ZOOMA opens automatically at 10:00 AM.', 'UPCOMING'],
];
export default function NotificationsPage(){
 return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-5xl space-y-4"><h1 className="text-3xl font-black">Meeting Status Notifications</h1>{items.map(([t,b,s])=><div key={t} className="flex items-start gap-4 rounded-3xl border bg-white p-5 shadow-sm"><div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><BellRing/></div><div className="flex-1"><h2 className="font-bold">{t}</h2><p className="text-slate-500">{b}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{s}</span></div>)}</div></main>
}
