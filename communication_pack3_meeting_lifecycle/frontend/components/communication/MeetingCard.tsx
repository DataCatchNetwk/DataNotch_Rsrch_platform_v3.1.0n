'use client';
import { CalendarClock, CheckCircle, Pause, Trash2, Video, XCircle, Download } from 'lucide-react';
import { api, API_BASE } from '@/lib/communicationApi';

export function MeetingCard({ meeting, refresh }: any) {
  const canAutoOpen = meeting.autoOpenWindow && ['READY','LIVE'].includes(meeting.status);
  async function action(name: string) { await api(`/meetings/${meeting.id}/${name}`, { method: 'POST' }); refresh?.(); }
  return <div className="rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between gap-4">
      <div>
        <div className="flex items-center gap-2"><CalendarClock size={18}/><span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{meeting.type}</span></div>
        <h3 className="mt-2 text-lg font-bold">{meeting.title}</h3>
        <p className="text-sm text-slate-500">{meeting.assetTitle || 'No linked research asset'}</p>
        <p className="mt-2 text-sm">{new Date(meeting.startsAt).toLocaleString()} → {new Date(meeting.endsAt).toLocaleTimeString()}</p>
      </div>
      <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{meeting.status}</span>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {canAutoOpen && <a href={`/communication/rzooma/${meeting.id}`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white"><Video size={16}/> Open R-ZOOMA</a>}
      <button onClick={()=>action('start')} className="rounded-xl border px-4 py-2 text-sm">Start</button>
      <button onClick={()=>action('pause')} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"><Pause size={14}/> Pause</button>
      <button onClick={()=>action('cancel')} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm text-red-600"><XCircle size={14}/> Cancel</button>
      <a href={`${API_BASE}/meetings/${meeting.id}/calendar.ics`} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"><Download size={14}/> Calendar</a>
    </div>
  </div>
}
