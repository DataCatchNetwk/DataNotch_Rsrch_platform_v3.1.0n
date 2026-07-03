'use client';
import React from 'react';
import { Ban, Pause, Play, Trash2, History } from 'lucide-react';

const logs = [
  ['Publication Review', 'Started', 'Admin Host', 'Today 10:00 AM'],
  ['Dataset Review', 'Paused', 'Data Steward', 'Yesterday 3:20 PM'],
  ['Study Invitation', 'Accepted', 'Researcher', 'Monday 9:12 AM'],
  ['Analysis Review', 'Cancelled', 'Admin', 'Friday 11:40 AM'],
];

export default function CallLogsPage(){
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-6xl">
    <header className="mb-6 rounded-3xl bg-white p-6 shadow-sm"><h1 className="flex items-center gap-3 text-3xl font-black"><History/> Call Log & Activity Management</h1><p className="mt-2 text-slate-500">Track, pause, cancel, delete, and audit R-MEET/R-ZOOMA lifecycle events.</p></header>
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-4">Meeting</th><th>Status</th><th>Actor</th><th>Time</th><th>Controls</th></tr></thead><tbody>{logs.map((l,i)=><tr key={i} className="border-t"><td className="p-4 font-semibold">{l[0]}</td><td>{l[1]}</td><td>{l[2]}</td><td>{l[3]}</td><td className="flex gap-2 p-3"><button className="rounded-lg border p-2"><Play size={16}/></button><button className="rounded-lg border p-2"><Pause size={16}/></button><button className="rounded-lg border p-2 text-red-600"><Ban size={16}/></button><button className="rounded-lg border p-2 text-red-700"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
  </div></main>
}
