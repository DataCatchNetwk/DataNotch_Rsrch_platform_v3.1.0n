'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Plus, Video, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useRZoomaScheduleStore, ScheduleEvent, ScheduleRole } from '@/store/rzoomaScheduleStore';
import { colorClasses } from '@/lib/rzoomaScheduleData';

const hours = ['8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM'];
const days = [
  ['Mon','May 26'], ['Tue','May 27'], ['Wed','May 28'], ['Thu','May 29'], ['Fri','May 30'], ['Sat','May 31'], ['Sun','Jun 1']
];
const fallbackEvents: ScheduleEvent[] = [
  {id:'1',title:'IRB Submission Deadline',type:'DEADLINE',status:'SCHEDULED',startTime:'2026-05-27T00:00:00',endTime:'2026-05-29T00:00:00',allDay:true,color:'violet'},
  {id:'2',title:'Team Stand-up',subtitle:'Daily Sync',type:'SYNC',status:'SCHEDULED',startTime:'2026-05-26T10:00:00',endTime:'2026-05-26T11:00:00',color:'blue'},
  {id:'3',title:'Data Team Sync',subtitle:'Virtual',type:'MEETING',status:'SCHEDULED',startTime:'2026-05-27T09:00:00',endTime:'2026-05-27T10:00:00',color:'green'},
  {id:'4',title:'Protocol Review',subtitle:'Meeting Room A',type:'REVIEW',status:'SCHEDULED',startTime:'2026-05-28T10:00:00',endTime:'2026-05-28T11:30:00',color:'amber'},
  {id:'5',title:'Literature Review',subtitle:'Focus Session',type:'REVIEW',status:'SCHEDULED',startTime:'2026-05-29T09:30:00',endTime:'2026-05-29T10:30:00',color:'violet'},
  {id:'6',title:'Dataset Review',subtitle:'Clinical_SDOH_v5',type:'REVIEW',status:'SCHEDULED',startTime:'2026-05-27T14:00:00',endTime:'2026-05-27T15:30:00',color:'violet'},
  {id:'7',title:'Statistical Analysis',subtitle:'Review',type:'MEETING',status:'SCHEDULED',startTime:'2026-05-29T13:00:00',endTime:'2026-05-29T14:00:00',color:'green'},
  {id:'8',title:'Data Quality Check',subtitle:'Lab 2',type:'MEETING',status:'SCHEDULED',startTime:'2026-05-30T11:00:00',endTime:'2026-05-30T12:00:00',color:'blue'},
  {id:'9',title:'Manuscript Writing',subtitle:'Working Session',type:'WORKSHOP',status:'SCHEDULED',startTime:'2026-05-31T14:00:00',endTime:'2026-05-31T15:00:00',color:'pink'},
  {id:'10',title:'PI Meeting',subtitle:'Project Alpha',type:'MEETING',status:'SCHEDULED',startTime:'2026-05-26T16:30:00',endTime:'2026-05-26T17:30:00',color:'amber'},
  {id:'11',title:'Stakeholder Update',subtitle:'Virtual',type:'MEETING',status:'SCHEDULED',startTime:'2026-05-29T16:00:00',endTime:'2026-05-29T17:00:00',color:'blue'}
];

export default function RZoomaSchedulingPage({ role='USER', userId='u-emily' }: { role?: ScheduleRole; userId?: string }) {
  const { events, view, setView, fetchEvents, createEvent, respond } = useRZoomaScheduleStore();
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => { fetchEvents(role, userId).catch(() => null); }, [role, userId, fetchEvents]);
  const data = events.length ? events : fallbackEvents;
  const upcoming = data.filter(e => !e.allDay).slice(0,4);
  return <div className="min-h-screen bg-[#f8f9fd] text-slate-900">
    <div className="flex">
      <aside className="hidden xl:flex w-72 bg-white border-r border-slate-200 min-h-screen flex-col p-5">
        <div className="font-bold text-lg mb-8">Research Platform V3<br/><span className="text-xs font-normal text-slate-500">Research Operations Hub</span></div>
        <NavBlock title="COMMUNICATION" items={['My Messages','Sent','Drafts','Mentions','Starred','Trash']} />
        <NavBlock title="COLLABORATION" active="Scheduling" items={['Scheduling','Meetings','Tasks','Approvals','Contacts']} />
        <NavBlock title="RESEARCH" items={['Projects','Datasets','Publications','Reports']} />
        <div className="mt-auto rounded-2xl border border-slate-200 p-4"><b>Upcoming Today</b>{upcoming.slice(0,3).map(e=><SmallEvent key={e.id} e={e}/>)}</div>
      </aside>
      <main className="flex-1 p-4 md:p-7 overflow-hidden">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div><h1 className="text-3xl font-bold">Scheduling</h1><p className="text-slate-500">Manage your events, meetings, and research activities</p></div>
          {(role === 'ADMIN') && <button onClick={()=>setOpenModal(true)} className="self-start md:self-auto bg-violet-600 text-white rounded-xl px-5 py-3 flex items-center gap-2 shadow"><Plus size={18}/> New Event</button>}
        </header>
        <section className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3"><button className="px-4 py-2 rounded-xl border bg-white text-violet-700 font-semibold">Today</button><button className="p-2 rounded-xl border bg-white"><ChevronLeft/></button><button className="p-2 rounded-xl border bg-white"><ChevronRight/></button></div>
              <div className="font-bold text-xl">May 26 – June 1, 2026</div>
              <div className="flex items-center gap-2 rounded-xl border bg-white p-1">{['Day','Week','Month','Agenda'].map(v=><button key={v} onClick={()=>setView(v as any)} className={`px-4 py-2 rounded-lg ${view===v?'bg-violet-600 text-white':'text-slate-600'}`}>{v}</button>)}<button className="p-2 border-l"><Filter size={18}/></button></div>
            </div>
            <CalendarGrid events={data}/>
          </div>
          <RightPanel upcoming={upcoming} onCreate={()=>setOpenModal(true)} role={role}/>
        </section>
      </main>
    </div>
    {openModal && <CreateEventModal onClose={()=>setOpenModal(false)} onCreate={async payload=>{ await createEvent({ ...payload, createdById: userId, participantIds:['u-emily','u-sarah'] }); setOpenModal(false); }}/>} 
  </div>
}
function NavBlock({title,items,active}:{title:string;items:string[];active?:string}){return <div className="mb-7"><div className="text-xs text-slate-500 mb-2">{title}</div>{items.map(i=><div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${i===active?'bg-violet-100 text-violet-700 font-semibold':'text-slate-600'}`}><Calendar size={16}/>{i}</div>)}</div>}
function SmallEvent({e}:{e:ScheduleEvent}){return <div className="mt-3 text-sm"><div className="font-semibold">{new Date(e.startTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} {e.title}</div><div className="text-slate-500">{e.subtitle}</div></div>}
function CalendarGrid({events}:{events:ScheduleEvent[]}){return <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden min-w-[760px]"><div className="grid grid-cols-[80px_repeat(7,1fr)] border-b"> <div/> {days.map((d,i)=><div key={d[0]} className="text-center py-4 border-l"><b>{d[0]}</b><div className="text-xs text-slate-500">{d[1]}</div>{i===1&&<span className="inline-flex mt-1 bg-violet-600 text-white rounded-full w-8 h-8 items-center justify-center">27</span>}</div>)}</div><div className="grid grid-cols-[80px_repeat(7,1fr)]"><div className="text-sm text-slate-500 border-r"><div className="h-14 flex items-center justify-center">All day</div>{hours.map(h=><div key={h} className="h-20 flex items-start justify-center pt-3 border-t">{h}</div>)}</div>{days.map((_,day)=><div key={day} className="relative border-r min-h-[934px]">{Array.from({length:12}).map((_,i)=><div key={i} className="h-20 border-t"/>)}{events.filter(e=>new Date(e.startTime).getDay()===(day+1)%7).map(e=><EventBlock key={e.id} e={e}/>)}</div>)}</div></div>}
function EventBlock({e}:{e:ScheduleEvent}){const start=new Date(e.startTime); const end=new Date(e.endTime); const top=e.allDay?14:56+(start.getHours()-8)*80+(start.getMinutes()/60)*80; const height=e.allDay?34:Math.max(54,((end.getTime()-start.getTime())/3600000)*80); return <div style={{top,height}} className={`absolute left-2 right-2 rounded-lg border p-2 text-xs overflow-hidden ${colorClasses[e.color]||colorClasses.violet}`}><b>{!e.allDay && `${start.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`}<br/>{e.title}</b><div>{e.subtitle}</div></div>}
function RightPanel({upcoming,onCreate,role}:{upcoming:ScheduleEvent[];onCreate:()=>void;role:ScheduleRole}){return <aside className="space-y-4"><div className="bg-white border rounded-2xl p-5"><b>Mini Calendar</b><div className="text-center mt-5 font-semibold">May 2026</div><div className="grid grid-cols-7 gap-3 text-center text-sm mt-4 text-slate-600">{'SMTWTFS'.split('').map((d,i)=><b key={i}>{d}</b>)}{Array.from({length:35}).map((_,i)=><span key={i} className={i===26?'bg-violet-600 text-white rounded-full py-1':''}>{(i+27)%31||31}</span>)}</div></div><div className="bg-white border rounded-2xl p-5"><div className="flex justify-between"><b>Upcoming Events</b><button className="text-violet-600 text-sm">View all</button></div>{upcoming.map(e=><SmallEvent key={e.id} e={e}/>)}</div><div className="bg-white border rounded-2xl p-5"><b>Participants (6)</b><div className="flex mt-4 -space-x-2">{['a','b','c','d','e','f'].map(x=><img key={x} src={`https://i.pravatar.cc/80?u=${x}`} className="w-10 h-10 rounded-full border-2 border-white"/>)}<span className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center">+2</span></div></div><div className="bg-white border rounded-2xl p-5"><b>Quick Actions</b><div className="grid grid-cols-4 gap-3 mt-4 text-center text-xs"><Action icon={<Video/>} label="Schedule Meeting"/><button onClick={onCreate} className="flex flex-col items-center gap-2"><span className="p-3 rounded-xl bg-emerald-100"><Plus/></span>Create Event</button><Action icon={<Clock/>} label="Find Time"/><Action icon={<Users/>} label="My Availability"/></div></div></aside>}
function Action({icon,label}:{icon:any;label:string}){return <div className="flex flex-col items-center gap-2"><span className="p-3 rounded-xl bg-violet-100 text-violet-700">{icon}</span>{label}</div>}
function CreateEventModal({onClose,onCreate}:{onClose:()=>void;onCreate:(p:any)=>void}){const [title,setTitle]=useState('R-ZOOMA Research Meeting'); return <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl"><h2 className="text-xl font-bold mb-4">Create R-ZOOMA Event</h2><input className="w-full border rounded-xl p-3 mb-3" value={title} onChange={e=>setTitle(e.target.value)}/><div className="grid grid-cols-2 gap-3"><input className="border rounded-xl p-3" type="datetime-local" defaultValue="2026-05-27T14:00" id="start"/><input className="border rounded-xl p-3" type="datetime-local" defaultValue="2026-05-27T15:00" id="end"/></div><textarea className="w-full border rounded-xl p-3 my-3" placeholder="Meeting notes, agenda, protocol context"/><div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-xl border">Cancel</button><button onClick={()=>onCreate({title, subtitle:'Virtual', type:'MEETING', status:'SCHEDULED', startTime:(document.getElementById('start') as HTMLInputElement).value, endTime:(document.getElementById('end') as HTMLInputElement).value, color:'violet'})} className="px-4 py-2 rounded-xl bg-violet-600 text-white">Create</button></div></div></div>}
