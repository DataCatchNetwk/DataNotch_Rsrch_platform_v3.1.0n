'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Plus } from 'lucide-react';
import { workspaceOpsApi } from '@/src/lib/api/workspace-ops';

const fallback = [
  { id:'p1', title:'SDOH Readmission Analysis', objective:'Measure the influence of housing, income, and food access on readmission.', owner:'Jerry', progress:72, milestones:['Protocol approved','Dataset selected','Regression pending'], datasets:2, deliverables:3 },
  { id:'p2', title:'Population Health Equity Brief', objective:'Create publication-ready equity indicators and visualizations.', owner:'Amina', progress:46, milestones:['Cohort built','Quality review pending'], datasets:1, deliverables:2 },
];

export default function ProjectsPage(){
 const [projects,setProjects]=useState(fallback); const [title,setTitle]=useState(''); const [selected,setSelected]=useState(fallback[0]);
 useEffect(()=>{workspaceOpsApi.projects().then(setProjects).catch(()=>{})},[]);
 async function create(){ const payload={title:title||'New Research Project', objective:'Define objective, timeline, milestones, and deliverables', owner:'Current User'}; const p=await workspaceOpsApi.createProject(payload).catch(()=>({id:`p-${Date.now()}`,...payload,progress:0,milestones:[],datasets:0,deliverables:0})); setProjects([p as any,...projects]); setSelected(p as any); setTitle(''); }
 return <main className="p-8 bg-slate-50 min-h-screen space-y-6">
  <div className="flex justify-between"><div><p className="uppercase tracking-widest text-slate-500 text-sm">Workspace</p><h1 className="text-4xl font-bold">Projects</h1><p className="text-slate-600">Turn research goals into milestones, deliverables, linked datasets, and executable tasks.</p></div><button onClick={create} className="bg-violet-600 text-white rounded-xl px-4 h-11 flex gap-2 items-center"><Plus size={16}/> Create Project</button></div>
  <div className="bg-white rounded-2xl border p-4 flex gap-3"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="New project title..." className="border rounded-xl px-4 py-3 flex-1"/><button onClick={create} className="bg-slate-950 text-white rounded-xl px-5">Create</button></div>
  <div className="grid grid-cols-[1fr_380px] gap-6">
   <section className="space-y-4">{projects.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={`w-full bg-white rounded-2xl border p-6 text-left ${selected.id===p.id?'ring-2 ring-violet-400':''}`}><div className="flex justify-between"><h2 className="font-semibold text-xl">{p.title}</h2><span>{p.progress}%</span></div><p className="text-slate-600 mt-2">{p.objective}</p><div className="h-2 bg-slate-100 rounded-full mt-4"><div className="h-2 bg-violet-600 rounded-full" style={{width:`${p.progress}%`}}/></div><div className="flex gap-4 mt-4 text-sm text-slate-500"><span>{p.datasets} datasets</span><span>{p.deliverables} deliverables</span><span>Owner: {p.owner}</span></div></button>)}</section>
   <aside className="space-y-4"><div className="bg-white rounded-2xl border p-5"><h3 className="font-semibold">Milestones</h3><div className="space-y-2 mt-3">{selected.milestones.map((m:any)=><div key={m} className="border rounded-xl p-3 flex gap-2"><CheckCircle2 size={16} className="text-emerald-600"/> {m}</div>)}</div><button onClick={()=>workspaceOpsApi.createMilestone(selected.id,{title:'New milestone'}).catch(()=>null)} className="mt-3 w-full border rounded-xl py-2">Add Milestone</button></div>
   <div className="bg-white rounded-2xl border p-5"><h3 className="font-semibold">Project Handoff</h3>{['Create Dataset Task','Send to Cohort Builder','Launch Analysis Job','Create Publication Draft'].map(a=><button key={a} className="w-full border rounded-xl p-3 mt-2 flex justify-between">{a}<ArrowRight size={16}/></button>)}</div></aside>
  </div>
 </main>
}
